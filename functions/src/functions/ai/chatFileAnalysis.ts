/**
 * Chat with File Analysis Firebase Function
 * Allows users to ask questions about their uploaded files using AI
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
import { chatWithFileContent } from "../../services/openaiService";

interface ChatFileAnalysisRequest {
  question: string;
  fileId: string;
}

interface ChatFileAnalysisResponse {
  response: string;
}

/**
 * Main handler for chat file analysis
 */
async function handleChatFileAnalysis(
  request: CallableRequest<ChatFileAnalysisRequest>,
  context: AuthenticatedContext
): Promise<ChatFileAnalysisResponse> {
  const { question, fileId } = request.data;
  const { userId } = context;

  try {
    if (!question || !fileId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required parameters: question and fileId are required"
      );
    }

    if (typeof question !== "string" || question.trim().length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "Question must be a non-empty string"
      );
    }

    if (typeof fileId !== "string") {
      throw new HttpsError("invalid-argument", "File ID must be a string");
    }

    logger.info("Processing chat request", {
      userId,
      fileId,
      questionLength: question.length,
    });

    // Get the user's file from Firestore to verify ownership
    const userFilesRef = admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("files")
      .doc(fileId);

    const fileDoc = await userFilesRef.get();

    if (!fileDoc.exists) {
      throw new HttpsError(
        "not-found",
        "File not found or you don't have access to it"
      );
    }

    const fileData = fileDoc.data();
    if (!fileData) {
      throw new HttpsError("not-found", "File data not found");
    }

    // Get file storage path
    const storagePath = fileData.storagePath;
    if (!storagePath) {
      throw new HttpsError("not-found", "File storage path not found");
    }

    logger.info("File found, proceeding with AI chat", {
      userId,
      fileId,
      fileName: fileData.fileName,
      storagePath,
    });

    // Get available jobs for context (only if user is asking about CV analysis or matching)
    let jobsContext: string | undefined;

    // Check if question is about job matching, improvement, or comparison
    const isJobRelatedQuestion =
      /job|position|match|improve|compare|role|skill|requirement|experience|qualification/i.test(
        question
      );

    if (isJobRelatedQuestion) {
      try {
        const jobsSnapshot = await admin
          .firestore()
          .collection("jobs")
          .where("userId", "==", userId)
          .limit(10) // Limit to recent jobs to avoid token limits
          .get();

        if (!jobsSnapshot.empty) {
          const jobsSummary = jobsSnapshot.docs.map((doc) => {
            const jobData = doc.data();
            return {
              title: jobData.title || "Unknown Position",
              company: jobData.company || "Unknown Company",
              requiredSkills: jobData.requiredSkills || [],
              experienceRequired: jobData.experienceRequired || 0,
              description: jobData.description
                ? jobData.description.substring(0, 200) + "..."
                : "",
            };
          });

          jobsContext = `Available job opportunities for comparison:\n${JSON.stringify(
            jobsSummary,
            null,
            2
          )}`;

          logger.info("Added jobs context", {
            userId,
            jobsCount: jobsSummary.length,
          });
        }
      } catch (jobsError) {
        logger.warn("Failed to retrieve jobs context", {
          error: jobsError,
          userId,
        });
        // Continue without jobs context
      }
    }

    // Use OpenAI service to chat with the file content
    const aiResponse = await chatWithFileContent(
      question,
      storagePath,
      fileData.fileType,
      fileData.fileName,
      jobsContext
    );

    logger.info("AI chat response generated", {
      userId,
      fileId,
      responseLength: aiResponse.length,
    });

    // Log the chat interaction for analytics (optional)
    try {
      await admin.firestore().collection("chatLogs").add({
        userId,
        fileId,
        fileName: fileData.fileName,
        question,
        response: aiResponse,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      logger.warn("Failed to log chat interaction", {
        error: logError,
        userId,
        fileId,
      });
    }

    return {
      response: aiResponse,
    };
  } catch (error) {
    logger.error("Error in chatFileAnalysis", {
      error: error,
      userId,
      fileId: request.data.fileId,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "Failed to process chat request. Please try again later."
    );
  }
}

/**
 * Chat with file analysis - allows users to ask questions about their uploaded files
 */
export const chatFileAnalysis = onCall<
  ChatFileAnalysisRequest,
  Promise<ChatFileAnalysisResponse>
>(
  {
    region: "us-central1",
    enforceAppCheck: false,
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  withAuthentication(handleChatFileAnalysis)
);
