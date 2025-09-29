/**
 * Job Matching Firebase Function
 * Finds job opportunities that match uploaded CVs using AI
 */

import { onCall, CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import {
  withAuthentication,
  AuthenticatedContext,
} from "../../middleware/auth";
import {
  JobMatchRequest,
  JobMatchResponse,
} from '../../../../shared/types/aiTypes';

const db = getFirestore();

/**
 * Main handler for job matching with AI analysis
 */
async function handleJobMatching(
  request: CallableRequest<JobMatchRequest>,
  context: AuthenticatedContext
): Promise<JobMatchResponse> {
  const { fileId } = request.data;
  const { userId } = context;

  try {
    // Validate input
    if (!fileId) {
      throw new HttpsError('invalid-argument', 'Missing required parameter: fileId');
    }

    logger.info("Starting AI-powered job matching process", {
      structuredData: true,
      userId,
      fileId,
      timestamp: new Date().toISOString(),
    });

    // Get CV analysis data
    const cvDoc = await db.collection('cvAnalysis').doc(fileId).get();
    if (!cvDoc.exists) {
      throw new HttpsError('not-found', 'CV analysis not found');
    }
    const cvAnalysis = cvDoc.data() as any; // Will be typed properly

    // Get all job descriptions for this user
    const jobsSnapshot = await db
      .collection('jobAnalysis')
      .where('userId', '==', userId)
      .get();

    if (jobsSnapshot.empty) {
      logger.info("No job descriptions found for matching", {
        structuredData: true,
        userId,
        fileId,
      });

      return {
        success: true,
        message: "No job descriptions available for matching",
        fileId,
        matches: [],
        totalMatches: 0,
        warnings: ["No job descriptions found to match against"],
        processedAt: new Date().toISOString(),
      };
    }

    const jobAnalyses = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]; // Will be typed properly

    logger.info("Found job descriptions for matching", {
      structuredData: true,
      userId,
      jobCount: jobAnalyses.length,
    });

    // Use OpenAI to analyze matches
    const { analyzeJobMatches } = await import("../../services/openaiService");
    const matches = await analyzeJobMatches(cvAnalysis, jobAnalyses);

    // Filter matches >= 50%
    const goodMatches = matches.filter(match => match.matchScore >= 50);

    // Create notifications for good matches
    if (goodMatches.length > 0) {
      try {
        const { createMatchNotifications } = await import("../../services/notificationService");
        const notifications = goodMatches.map(match => ({
          userId,
          type: 'cv_match' as const,
          title: `New Job Match Found!`,
          message: `Your CV matches ${match.matchScore}% with ${match.jobTitle} at ${match.company}`,
          data: {
            cvId: fileId,
            cvName: cvAnalysis.name,
            jobId: match.jobId,
            jobTitle: match.jobTitle,
            company: match.company,
            matchScore: match.matchScore,
            matchedSkills: match.matchedSkills,
            missingSkills: match.missingSkills,
          }
        }));

        await createMatchNotifications(notifications);
        
        logger.info("Match notifications created", {
          structuredData: true,
          userId,
          notificationCount: notifications.length,
        });
      } catch (notificationError) {
        logger.error("Failed to create match notifications", {
          structuredData: true,
          userId,
          error: notificationError instanceof Error ? notificationError.message : String(notificationError),
        });
        // Don't fail the whole process if notifications fail
      }
    }

    const response: JobMatchResponse = {
      success: true,
      message: `Found ${goodMatches.length} job matches with AI analysis`,
      fileId,
      matches: goodMatches,
      totalMatches: goodMatches.length,
      warnings: goodMatches.length === 0 ? ["No matches found above 50% threshold"] : [],
      processedAt: new Date().toISOString(),
    };

    logger.info("AI job matching completed successfully", {
      structuredData: true,
      userId,
      fileId,
      totalMatches: goodMatches.length,
      averageScore: goodMatches.length > 0 
        ? Math.round(goodMatches.reduce((sum, m) => sum + m.matchScore, 0) / goodMatches.length)
        : 0,
      timestamp: new Date().toISOString(),
    });

    return response;

  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Job matching failed", {
      structuredData: true,
      userId,
      fileId,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    throw new HttpsError('internal', 'Failed to find job matches. Please try again later.');
  }
}

/**
 * Cloud Function to find job matches
 */
export const findJobMatches = onCall<
  JobMatchRequest,
  Promise<JobMatchResponse>
>(withAuthentication(handleJobMatching));