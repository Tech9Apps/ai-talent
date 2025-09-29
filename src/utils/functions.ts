/**
 * Firebase Functions client utilities with proper error handling
 * Provides typed interfaces and comprehensive error management
 */

import { httpsCallable, type HttpsCallableResult } from "firebase/functions";
import { functions } from "../firebase";
import { 
  validateBrowserFile,
  ValidationError
} from "../../shared";
import type { 
  FileUploadRequestData,
  FileUploadResponse,
  GetFilesRequestData,
  GetFilesResponse,
  DeleteCVRequestData,
  DeleteCVResponse
} from "../../shared";

/**
 * Custom error class for Firebase Functions errors
 */
export class FunctionsError extends Error {
  code: string;
  details?: unknown;
  
  constructor(
    message: string,
    code: string,
    details?: unknown
  ) {
    super(message);
    this.name = "FunctionsError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Validates file before upload
 * @param file - File to validate
 * @param uploadType - Type of upload
 * @throws FunctionsError if validation fails
 */
export function validateFile(file: File, uploadType: 'cv' | 'jobDescription'): void {
  try {
    validateBrowserFile(file, uploadType);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new FunctionsError(error.message, error.code);
    }
    throw error;
  }
}


export function getFriendlyErrorMessage(error: unknown): string {
  // Handle Firebase Functions errors
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const firebaseError = error as { code: string; message?: string };
    switch (firebaseError.code) {
      case 'unauthenticated':
        return 'Please sign in to upload files';
      case 'permission-denied':
        return 'You do not have permission to perform this action';
      case 'invalid-argument':
        return firebaseError.message || 'Invalid file data. Please check your file and try again';
      case 'resource-exhausted':
        return 'Storage quota exceeded or too many requests. Please wait a moment and try again';
      case 'deadline-exceeded':
        return 'Upload timeout. Please check your connection and try again';
      case 'internal':
        return firebaseError.message || 'Server error occurred. Please try again later';
      case 'unavailable':
        return 'Service temporarily unavailable. Please try again';
      case 'cancelled':
        return 'Upload was cancelled. Please try again';
      case 'failed-precondition':
        return 'Upload failed due to system requirements. Please try again';
      default:
        return firebaseError.message || 'An unexpected error occurred';
    }
  }

