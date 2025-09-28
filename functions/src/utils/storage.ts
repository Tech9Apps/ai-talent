/**
 * Firebase Storage utilities
 * Handles file upload, download, and management operations
 */
import * as path from "path";
import { FileUploadConfig, FileMetadata, validateFile, FILE_VALIDATION_CONFIG } from "@shared/index";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

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

    // Enforce file size limit
    if (buffer.length > FILE_VALIDATION_CONFIG.maxSizeBytes) {
      throw new Error(`File too large. Max: ${Math.round(FILE_VALIDATION_CONFIG.maxSizeBytes/1024/1024)}MB`);
    }

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

    logger.info("File saved to storage successfully", {
      structuredData: true,
      userId,
      fileName: uniqueFileName,
      storagePath,
      fileSize: buffer.length,
      timestamp: new Date().toISOString(),
    });

    const metadata: FileMetadata = {
      userId,
      fileName: uniqueFileName,
      originalName: fileName,
      fileType: fileType || 'application/octet-stream',
      uploadType,
      uploadedAt: admin.firestore.Timestamp.now() as unknown as Date, // Cast needed for flexible type
      fileSize: buffer.length,
      downloadURL: "", // No public download URL - file is private
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = {
      structuredData: true,
      userId: config.userId,
      fileName: config.fileName,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };

    logger.error("Error uploading file to storage", errorDetails);

    // Create more specific error messages based on the error type
    let specificErrorMessage = "Failed to upload file to storage";
    
    if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
      specificErrorMessage = "Storage permission denied. Please contact support.";
    } else if (errorMessage.includes('quota') || errorMessage.includes('Quota')) {
      specificErrorMessage = "Storage quota exceeded. Please contact support.";
    } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
      specificErrorMessage = "Network error while uploading file. Please try again.";
    } else if (errorMessage.includes('bucket') || errorMessage.includes('Bucket')) {
      specificErrorMessage = "Storage configuration error. Please contact support.";
    } else if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
      specificErrorMessage = "Invalid file data. Please check your file and try again.";
    }

    // Throw a new error with the specific message
    throw new Error(specificErrorMessage);
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

// Función para extraer texto de archivo en Firebase Storage
export async function extractTextFromStorageFile(
  storagePath: string,
  originalName: string
): Promise<string> {
  try {
    logger.info("Downloading file from storage for text extraction", {
      structuredData: true,
      storagePath,
      originalName,
    });

    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);
    const [buffer] = await file.download();

    logger.info("File downloaded from storage", {
      structuredData: true,
      storagePath,
      downloadedSize: buffer.length,
    });

    return await extractTextFromBuffer(buffer, originalName);
  } catch (error) {
    logger.error("Storage file text extraction failed", {
      structuredData: true,
      storagePath,
      originalName,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Función para extraer texto de archivos .txt
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const fileExtension = path.extname(fileName).toLowerCase();

  logger.info("Extracting text from file", {
    structuredData: true,
    fileName,
    fileExtension,
    size: buffer.length,
  });

  try {
    if (fileExtension !== ".txt") {
      throw new Error(`Unsupported file type: ${fileExtension}. Only .txt files are supported.`);
    }

    const textContent = buffer.toString("utf-8");
    logger.info("Text file content extracted", {
      structuredData: true,
      fileName,
      textLength: textContent.length,
    });
    return textContent;
  } catch (error) {
    logger.error("Text extraction failed", {
      structuredData: true,
      fileName,
      fileExtension,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      `Failed to extract text from file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}