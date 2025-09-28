/**
 * Main entry point for Firebase Functions
 * Exports all functions from modularized files
 */
import './fixPaths';
import { setGlobalOptions } from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Global configuration for cost control
setGlobalOptions({ maxInstances: 10 });


// Export file-related functions  
export { processUploadedFile } from "./functions/file/uploadFile";
export { getUserFiles } from "./functions/file/getFiles";
export { deleteCV } from "./functions/file/deleteCV";

// Export AI processing functions
export { processFileWithAI } from "./functions/ai/processFileWithAI";

// Export matching functions
export { findJobMatches } from "./functions/matching/findJobMatches";
