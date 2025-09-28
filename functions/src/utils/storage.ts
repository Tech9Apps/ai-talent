/**
 * Firebase Storage utilities
 * Handles file upload, download, and management operations
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { 
  FileUploadConfig, 
  FileMetadata,
  validateFile 
} from "../../../shared";

/**
 * Uploads file to Firebase Storage
 * @param config - File upload configuration
 * @returns Promise<FileMetadata> - File metadata with storage info
 */
export async function uploadFileToStorage(config: FileUploadConfig): Promise<FileMetadata> {
  try {
    validateFile(config);

    const { userId, fileName, fileType, uploadType, fileData } = config;
    
    // Generate unique file name to prevent conflicts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFileName = `${timestamp}-${fileName}`;
    const storagePath = `users/${userId}/${uploadType}/${uniqueFileName}`;

    // Get Firebase Storage bucket
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);

    // Convert base64 to buffer
    const base64Data = fileData.split(',')[1] || fileData; // Remove data:mime;base64, prefix if exists
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload file to storage
    await file.save(buffer, {
      metadata: {
        contentType: fileType || 'application/octet-stream',
        metadata: {
          userId,
          uploadType,
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Make file publicly readable (optional - adjust based on your security needs)
    // await file.makePublic();

    // Get download URL
    const [downloadURL] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2030', // Long expiry for permanent access
    });

    const metadata: FileMetadata = {
      userId,
      fileName: uniqueFileName,
      originalName: fileName,
      fileType: fileType || 'application/octet-stream',
      uploadType,
      uploadedAt: admin.firestore.Timestamp.now() as any, // Cast needed for flexible type
      fileSize: buffer.length,
      downloadURL,
      storagePath,
    };

    logger.info("File uploaded to storage successfully", {
      structuredData: true,
      userId,
      fileName: uniqueFileName,
      originalName: fileName,
      storagePath,
      fileSize: buffer.length,
      timestamp: new Date().toISOString(),
    });

    return metadata;

  } catch (error) {
    logger.error("Error uploading file to storage", {
      structuredData: true,
      userId: config.userId,
      fileName: config.fileName,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}

/**
 * Deletes file from Firebase Storage
 * @param storagePath - Path to file in storage
 * @returns Promise<void>
 */
export async function deleteFileFromStorage(storagePath: string): Promise<void> {
  try {
    const bucket = admin.storage().bucket();
    await bucket.file(storagePath).delete();

    logger.info("File deleted from storage", {
      structuredData: true,
      storagePath,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error("Error deleting file from storage", {
      structuredData: true,
      storagePath,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}