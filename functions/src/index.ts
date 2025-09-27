/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onRequest, onCall } from "firebase-functions/v2/https";
import { beforeUserCreated } from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

/**
 * Cloud Function triggered before a user is created
 * This will create the user document in Firestore after successful user creation
 */
export const createUserDocument = beforeUserCreated(async (event) => {
  const user = event.data;

  // Ensure user data exists
  if (!user) {
    logger.error("No user data found in event");
    throw new Error("No user data found");
  }

  try {
    const userDoc = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      emailVerified: user.emailVerified || false,
      phoneNumber: user.phoneNumber || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),

      // User profile information
      profile: {
        firstName: "",
        lastName: "",
        bio: "",
        location: "",
        website: "",
        dateOfBirth: null,
        skills: [],
        interests: [],
      },
    };

    // Create the user document in Firestore
    await admin.firestore().collection("users").doc(user.uid).set(userDoc);

    logger.info(`Successfully created user document for user: ${user.uid}`, {
      structuredData: true,
      userId: user.uid,
      email: user.email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error creating user document:", {
      structuredData: true,
      userId: user.uid,
      email: user.email,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    // Re-throw the error so Firebase knows the function failed
    throw error;
  }
});

/**
 * Cloud Function to process uploaded files (CV or Job Descriptions)
 * This function will be called from the frontend when users upload files
 */
export const processUploadedFile = onCall(async (request) => {
  try {
    const { fileData, fileName, fileType, uploadType } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new Error("User must be authenticated to upload files");
    }

    if (!fileData || !fileName || !uploadType) {
      throw new Error("Missing required file data");
    }

    logger.info("Processing uploaded file", {
      structuredData: true,
      userId,
      fileName,
      fileType: fileType || 'unknown',
      uploadType,
      fileSize: fileData?.length || 0,
      timestamp: new Date().toISOString(),
    });

    // Here you would typically:
    // 1. Save file to Cloud Storage
    // 2. Extract text from PDF/DOC files
    // 3. Analyze content with AI/ML services
    // 4. Store analysis results in Firestore
    // 5. Update user statistics

    // For now, just log and return success
    const result = {
      success: true,
      message: `File "${fileName}" processed successfully`,
      uploadType,
      processedAt: new Date().toISOString(),
      userId,
      fileName,
      fileType: fileType || 'unknown',
    };

    // Update user upload statistics
    try {
      await admin.firestore()
        .collection("users")
        .doc(userId)
        .update({
          "aiTalent.totalUploads": admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      
      logger.info(`Updated user statistics for user: ${userId}`);
    } catch (updateError) {
      logger.warn("Failed to update user statistics", { 
        userId, 
        error: updateError instanceof Error ? updateError.message : String(updateError) 
      });
      // Don't fail the whole function if stats update fails
    }

    // Store file processing record
    try {
      await admin.firestore()
        .collection("fileProcessing")
        .add({
          userId,
          fileName,
          fileType: fileType || 'unknown',
          uploadType,
          status: 'processed',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          result: {
            success: true,
            message: result.message,
          }
        });
      
      logger.info(`Stored file processing record for: ${fileName}`);
    } catch (storeError) {
      logger.warn("Failed to store file processing record", { 
        fileName, 
        error: storeError instanceof Error ? storeError.message : String(storeError)
      });
    }

    return result;

  } catch (error) {
    logger.error("Error processing uploaded file:", {
      structuredData: true,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    
    throw error;
  }
});

/**
 * HTTP function to get user upload statistics
 * Can be used for analytics dashboard
 */
export const getUserStats = onCall(async (request) => {
  try {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new Error("User must be authenticated");
    }

    // Get user document
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new Error("User document not found");
    }

    const userData = userDoc.data();
    
    // Get file processing history
    const fileProcessingQuery = await admin.firestore()
      .collection("fileProcessing")
      .where("userId", "==", userId)
      .orderBy("processedAt", "desc")
      .limit(10)
      .get();

    const recentFiles = fileProcessingQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const stats = {
      totalUploads: userData?.aiTalent?.totalUploads || 0,
      successfulMatches: userData?.aiTalent?.successfulMatches || 0,
      userLevel: userData?.aiTalent?.level || 'beginner',
      recentFiles: recentFiles,
      lastUpdated: new Date().toISOString(),
    };

    logger.info(`Retrieved stats for user: ${userId}`);
    return stats;

  } catch (error) {
    logger.error("Error getting user stats:", {
      structuredData: true,
      error: error instanceof Error ? error.message : String(error),
    });
    
    throw error;
  }
});
