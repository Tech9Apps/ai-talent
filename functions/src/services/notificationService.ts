/**
 * Notification Functions
 * Handle creation and management of match notifications
 */

import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import type { CreateNotificationRequest, MatchNotification } from '../../../shared/types/notificationTypes';

const db = getFirestore();

/**
 * Create a new match notification
 */
export async function createMatchNotification(
  request: CreateNotificationRequest
): Promise<string> {
  try {
    const { userId, type, title, message, data } = request;

    const notification: Omit<MatchNotification, 'id'> = {
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to Firestore
    const docRef = await db.collection('notifications').add(notification);

    logger.info("Match notification created", {
      structuredData: true,
      notificationId: docRef.id,
      userId,
      type,
      matchScore: data.matchScore,
      timestamp: new Date().toISOString(),
    });

    return docRef.id;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to create notification", {
      structuredData: true,
      userId: request.userId,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to create notification: ${errorMessage}`);
  }
}

/**
 * Create multiple match notifications for different users
 */
export async function createMatchNotifications(
  notifications: CreateNotificationRequest[]
): Promise<string[]> {
  try {
    const batch = db.batch();
    const notificationIds: string[] = [];

    for (const request of notifications) {
      const { userId, type, title, message, data } = request;
      
      const notification: Omit<MatchNotification, 'id'> = {
        userId,
        type,
        title,
        message,
        data,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = db.collection('notifications').doc();
      batch.set(docRef, notification);
      notificationIds.push(docRef.id);
    }

    await batch.commit();

    logger.info("Batch notifications created", {
      structuredData: true,
      count: notifications.length,
      notificationIds,
      timestamp: new Date().toISOString(),
    });

    return notificationIds;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to create batch notifications", {
      structuredData: true,
      count: notifications.length,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to create batch notifications: ${errorMessage}`);
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await db.collection('notifications').doc(notificationId).update({
      read: true,
      updatedAt: new Date(),
    });

    logger.info("Notification marked as read", {
      structuredData: true,
      notificationId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to mark notification as read", {
      structuredData: true,
      notificationId,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to mark notification as read: ${errorMessage}`);
  }
}