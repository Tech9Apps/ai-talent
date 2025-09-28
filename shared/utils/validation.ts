/**
 * Shared validation utilities for AI Talent project
 * Used by both client and Firebase Functions
 */

import { FILE_VALIDATION_CONFIG, SUPPORTED_FILE_TYPES } from "../constants/fileConstants";
import type { FileUploadConfig, UploadType } from "../types/fileTypes";


/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

/**
 * Validates file extension
 * @param fileName - Name of the file
 * @param uploadType - Type of upload
 * @returns File extension if valid
 * @throws ValidationError if invalid
 */
export function validateFileExtension(fileName: string, uploadType: UploadType): string {
  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  const supportedExtensions = SUPPORTED_FILE_TYPES[uploadType];
  
  if (!(supportedExtensions as readonly string[]).includes(fileExtension)) {
    throw new ValidationError(
      `Unsupported file type: ${fileExtension}. Supported types: ${supportedExtensions.join(', ')}`,
      'UNSUPPORTED_FILE_TYPE'
    );
  }

  return fileExtension;
}

/**
 * Validates file size from base64 data
 * @param fileData - Base64 encoded file data
 * @returns Estimated file size in bytes
 * @throws ValidationError if too large
 */
export function validateFileSize(fileData: string): number {
  // Base64 encoded, so actual size is ~75% of string length
  const estimatedSizeBytes = Math.round(fileData.length * 0.75);
  
  if (estimatedSizeBytes > FILE_VALIDATION_CONFIG.maxSizeBytes) {
    throw new ValidationError(
      `File too large: ${Math.round(estimatedSizeBytes / 1024 / 1024)}MB. Maximum size: 10MB`,
      'FILE_TOO_LARGE'
    );
  }

  return estimatedSizeBytes;
}

/**
 * Validates MIME type (optional validation)
 * @param fileType - MIME type of the file
 * @returns boolean indicating if supported
 */
export function validateMimeType(fileType: string): boolean {
  if (!fileType) return true; // Allow files without MIME type
  
  return (FILE_VALIDATION_CONFIG.supportedMimeTypes as readonly string[]).includes(fileType);
}

/**
 * Validates file configuration (server-side)
 * @param config - File upload configuration
 * @throws ValidationError if validation fails
 */
export function validateFile(config: FileUploadConfig): void {
  const { fileName, fileType, uploadType, fileData } = config;

  // Validate required fields
  if (!fileName) {
    throw new ValidationError('File name is required', 'MISSING_FILE_NAME');
  }

  if (!uploadType || !['cv', 'jobDescription'].includes(uploadType)) {
    throw new ValidationError('Valid upload type is required (cv or jobDescription)', 'INVALID_UPLOAD_TYPE');
  }

  if (!fileData) {
    throw new ValidationError('File data is required', 'MISSING_FILE_DATA');
  }

  // Validate file extension
  validateFileExtension(fileName, uploadType);

  // Validate file size
  validateFileSize(fileData);

  // Validate MIME type (warning only)
  if (fileType && !validateMimeType(fileType)) {
    console.warn(`Unexpected MIME type: ${fileType}. File will still be processed.`);
  }
}

/**
 * Validates browser File object (client-side)
 * @param file - Browser File object
 * @param uploadType - Type of upload
 * @throws ValidationError if validation fails
 */
export function validateBrowserFile(file: File, uploadType: UploadType): void {
  // Validate file size
  if (file.size > FILE_VALIDATION_CONFIG.maxSizeBytes) {
    throw new ValidationError(
      `File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum size: 10MB`,
      'FILE_TOO_LARGE'
    );
  }

  // Validate file extension
  validateFileExtension(file.name, uploadType);

  // Validate MIME type (warning only)
  if (file.type && !validateMimeType(file.type)) {
    console.warn(`Unexpected MIME type: ${file.type}. File will still be processed.`);
  }
}