/**
 * Shared types for AI Talent project
 * Used by both client and Firebase Functions
 */

/**
 * Upload type enum
 */
export type UploadType = 'cv' | 'jobDescription';

/**
 * File upload configuration (server-side)
 */
export interface FileUploadConfig {
  userId: string;
  fileName: string;
  fileType: string;
  uploadType: UploadType;
  fileData: string; // base64 encoded
}

/**
 * File metadata for storage
 */
export interface FileMetadata {
  userId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  uploadType: UploadType;
  uploadedAt: Date | FirebaseTimestamp; // Flexible for both environments
  fileSize: number;
  downloadURL?: string;
  storagePath: string;
}

/**
 * File upload request data (client to Functions)
 */
export interface FileUploadRequestData {
  fileData: string;
  fileName: string;
  fileType: string;
  uploadType: UploadType;
}

/**
 * File upload response (Functions to client)
 */
export interface FileUploadResponse {
  success: boolean;
  message: string;
  fileId: string;
  fileName: string;
  uploadType: UploadType;
  downloadURL?: string;
  processedAt: string;
  userId: string;
}

/**
 * Get files request data (client to Functions)
 */
export interface GetFilesRequestData {
  uploadType?: UploadType | 'all';
  limit?: number;
  startAfter?: string;
  includeDownloadUrls?: boolean;
}

/**
 * File info for client responses
 */
export interface FileInfo {
  fileId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  uploadType: UploadType;
  uploadedAt: string;
  fileSize: number;
  downloadURL?: string;
  processed?: boolean;
  status?: string;
}

/**
 * Get files response (Functions to client)
 */
export interface GetFilesResponse {
  success: boolean;
  files: FileInfo[];
  totalCount: number;
  hasMore: boolean;
  lastFileId?: string;
}

/**
 * Firebase Timestamp type (to avoid importing firebase-admin in client)
 */
interface FirebaseTimestamp {
  toDate(): Date;
  toMillis(): number;
}