  if (error instanceof FunctionsError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Handle specific error patterns
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('connection')) {
      return 'Network error. Please check your internet connection and try again';
    }
    if (message.includes('timeout')) {
      return 'Upload timeout. Please try again';
    }
    if (message.includes('cors')) {
      return 'CORS error. Please refresh the page and try again';
    }
    if (message.includes('file too large') || message.includes('size')) {
      return 'File is too large. Maximum size is 10MB';
    }
    if (message.includes('unsupported') || message.includes('format')) {
      return 'Unsupported file format. Please use PDF, DOC, or DOCX files';
    }
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Converts file to base64 data URL
 * @param file - File to convert
 * @returns Promise<string> - Base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads file using Firebase Functions with comprehensive error handling
 * @param file - File to upload
 * @param uploadType - Type of upload ('cv' or 'jobDescription')
 * @returns Promise<FileUploadResponse>
 * @throws FunctionsError for various error scenarios
 */
export async function uploadFile(
  file: File, 
  uploadType: 'cv' | 'jobDescription'
): Promise<FileUploadResponse> {
  try {
    // Client-side validation
    validateFile(file, uploadType);

    // Convert file to base64
    const fileData = await fileToBase64(file);

    // Prepare request data
    const requestData: FileUploadRequestData = {
      fileData,
      fileName: file.name,
      fileType: file.type,
      uploadType,
    };

    // Call Firebase Function
    const processFile = httpsCallable<FileUploadRequestData, FileUploadResponse>(
      functions, 
      "processUploadedFile"
    );

    const result: HttpsCallableResult<FileUploadResponse> = await processFile(requestData);
    
    if (!result.data.success) {
      throw new FunctionsError(
        result.data.message || 'Upload failed',
        'UPLOAD_FAILED',
        result.data
      );
    }

    return result.data;

  } catch (error: unknown) {
    console.error('Upload error:', error);

    // If it's already our custom error, re-throw it
    if (error instanceof FunctionsError) {
      throw error;
    }

    // Handle Firebase Functions errors
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
      const firebaseError = error as { code: string; message: string; details?: unknown };
      throw new FunctionsError(
        getFriendlyErrorMessage(error),
        firebaseError.code,
        firebaseError.details
      );
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new FunctionsError(
      'Failed to upload file: ' + errorMessage,
      'UNKNOWN_ERROR',
      error
    );
  }
}

/**
 * Gets user files using Firebase Functions (optional - can also use Firestore directly)
 * @param options - Query options
 * @returns Promise<GetFilesResponse>
 */
export async function getUserFiles(
  options: GetFilesRequestData = {}
): Promise<GetFilesResponse> {
  try {
    const getFiles = httpsCallable<GetFilesRequestData, GetFilesResponse>(
      functions,
      "getUserFiles"
    );

    const result: HttpsCallableResult<GetFilesResponse> = await getFiles(options);
    
    if (!result.data.success) {
      throw new FunctionsError(
        'Failed to retrieve files',
        'GET_FILES_FAILED',
        result.data
      );
    }

    return result.data;

  } catch (error: unknown) {
    console.error('Get files error:', error);

    if (error instanceof FunctionsError) {
      throw error;
    }

    throw new FunctionsError(
      getFriendlyErrorMessage(error),
      typeof error === 'object' && error !== null && 'code' in error 
        ? (error as { code: string }).code 
        : 'GET_FILES_ERROR',
      error
    );
  }
}

/**
 * Alternative: Get files directly from Firestore (recommended for most cases)
 * This would be implemented using Firestore SDK directly in your component
 */
export function getUserFilesFromFirestore(): void {
  throw new Error('Not implemented - use Firestore SDK directly in your component');
}

/**
 * Processes uploaded file with AI analysis
 * @param fileId - ID of the uploaded file
 * @param uploadType - Type of upload ('cv' or 'jobDescription')
 * @returns Promise with AI analysis results
 */
export async function processFileWithAI(
  fileId: string,
  uploadType: 'cv' | 'jobDescription'
): Promise<{ success: boolean; warnings: string[]; [key: string]: unknown }> {
  try {
    const processAI = httpsCallable(functions, "processFileWithAI");
    
    const result = await processAI({
      fileId,
      uploadType
    });

    const data = result.data as { success: boolean; message?: string; warnings?: string[] };
    
    if (!data.success) {
      throw new FunctionsError(
        data.message || 'AI processing failed',
        'AI_PROCESSING_FAILED',
        result.data
      );
    }

    return { ...data, warnings: data.warnings || [] };
  } catch (error: unknown) {
    console.error('AI processing error:', error);
    
    if (error instanceof FunctionsError) {
      throw error;
    }

    throw new FunctionsError(
      getFriendlyErrorMessage(error),
      'AI_PROCESSING_ERROR',
      error
    );
  }
}

/**
 * Finds job matches for uploaded CV
 * @param fileId - ID of the uploaded CV file
 * @returns Promise with job matches
 */
export async function findJobMatches(
  fileId: string
): Promise<{ success: boolean; warnings: string[]; totalMatches?: number; [key: string]: unknown }> {
  try {
    const findMatches = httpsCallable(functions, "findJobMatches");
    
    const result = await findMatches({
      fileId
    });

    const data = result.data as { success: boolean; message?: string; warnings?: string[]; totalMatches?: number };

    if (!data.success) {
      throw new FunctionsError(
        data.message || 'Job matching failed',
        'JOB_MATCHING_FAILED',
        result.data
      );
    }

    return { ...data, warnings: data.warnings || [] };
  } catch (error: unknown) {
    console.error('Job matching error:', error);
    
    if (error instanceof FunctionsError) {
      throw error;
    }

    throw new FunctionsError(
      getFriendlyErrorMessage(error),
      'JOB_MATCHING_ERROR',
      error
    );
  }
}

/**
 * Delete existing CV and all associated data
 * @param fileId - ID of the CV file to delete
 * @returns Promise with deletion result
 */
export async function deleteCV(fileId: string): Promise<DeleteCVResponse> {
  try {
    // Prepare request data
    const requestData: DeleteCVRequestData = {
      fileId,
    };

    // Call Firebase Function
    const deleteCVFunction = httpsCallable<DeleteCVRequestData, DeleteCVResponse>(
      functions, 
      "deleteCV"
    );

    const result = await deleteCVFunction(requestData);
    
    if (!result.data.success) {
      throw new FunctionsError(
        result.data.message || 'CV deletion failed',
        'DELETE_FAILED',
        result.data
      );
    }

    return result.data;

  } catch (error: unknown) {
    console.error('CV deletion error:', error);

    // If it's already our custom error, re-throw it
    if (error instanceof FunctionsError) {
      throw error;
    }

    // Handle Firebase Functions errors
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
      const firebaseError = error as { code: string; message: string; details?: unknown };
      throw new FunctionsError(
        firebaseError.message || 'CV deletion failed',
        firebaseError.code || 'DELETE_ERROR',
        firebaseError.details
      );
    }

    throw new FunctionsError(
      getFriendlyErrorMessage(error),
      'DELETE_ERROR',
      error
    );
  }
}