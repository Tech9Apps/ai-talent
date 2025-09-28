/**
 * User-related Firebase Functions
 * Handles user creation, updates, and management
 */

import { user } from "firebase-functions/v1/auth";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

/**
 * Cloud Function triggered when a user is created
 * Automatically creates user document in Firestore
 */
export const onUserCreate = user().onCreate(async (user) => {
  const { uid, email } = user;

  logger.info(`Creating user document: ${uid}`);

  try {
    const userDoc = {
      uid: uid,
      email: email || null,
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

    await admin.firestore().collection("users").doc(uid).set(userDoc);

    return null;
  } catch (error) {
    logger.error('User document creation failed:', error, { userId: uid });
    throw error;
  }
});