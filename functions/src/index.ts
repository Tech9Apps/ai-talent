/**
 * Main entry point for Firebase Functions
 * Exports all functions from modularized files
 */

import { setGlobalOptions } from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Global configuration for cost control
setGlobalOptions({ maxInstances: 10 });

// Export user-related functions
export { createUserDocument } from "./functions/user/createUser";

// Export file-related functions  
export { processUploadedFile } from "./functions/file/uploadFile";
export { getUserFiles } from "./functions/file/getFiles";
