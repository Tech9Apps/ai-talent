/**
 * Shared constants for AI Talent project
 * Used by both client and Firebase Functions
 */

/**
 * Supported file types for upload
 */
export const SUPPORTED_FILE_TYPES = {
  cv: ['.txt'],
  jobDescription: ['.txt'],
} as const;

/**
 * File validation configuration
 */
export const FILE_VALIDATION_CONFIG = {
  maxSizeBytes: 4 * 1024 * 1024, // 4MB - unified limit for all file operations
  supportedMimeTypes: [
    'text/plain',
  ],
} as const;