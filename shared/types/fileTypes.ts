/**
 * Shared types for AI Talent project
 * Used by both client and Firebase Functions
 */

/**
 * Upload type enum
 */
export type UploadType = 'cv' | 'jobDescription';

/**
 * Firebase Timestamp type (to avoid importing firebase-admin in client)
 */
export interface FirebaseTimestamp {
  toDate(): Date;
  toMillis(): number;
}

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
  fileSize: number;
  uploadType: UploadType;
  storagePath: string;
  downloadURL: string;
  uploadedAt: Date;
}

/**
 * User file record (stored in Firestore users/{userId}/files collection)
 * This represents the structure saved in Firestore
 */
export interface UserFileRecord {
  id?: string;
  userId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  uploadType: UploadType;
  storagePath: string;
  downloadURL: string;
  uploadedAt: FirebaseTimestamp;
  size: number;
  status: string; // "uploaded", "processing", "completed", "error"
  processed: boolean;
  aiProcessed?: boolean;
  aiAnalysis?: Record<string, unknown>;
  matchesFound?: number;
  createdAt: FirebaseTimestamp;
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
 * Delete CV request data (client to Functions)
 */
export interface DeleteCVRequestData {
  fileId: string;
}

/**
 * Delete CV response (Functions to client)
 */
export interface DeleteCVResponse {
  success: boolean;
  message: string;
  deletedFileId?: string;
}

