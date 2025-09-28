/**
 * AI Processing Firebase Function
 * Analyzes uploaded CV/Job Description files using OpenAI
 */

import { onCall, CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  withAuthentication,
  AuthenticatedContext,
} from "../../middleware/auth";

// OpenAI types and interfaces
interface AIAnalysisRequest {
  fileId: string;
  uploadType: 'cv' | 'jobDescription';
}

interface CVAnalysis {
  jobHistory: string[];
  technologies: string[];
  experienceYears: number;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  education?: string[];
  errors: string[];
}

interface JobAnalysis {
  title: string;
  company?: string;
  requiredSkills: string[];
  experienceRequired: number;
  location?: string;
  salary?: string;
  description: string;
  requirements: string[];
  errors: string[];
}

type AIAnalysisResult = CVAnalysis | JobAnalysis;

interface AIProcessResponse {
  success: boolean;
  message: string;
  fileId: string;
  analysis: AIAnalysisResult;
  errors: string[];
  processedAt: string;
}

/**
 * Extracts text from file in Firebase Storage
 * For now, this is a placeholder - you'd implement actual text extraction
 */
async function extractTextFromFile(storagePath: string): Promise<string> {
  try {
    // TODO: Implement actual text extraction from PDF/DOC
    // For now, return placeholder text
    logger.info("Extracting text from file", {
      structuredData: true,
      storagePath,
      timestamp: new Date().toISOString(),
    });

    // Placeholder: In reality, you'd extract text from the PDF/DOC file
    return "This is placeholder text. Implement actual PDF/DOC text extraction here.";
  } catch (error) {
    logger.error("Failed to extract text from file", {
      structuredData: true,
      storagePath,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    throw new Error("Failed to extract text from file");
  }
}

/**
 * Analyzes CV content using OpenAI
 */
async function analyzeCVWithAI(text: string): Promise<CVAnalysis> {
  try {
    // TODO: Implement OpenAI integration
    logger.info("Analyzing CV with AI", {
      structuredData: true,
      textLength: text.length,
      timestamp: new Date().toISOString(),
    });

    // Placeholder analysis - replace with actual OpenAI call
    const analysis: CVAnalysis = {
      jobHistory: ["Software Developer at TechCorp (2020-2023)", "Junior Dev at StartupXYZ (2018-2020)"],
      technologies: ["JavaScript", "TypeScript", "React", "Node.js", "Firebase"],
      experienceYears: 5,
      name: "John Doe",
      email: "john@example.com",
      errors: []
    };

    return analysis;
  } catch (error) {
    logger.error("Failed to analyze CV with AI", {
      structuredData: true,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    return {
      jobHistory: [],
      technologies: [],
      experienceYears: 0,
      errors: ["Failed to analyze CV content", "AI service unavailable"]
    };
  }
}

/**
 * Analyzes Job Description content using OpenAI
 */
async function analyzeJobWithAI(text: string): Promise<JobAnalysis> {
  try {
    // TODO: Implement OpenAI integration
    logger.info("Analyzing Job Description with AI", {
      structuredData: true,
      textLength: text.length,
      timestamp: new Date().toISOString(),
    });

    // Placeholder analysis - replace with actual OpenAI call
    const analysis: JobAnalysis = {
      title: "Senior Software Engineer",
      company: "Tech Company Inc",
      requiredSkills: ["React", "TypeScript", "AWS", "Docker"],
      experienceRequired: 5,
      location: "Remote",
      description: "We are looking for a senior software engineer...",
      requirements: ["5+ years experience", "Strong in React/TypeScript"],
      errors: []
    };

    return analysis;
  } catch (error) {
    logger.error("Failed to analyze Job Description with AI", {
      structuredData: true,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    return {
      title: "Unknown Position",
      requiredSkills: [],
      experienceRequired: 0,
      description: "",
      requirements: [],
      errors: ["Failed to analyze job description content", "AI service unavailable"]
    };
  }
}

/**
 * Stores AI analysis results in Firestore
 */
async function storeAIAnalysis(
  userId: string, 
  fileId: string, 
  analysis: AIAnalysisResult,
  uploadType: 'cv' | 'jobDescription'
): Promise<void> {
  try {
    const batch = admin.firestore().batch();

    // Update the file processing record
    const fileProcessingRef = admin.firestore().collection("fileProcessing")
      .where("fileId", "==", fileId)
      .where("userId", "==", userId);
    
    const fileProcessingSnapshot = await fileProcessingRef.get();
    if (!fileProcessingSnapshot.empty) {
      const docRef = fileProcessingSnapshot.docs[0].ref;
      batch.update(docRef, {
        aiAnalysis: analysis,
        aiProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "ai_processed"
      });
    }

    // Store in specialized collection (cvs or jobs)
    const collectionName = uploadType === 'cv' ? 'cvs' : 'jobs';
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
        'invalid-argument',
        'Missing required parameters: fileId and uploadType'
      );
    }

    if (!['cv', 'jobDescription'].includes(uploadType)) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid uploadType. Must be cv or jobDescription'
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
    const userFileRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('files')
      .doc(fileId);

    const fileDoc = await userFileRef.get();
    if (!fileDoc.exists) {
      throw new HttpsError('not-found', 'File not found');
    }

    const fileData = fileDoc.data();
    const storagePath = fileData?.storagePath;

    if (!storagePath) {
      throw new HttpsError('invalid-argument', 'File storage path not found');
    }

    // Extract text from file
    const extractedText = await extractTextFromFile(storagePath);

    // Analyze with AI based on upload type
    let analysis: AIAnalysisResult;
    if (uploadType === 'cv') {
      analysis = await analyzeCVWithAI(extractedText);
    } else {
      analysis = await analyzeJobWithAI(extractedText);
    }

    // Store results
    await storeAIAnalysis(userId, fileId, analysis, uploadType);

    const response: AIProcessResponse = {
      success: true,
      message: `${uploadType === 'cv' ? 'CV' : 'Job description'} analyzed successfully`,
      fileId,
      analysis,
      errors: analysis.errors,
      processedAt: new Date().toISOString(),
    };

    logger.info("AI analysis completed successfully", {
      structuredData: true,
      userId,
      fileId,
      uploadType,
      errorsCount: analysis.errors.length,
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

    throw new HttpsError('internal', 'Failed to process file with AI. Please try again later.');
  }
}

/**
 * Cloud Function to process files with AI
 */
export const processFileWithAI = onCall<
  AIAnalysisRequest,
  Promise<AIProcessResponse>
>(withAuthentication(handleAIProcessing));