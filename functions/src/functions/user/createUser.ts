/**
 * User-related Firebase Functions
 * Handles user creation, updates, and management
 */

import { beforeUserCreated } from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

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

      // AI Talent specific data
      aiTalent: {
        cvUploads: 0,
        jobDescriptionUploads: 0,
        preferences: {
          notifications: true,
        },
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