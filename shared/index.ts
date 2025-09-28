/**
 * AI Talent Shared Library
 * Common types, constants, and utilities for client and Firebase Functions
 */

// Export constants
export * from './constants/fileConstants';

// Export types
export type {
  UploadType,
  FirebaseTimestamp,
  FileUploadConfig,
  FileMetadata,
  UserFileRecord,
  FileUploadRequestData,
  FileUploadResponse,
  FileInfo,
  GetFilesRequestData,
  GetFilesResponse,
  DeleteCVRequestData,
  DeleteCVResponse,
} from './types/fileTypes';
export * from './types/aiTypes';

// Export utilities
export * from './utils/validation';