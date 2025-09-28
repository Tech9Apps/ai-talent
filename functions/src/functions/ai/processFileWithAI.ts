/**
 * AI Processing Firebase Function
 * Analyzes uploaded CV/Job Description files using OpenAI
 */

import {
  onCall,
  CallableRequest,
  HttpsError,
} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  withAuthentication,
  AuthenticatedContext,
} from "../../middleware/auth";
import {
  AIAnalysisRequest,
  AIAnalysisResult,
  AIProcessResponse,
  CVAnalysis,
  JobAnalysis,
} from "../../../../shared/types/aiTypes";
import { analyzeFileWithOpenAI, downloadStorageFile } from "../../services/openaiService";

/**
 * Stores AI analysis results in Firestore
 */
async function storeAIAnalysis(
  userId: string,
  fileId: string,
  analysis: AIAnalysisResult,
  uploadType: "cv" | "jobDescription"
): Promise<void> {
  try {
    const batch = admin.firestore().batch();

    // Update the file processing record
    const fileProcessingRef = admin
      .firestore()
      .collection("fileProcessing")
      .where("fileId", "==", fileId)
      .where("userId", "==", userId);

    const fileProcessingSnapshot = await fileProcessingRef.get();
    if (!fileProcessingSnapshot.empty) {
      const doc = fileProcessingSnapshot.docs[0];
      batch.update(doc.ref, {
        aiProcessed: true,
        aiProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
        aiResults: analysis,
      });
    }

    // Store in specialized collection (cvs or jobs)
    const collectionName = uploadType === "cv" ? "cvs" : "jobs";
    const specializedRef = admin.firestore().collection(collectionName).doc();

    batch.set(specializedRef, {
      userId,
      fileId,
      ...analysis,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    logger.info("Stored AI analysis results", {
      structuredData: true,
      userId,
      fileId,
      uploadType,
      collectionName,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to store AI analysis", {
      structuredData: true,
      userId,
      fileId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Main handler for AI processing
 */
async function handleAIProcessing(
  request: CallableRequest<AIAnalysisRequest>,
  context: AuthenticatedContext
): Promise<AIProcessResponse> {
  const { fileId, uploadType } = request.data;
  const { userId } = context;

  try {
    // Validate input
    if (!fileId || !uploadType) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required parameters: fileId, uploadType"
      );
    }

    if (!["cv", "jobDescription"].includes(uploadType)) {
      throw new HttpsError(
        "invalid-argument",
        'Invalid uploadType. Must be "cv" or "jobDescription"'
      );
    }

    logger.info("Starting AI analysis", {
      structuredData: true,
      userId,
      fileId,
      uploadType,
      timestamp: new Date().toISOString(),
    });

    // Get file information from Firestore
    const userFileRef = admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("files")
      .doc(fileId);

    const fileDoc = await userFileRef.get();
    if (!fileDoc.exists) {
      throw new HttpsError("not-found", "File not found");
    }

    const fileData = fileDoc.data();
    const storagePath = fileData?.storagePath;

    if (!storagePath) {
      throw new HttpsError("invalid-argument", "File storage path not found");
    }

    // Attempt direct file analysis first
    let analysis: AIAnalysisResult;
    let usedFileMode = false;
    try {
      const { buffer, fileName } = await downloadStorageFile(storagePath);
      const parsed = await analyzeFileWithOpenAI(buffer, fileName, uploadType === 'cv' ? 'cv' : 'job');
      // Map parsed generic object to types
      if (uploadType === 'cv') {
        analysis = {
          jobHistory: parsed.jobHistory || [],
          technologies: parsed.technologies || [],
          experienceYears: parsed.experienceYears || 0,
          education: parsed.education || [],
          warnings: []
        } as CVAnalysis;
        if (parsed.name) (analysis as CVAnalysis).name = parsed.name;
        if (parsed.email) (analysis as CVAnalysis).email = parsed.email;
        if (parsed.phone) (analysis as CVAnalysis).phone = parsed.phone;
        if (parsed.location) (analysis as CVAnalysis).location = parsed.location;
        if (parsed.summary) (analysis as CVAnalysis).summary = parsed.summary;
      } else {
        analysis = {
          title: parsed.title || 'Unknown Position',
          requiredSkills: parsed.requiredSkills || [],
          experienceRequired: parsed.experienceRequired || 0,
          description: parsed.description || '',
          requirements: parsed.requirements || [],
          warnings: []
        } as JobAnalysis;
        if (parsed.company) (analysis as JobAnalysis).company = parsed.company;
        if (parsed.location) (analysis as JobAnalysis).location = parsed.location;
        if (parsed.salary) (analysis as JobAnalysis).salary = parsed.salary;
      }
      usedFileMode = true;
    } catch (fileModeError) {
      logger.error('File-mode AI failed (no fallback enabled)', { structuredData: true, error: fileModeError instanceof Error ? fileModeError.message : String(fileModeError) });
      throw new HttpsError('internal', 'AI file analysis failed');
    }

    // Store results
    await storeAIAnalysis(userId, fileId, analysis, uploadType);

    const response: AIProcessResponse = {
      success: true,
      message: `${
        uploadType === "cv" ? "CV" : "Job description"
      } analyzed successfully`,
      fileId,
      analysis,
      warnings: "warnings" in analysis ? analysis.warnings : [],
      processedAt: new Date().toISOString(),
    };

    logger.info("AI analysis completed successfully", {
      structuredData: true,
      userId,
      fileId,
      uploadType,
      warningsCount: "warnings" in analysis ? analysis.warnings.length : 0,
      mode: usedFileMode ? 'file' : 'text-fallback',
      timestamp: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("AI processing failed", {
      structuredData: true,
      userId,
      fileId,
      uploadType,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    throw new HttpsError(
      "internal",
      "Failed to process file with AI. Please try again later."
    );
  }
}

/**
 * Cloud Function to process files with AI
 */
export const processFileWithAI = onCall<
  AIAnalysisRequest,
  Promise<AIProcessResponse>
>(withAuthentication(handleAIProcessing));
