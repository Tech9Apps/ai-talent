/**
 * File processing Firebase Functions
 * Handles file upload, processing, and management
 */

import { onCall, CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  withAuthentication,
  AuthenticatedContext,
} from "../../middleware/auth";
import {
  uploadFileToStorage,
} from "../../utils/storage";

import { ValidationError } from "../../../../shared/utils/validation";
import { FileMetadata, FileUploadRequestData, FileUploadResponse, FileUploadConfig } from "@shared/index";

/**
 * Updates user statistics after successful upload
 * @param userId - User ID
 * @param uploadType - Type of upload (cv or jobDescription)
 */
async function updateUserStatistics(
  userId: string,
  uploadType: "cv" | "jobDescription"
): Promise<void> {
  try {
    const userRef = admin.firestore().collection("users").doc(userId);

    if (uploadType !== "jobDescription") {
      logger.info(
        `Skipping user statistics update for uploadType: ${uploadType}`,
        {
          structuredData: true,
          userId,
          uploadType,
        }
      );
      return;
    }

    await userRef.update({
      [`aiTalent.${uploadType}Uploads`]:
        admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Updated user statistics for user: ${userId}`, {
      structuredData: true,
      userId,
      uploadType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.warn("Failed to update user statistics", {
      structuredData: true,
      userId,
      uploadType,
      error: error,
      timestamp: new Date().toISOString(),
    });
    // Don't fail the whole function if stats update fails
  }
}

/**
 * Ensures user document exists in Firestore, creates it if it doesn't
 * @param userId - User ID
 * @param userInfo - User information from auth context
 */
async function ensureUserExists(userId: string, userInfo: any): Promise<void> {
  try {
    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        uid: userId,
        displayName: userInfo?.name || userInfo?.displayName || "",
        email: userInfo?.email || "",
        photoURL: userInfo?.picture || userInfo?.photoURL || "",
        aiTalent: {
          jobDescriptionUploads: 0,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Created new user document", {
        structuredData: true,
        userId,
        email: userInfo?.email || "",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.warn("Failed to create user document", {
      structuredData: true,
      userId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    // Don't fail the upload if user creation fails
  }
}

/**
 * Stores file metadata and processing record in Firestore
 * @param fileMetadata - File metadata from storage
 * @param userId - User ID
 * @returns Promise<string> - Document ID of the stored record
 */
async function storeFileRecord(
  fileMetadata: FileMetadata,
  userId: string
): Promise<string> {
  try {
    // Store in user's files subcollection
    const fileRef = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("files")
      .add({
        ...fileMetadata,
        status: "uploaded",
        processed: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Also store in global file processing collection for admin purposes
    await admin
      .firestore()
      .collection("fileProcessing")
      .add({
        fileId: fileRef.id,
        userId,
        fileName: fileMetadata.fileName,
        originalName: fileMetadata.originalName,
        fileType: fileMetadata.fileType,
        uploadType: fileMetadata.uploadType,
        status: "uploaded",
        storagePath: fileMetadata.storagePath,
        uploadedAt: fileMetadata.uploadedAt,
        result: {
          success: true,
          message: "File uploaded successfully",
        },
      });

    logger.info(`Stored file processing record`, {
      structuredData: true,
      fileId: fileRef.id,
      userId,
      fileName: fileMetadata.originalName,
      timestamp: new Date().toISOString(),
    });

    return fileRef.id;
  } catch (error) {
    logger.error("Failed to store file processing record", {
      structuredData: true,
      userId,
      fileName: fileMetadata.originalName,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Internal handler for file upload processing
 * @param request - Callable request with file data
 * @param context - Authenticated user context
 * @returns Promise<FileUploadResponse>
 */
async function handleFileUpload(
  request: CallableRequest<FileUploadRequestData>,
  context: AuthenticatedContext
): Promise<FileUploadResponse> {
  const { fileData, fileName, fileType, uploadType } = request.data;
  const { userId } = context;

  try {
    // Validate required data
    if (!fileData || !fileName || !uploadType) {
      throw new HttpsError(
        'invalid-argument',
        "Missing required file data: fileData, fileName, and uploadType are required"
      );
    }

    if (!["cv", "jobDescription"].includes(uploadType)) {
      throw new HttpsError(
        'invalid-argument',
        "Invalid uploadType. Must be 'cv' or 'jobDescription'"
      );
    }

    logger.info("Processing file upload", {
      structuredData: true,
      userId,
      fileName,
      fileType: fileType || "unknown",
      uploadType,
      fileSize: fileData?.length || 0,
      timestamp: new Date().toISOString(),
    });

    // 0. Ensure user exists in Firestore
    await ensureUserExists(userId, {
      name: request.auth?.token?.name,
      email: request.auth?.token?.email,
      picture: request.auth?.token?.picture
    });

    // 1. Upload file to Firebase Storage
    let fileMetadata: FileMetadata;
    try {
      const uploadConfig: FileUploadConfig = {
        userId,
        fileName,
        fileType: fileType || "application/octet-stream",
        uploadType,
        fileData,
      };

      fileMetadata = await uploadFileToStorage(uploadConfig);
    } catch (storageError) {
      const errorMessage = storageError instanceof Error ? storageError.message : String(storageError);
      logger.error("Storage upload failed", {
        structuredData: true,
        userId,
        fileName,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      // Determine error type and throw appropriate HttpsError
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        throw new HttpsError('permission-denied', 'Storage permission denied. Please contact support.');
      } else if (errorMessage.includes('quota') || errorMessage.includes('Quota')) {
        throw new HttpsError('resource-exhausted', 'Storage quota exceeded. Please contact support.');
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        throw new HttpsError('unavailable', 'Network error while uploading. Please check your connection and try again.');
      } else if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
        throw new HttpsError('invalid-argument', 'Invalid file data. Please verify your file is not corrupted and try again.');
      } else if (errorMessage.includes('Unsupported file type') || errorMessage.includes('FILE_TOO_LARGE')) {
        throw new HttpsError('invalid-argument', errorMessage);
      } else {
        throw new HttpsError('internal', 'Failed to upload file to storage. Please try again later.');
      }
    }

    // 2. Store file record in Firestore
    let fileId: string;
    try {
      fileId = await storeFileRecord(fileMetadata, userId);
    } catch (firestoreError) {
      const errorMessage = firestoreError instanceof Error ? firestoreError.message : String(firestoreError);
      logger.error("Failed to store file record", {
        structuredData: true,
        userId,
        fileName,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      // Clean up uploaded file if Firestore fails
      try {
        await admin.storage().bucket().file(fileMetadata.storagePath).delete();
        logger.info("Cleaned up uploaded file after Firestore failure", {
          structuredData: true,
          storagePath: fileMetadata.storagePath,
        });
      } catch (cleanupError) {
        logger.warn("Failed to clean up file after Firestore error", {
          structuredData: true,
          storagePath: fileMetadata.storagePath,
          cleanupError: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        });
      }

      throw new HttpsError('internal', 'Failed to save file information. Please try again later.');
    }

    // 3. Update user statistics (non-critical)
    try {
      await updateUserStatistics(userId, uploadType);
    } catch (statsError) {
      // Log but don't fail the upload for statistics errors
      logger.warn("Failed to update user statistics", {
        structuredData: true,
        userId,
        uploadType,
        error: statsError instanceof Error ? statsError.message : String(statsError),
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Future: Here you would typically:
    // - Extract text from PDF/DOC files
    // - Analyze content with AI/ML services (OpenAI, Google AI, etc.)
    // - Process CV data for job matching
    // - Generate recommendations

    const response: FileUploadResponse = {
      success: true,
      message: `File "${fileName}" uploaded and processed successfully`,
      fileId,
      fileName: fileMetadata.fileName,
      uploadType,
      downloadURL: fileMetadata.downloadURL,
      processedAt: new Date().toISOString(),
      userId,
    };

    logger.info("File upload completed successfully", {
      structuredData: true,
      userId,
      fileId,
      fileName,
      uploadType,
      timestamp: new Date().toISOString(),
    });

    return response;

  } catch (error) {
    // If it's already an HttpsError, re-throw it
    if (error instanceof HttpsError) {
      throw error;
    }

    // Handle ValidationError from shared validation
    if (error instanceof ValidationError) {
      throw new HttpsError('invalid-argument', error.message);
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Unexpected error processing file upload", {
      structuredData: true,
      userId,
      fileName,
      uploadType,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    throw new HttpsError('internal', 'An unexpected error occurred while processing your file. Please try again later.');
  }
}

/**
 * Cloud Function to process uploaded files (CV or Job Descriptions)
 * This function uploads files to Firebase Storage and stores metadata
 */
export const processUploadedFile = onCall<
  FileUploadRequestData,
  Promise<FileUploadResponse>
>(withAuthentication(handleFileUpload));
