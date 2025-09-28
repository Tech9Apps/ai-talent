/**
 * Job Matching Firebase Function
 * Finds job opportunities that match uploaded CVs
 */

import { onCall, CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  withAuthentication,
  AuthenticatedContext,
} from "../../middleware/auth";
import {
  JobMatchRequest,
  JobMatch,
  JobMatchResponse,
} from '../../../../shared/types/aiTypes';

/**
 * Main handler for job matching (placeholder)
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

    logger.info("Starting job matching process", {
      structuredData: true,
      userId,
      fileId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement actual job matching logic
    // For now, return placeholder matches
    const placeholderMatches: JobMatch[] = [
      {
        jobId: "job1",
        jobTitle: "Senior Frontend Developer",
        company: "TechCorp Inc",
        matchScore: 85,
        matchedSkills: ["React", "TypeScript", "JavaScript"],
        missingSkills: ["AWS"],
        experienceMatch: true,
        location: "Remote"
      },
      {
        jobId: "job2", 
        jobTitle: "Full Stack Engineer",
        company: "StartupXYZ",
        matchScore: 72,
        matchedSkills: ["Node.js", "React"],
        missingSkills: ["Docker", "Kubernetes"],
        experienceMatch: false,
        location: "San Francisco, CA"
      }
    ];

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response: JobMatchResponse = {
      success: true,
      message: "Job matches found successfully",
      fileId,
      matches: placeholderMatches,
      totalMatches: placeholderMatches.length,
      warnings: [], // Always empty - no warnings for matching
      processedAt: new Date().toISOString(),
    };

    logger.info("Job matching completed successfully", {
      structuredData: true,
      userId,
      fileId,
      totalMatches: placeholderMatches.length,
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