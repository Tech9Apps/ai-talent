/**
 * Shared constants for AI Talent project
 * Used by both client and Firebase Functions
 */

/**
 * Supported file types for upload
 */
export const SUPPORTED_FILE_TYPES = {
  cv: ['.pdf', '.doc', '.docx', '.txt'],
  jobDescription: ['.pdf', '.doc', '.docx', '.txt'],
} as const;

/**
 * File validation configuration
 */
export const FILE_VALIDATION_CONFIG = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  supportedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
} as const;