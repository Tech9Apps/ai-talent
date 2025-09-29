import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { DeleteCVRequestData, DeleteCVResponse } from "@shared/index";
import { withAuthentication, AuthenticatedContext } from "../../middleware/auth";

/**
 * Handle CV deletion logic
 */
async function handleDeleteCV(
  request: { data: DeleteCVRequestData },
  context: AuthenticatedContext
): Promise<DeleteCVResponse> {
  try {
    const userId = context.userId;
    const { fileId } = request.data;

    if (!fileId) {
      throw new HttpsError('invalid-argument', 'File ID is required');
    }

    logger.info("CV deletion started", { 
      structuredData: true, 
      userId, 
      fileId 
    });

    // Get file info from user's files collection
    const db = admin.firestore();
    const userFileRef = db.collection('users').doc(userId).collection('files').doc(fileId);
    const userFileDoc = await userFileRef.get();

    if (!userFileDoc.exists) {
      throw new HttpsError('not-found', 'CV not found or you do not have permission to delete it');
    }

    const fileData = userFileDoc.data();
    if (!fileData) {
      throw new HttpsError('not-found', 'CV file data not found');
    }

    if (fileData.uploadType !== 'cv') {
      throw new HttpsError('invalid-argument', 'Only CV files can be deleted with this function');
    }

    const storagePath = fileData.storagePath;

    // Start batch operations
    const batch = db.batch();

    // Queries to find related documents in other collections
    const cvsQuery = db.collection('cvs').where('fileId', '==', fileId);
    const fileProcessingQuery = db.collection('fileProcessing').where('fileId', '==', fileId);
    const cvsSnapshot = await cvsQuery.get();
    const fileProcessingSnapshot = await fileProcessingQuery.get();

    // 1. Delete from user files
    batch.delete(userFileRef);

    // 2. Delete from cvs collection
    cvsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 3. Delete from fileProcessing collection
    fileProcessingSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Execute batch operations
    await batch.commit();

    // 4. Delete file from Storage bucket
    if (storagePath) {
      try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(storagePath);
        await file.delete();
        logger.info("File deleted from storage", { 
          structuredData: true, 
          userId, 
          fileId, 
          storagePath 
        });
      } catch (storageError) {
        logger.warn("Failed to delete file from storage (may not exist)", { 
          structuredData: true, 
          userId, 
          fileId, 
          storagePath, 
          error: storageError 
        });
        // Continue even if storage deletion fails
      }
    }

    logger.info("CV deletion completed", { 
      structuredData: true, 
      userId, 
      fileId,
      fileName: fileData.fileName
    });

    return {
      success: true,
      message: `CV "${fileData.fileName}" deleted successfully`,
      deletedFileId: fileId,
    };

  } catch (error) {
    logger.error('CV deletion error', { 
      structuredData: true, 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      fileId: request.data?.fileId
    });

    // Re-throw HttpsError as is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Handle other errors
    throw new HttpsError('internal', 'CV deletion failed');
  }
}

/**
 * Delete existing CV and all associated data
 * Removes file from Storage, Firestore documents from cvs, fileProcessing, and user files
 */
export const deleteCV = onCall<DeleteCVRequestData, Promise<DeleteCVResponse>>(
  withAuthentication(handleDeleteCV)
);