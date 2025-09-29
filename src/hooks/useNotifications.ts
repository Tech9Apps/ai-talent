import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthContext } from '../contexts/hooks/useAuthContext';
import type { NotificationWithId } from '../../shared/types/notificationTypes';

export const useNotifications = () => {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Create query for user's notifications, ordered by creation date (newest first)
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationData: NotificationWithId[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          notificationData.push({
            id: doc.id,
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            data: data.data,
            read: data.read,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });
        
        setNotifications(notificationData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user?.uid]);

  // Helper functions
  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 5); // Show only 5 most recent

  return {
    notifications,
    recentNotifications,
    unreadCount,
    loading,
    error,
  };
};