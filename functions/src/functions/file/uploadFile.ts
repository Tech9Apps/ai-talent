/**
 * File processing Firebase Functions
 * Handles file upload, processing, and management
 */

import { onCall, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  withAuthentication,
  AuthenticatedContext,
} from "../../middleware/auth";
import {
  uploadFileToStorage,
} from "../../utils/storage";
import {
  FileUploadConfig,
  FileMetadata,
  FileUploadRequestData,
  FileUploadResponse
} from "../../../../shared";

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
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    // Don't fail the whole function if stats update fails
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

  // Validate required data
  if (!fileData || !fileName || !uploadType) {
    throw new Error(
      "Missing required file data: fileData, fileName, and uploadType are required"
    );
  }

  if (!["cv", "jobDescription"].includes(uploadType)) {
    throw new Error("Invalid uploadType. Must be 'cv' or 'jobDescription'");
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

  try {
    // 1. Upload file to Firebase Storage
    const uploadConfig: FileUploadConfig = {
      userId,
      fileName,
      fileType: fileType || "application/octet-stream",
      uploadType,
      fileData,
    };

    const fileMetadata = await uploadFileToStorage(uploadConfig);

    // 2. Store file record in Firestore
    const fileId = await storeFileRecord(fileMetadata, userId);

    // 3. Update user statistics
    await updateUserStatistics(userId, uploadType);

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
    logger.error("Error processing file upload", {
      structuredData: true,
      userId,
      fileName,
      uploadType,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    throw error;
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
