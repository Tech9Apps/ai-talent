/**
 * Job Matching Firebase Function
 * Finds matches between CVs and Jobs using AI (bidirectional)
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
 * Main handler for matching with AI analysis (bidirectional)
 */
async function handleMatching(
  request: CallableRequest<JobMatchRequest>,
  context: AuthenticatedContext
): Promise<JobMatchResponse> {
  const { fileId, fileType } = request.data;
  const { userId } = context;

  try {
    // Validate input
    if (!fileId || !fileType) {
      throw new HttpsError('invalid-argument', 'Missing required parameters: fileId and fileType');
    }

    logger.info("Starting AI-powered matching process", {
      structuredData: true,
      userId,
      fileId,
      fileType,
      timestamp: new Date().toISOString(),
    });

    if (fileType === 'cv') {
      return await handleCVMatching(fileId, userId);
    } else if (fileType === 'jobDescription') {
      return await handleJobDescriptionMatching(fileId, userId);
    } else {
      throw new HttpsError('invalid-argument', 'Invalid fileType. Must be "cv" or "jobDescription"');
    }

  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Matching failed", {
      structuredData: true,
      userId,
      fileId,
      fileType,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    throw new HttpsError('internal', 'Failed to find matches. Please try again later.');
  }
}

/**
 * Handle CV matching against Job Descriptions
 */
async function handleCVMatching(fileId: string, userId: string): Promise<JobMatchResponse> {
  // Get CV analysis data
  const cvDoc = await db.collection('cvs').doc(fileId).get();
  if (!cvDoc.exists) {
    throw new HttpsError('not-found', 'CV analysis not found');
  }
  const cvAnalysis = cvDoc.data() as any;

  // Get all job descriptions for this user
  const jobsSnapshot = await db
    .collection('jobs')
    .get();

  if (jobsSnapshot.empty) {
    logger.info("No job descriptions found for CV matching", {
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
  })) as any[];

  logger.info("Found job descriptions for CV matching", {
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
    await createCVMatchNotifications(userId, fileId, cvAnalysis, goodMatches);
  }

  return {
    success: true,
    message: `Found ${goodMatches.length} job matches for CV`,
    fileId,
    matches: goodMatches,
    totalMatches: goodMatches.length,
    warnings: goodMatches.length === 0 ? ["No job matches found above 50% threshold"] : [],
    processedAt: new Date().toISOString(),
  };
}

/**
 * Handle Job matching against CVs
 */
async function handleJobDescriptionMatching(fileId: string, userId: string): Promise<JobMatchResponse> {
  // Get Job analysis data
  const jobDoc = await db.collection('jobs').doc(fileId).get();
  if (!jobDoc.exists) {
    throw new HttpsError('not-found', 'Job analysis not found');
  }
  const jobAnalysis = jobDoc.data() as any;

  // Get all CV analyses from ALL users (not just this user)
  const cvsSnapshot = await db
    .collection('cvs')
    .get();

  if (cvsSnapshot.empty) {
    logger.info("No CVs found for job matching", {
      structuredData: true,
      userId,
      fileId,
    });

    return {
      success: true,
      message: "No CVs available for matching",
      fileId,
      matches: [],
      totalMatches: 0,
      warnings: ["No CVs found to match against"],
      processedAt: new Date().toISOString(),
    };
  }

  const cvAnalyses = cvsSnapshot.docs.map(doc => ({
    id: doc.id,
    userId: doc.data().userId, // Keep track of CV owner
    ...doc.data()
  })) as any[];

  logger.info("Found CVs for job matching", {
    structuredData: true,
    userId,
    cvCount: cvAnalyses.length,
  });

  // Use OpenAI to analyze matches
  const { analyzeCVMatches } = await import("../../services/openaiService");
  const matches = await analyzeCVMatches(jobAnalysis, cvAnalyses);

  // Filter matches >= 50%
  const goodMatches = matches.filter(match => match.matchScore >= 50);

  // Create notifications for good matches (notify CV owners)
  if (goodMatches.length > 0) {
    await createJobMatchNotifications(fileId, jobAnalysis, goodMatches, cvAnalyses);
  }

  return {
    success: true,
    message: `Found ${goodMatches.length} CV matches for job`,
    fileId,
    matches: goodMatches,
    totalMatches: goodMatches.length,
    warnings: goodMatches.length === 0 ? ["No CV matches found above 50% threshold"] : [],
    processedAt: new Date().toISOString(),
  };
}

/**
 * Create notifications for CV matches
 */
async function createCVMatchNotifications(
  userId: string,
  fileId: string,
  cvAnalysis: any,
  goodMatches: any[]
): Promise<void> {
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
    
    logger.info("CV match notifications created", {
      structuredData: true,
      userId,
      notificationCount: notifications.length,
    });
  } catch (notificationError) {
    logger.error("Failed to create CV match notifications", {
      structuredData: true,
      userId,
      error: notificationError instanceof Error ? notificationError.message : String(notificationError),
    });
  }
}

/**
 * Create notifications for Job matches (notify CV owners)
 */
async function createJobMatchNotifications(
  jobId: string,
  jobAnalysis: any,
  goodMatches: any[],
  cvAnalyses: any[]
): Promise<void> {
  try {
    const { createMatchNotifications } = await import("../../services/notificationService");
    
    // Create notifications for each matched CV owner
    const notifications = goodMatches.map(match => {
      // Find the corresponding CV to get the owner's userId
      // Note: In CV matching, match.jobId actually contains the CV ID
      const matchedCV = cvAnalyses.find(cv => cv.id === match.jobId);
      if (!matchedCV) return null;

      return {
        userId: matchedCV.userId,
        type: 'job_match' as const,
        title: `New Job Opportunity!`,
        message: `A job at ${jobAnalysis.company} matches ${match.matchScore}% with your CV`,
        data: {
          jobId,
          jobTitle: jobAnalysis.title,
          company: jobAnalysis.company || 'Unknown Company',
          cvId: matchedCV.id,
          cvName: matchedCV.name,
          matchScore: match.matchScore,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
        }
      };
    }).filter(Boolean); // Remove null entries

    if (notifications.length > 0) {
      await createMatchNotifications(notifications as any[]);
      
      logger.info("Job match notifications created", {
        structuredData: true,
        jobId,
        notificationCount: notifications.length,
      });
    }
  } catch (notificationError) {
    logger.error("Failed to create job match notifications", {
      structuredData: true,
      jobId,
      error: notificationError instanceof Error ? notificationError.message : String(notificationError),
    });
  }
}

/**
 * Cloud Function to find job matches
 */
export const findJobMatches = onCall<
  JobMatchRequest,
  Promise<JobMatchResponse>
>(withAuthentication(handleMatching));