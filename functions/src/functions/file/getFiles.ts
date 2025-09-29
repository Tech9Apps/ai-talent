/**
 * File retrieval Firebase Functions
 * Provides server-side file access with advanced filtering and security
 */

import { onCall, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { withAuthentication, AuthenticatedContext } from "../../middleware/auth";
import { GetFilesRequestData, GetFilesResponse, FileInfo } from "@shared/index";



/**
 * Internal handler for getting user files
 * @param request - Callable request with query parameters
 * @param context - Authenticated user context
 * @returns Promise<GetFilesResponse>
 */
async function handleGetFiles(
  request: CallableRequest<GetFilesRequestData>,
  context: AuthenticatedContext
): Promise<GetFilesResponse> {
  const { 
    uploadType = 'all', 
    limit = 20, 
    startAfter, 
  } = request.data || {};
  const { userId } = context;

  try {
    logger.info("Getting user files", {
      structuredData: true,
      userId,
      uploadType,
      limit,
      timestamp: new Date().toISOString(),
    });

    // Build query for user's files
    let query = admin.firestore()
      .collection("users")
      .doc(userId)
      .collection("files")
      .orderBy("createdAt", "desc");

    // Filter by upload type if specified
    if (uploadType !== 'all') {
      query = query.where("uploadType", "==", uploadType);
    }

    // Add pagination
    if (startAfter) {
      const startAfterDoc = await admin.firestore()
        .collection("users")
        .doc(userId)
        .collection("files")
        .doc(startAfter)
        .get();
      
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    // Apply limit (add 1 to check if there are more)
    query = query.limit(limit + 1);

    const snapshot = await query.get();
    const files: FileInfo[] = [];
    let hasMore = false;

    // Process results
    for (let i = 0; i < snapshot.docs.length; i++) {
      if (i === limit) {
        hasMore = true;
        break;
      }

      const doc = snapshot.docs[i];
      const data = doc.data();

      const fileInfo: FileInfo = {
        fileId: doc.id,
        fileName: data.fileName,
        originalName: data.originalName,
        fileType: data.fileType,
        uploadType: data.uploadType,
        uploadedAt: data.uploadedAt?.toDate?.()?.toISOString() || data.uploadedAt,
        fileSize: data.fileSize || 0,
        processed: data.processed || false,
        status: data.status || 'unknown',
      };

      files.push(fileInfo);
    }

    const response: GetFilesResponse = {
      success: true,
      files,
      totalCount: files.length,
      hasMore,
      lastFileId: files.length > 0 ? files[files.length - 1].fileId : undefined,
    };

    logger.info("Files retrieved successfully", {
      structuredData: true,
      userId,
      filesCount: files.length,
      hasMore,
      timestamp: new Date().toISOString(),
    });

    return response;

  } catch (error) {
    logger.error("Error retrieving user files", {
      structuredData: true,
      userId,
      uploadType,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}

/**
 * Cloud Function to get user's uploaded files
 * This provides server-side file listing with advanced filtering
 * 
 * Note: For simple file downloads, clients can use Firebase Storage SDK directly.
 * This function is useful for:
 * - Complex queries and filtering
 * - Server-side access control
 * - Analytics and logging
 * - Generating temporary download URLs
 */
export const getUserFiles = onCall<GetFilesRequestData, Promise<GetFilesResponse>>(
  withAuthentication(handleGetFiles)
);

/**
 * You're absolutely right! For most cases, the client can directly:
 * 
 * 1. Query Firestore for file metadata:
 *    const files = await db.collection('users').doc(userId).collection('files').get()
 * 
 * 2. Download files from Storage:
 *    const url = await getDownloadURL(ref(storage, 'path/to/file'))
 * 
 * 3. This Cloud Function is only needed for:
 *    - Complex server-side filtering
 *    - Admin operations
 *    - When you need to generate temporary URLs server-side
 *    - Analytics and logging of file access
 */