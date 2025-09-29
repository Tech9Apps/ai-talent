/**
 * Notification types for AI-Talent system
 */

export interface MatchNotification {
  id: string;
  userId: string;
  type: 'cv_match' | 'job_match';
  title: string;
  message: string;
  data: {
    cvId?: string;
    cvName?: string;
    jobId?: string;
    jobTitle?: string;
    company?: string;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
  };
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationRequest {
  userId: string;
  type: 'cv_match' | 'job_match';
  title: string;
  message: string;
  data: MatchNotification['data'];
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  notificationId?: string;
}

// For real-time notifications hook
export interface NotificationWithId extends MatchNotification {
  id: string;
}