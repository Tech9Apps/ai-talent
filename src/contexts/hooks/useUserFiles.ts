import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuthContext } from './useAuthContext';

export interface UserFile {
  id: string;
  fileName: string;
  fileType: 'cv' | 'jobDescription';
  uploadedAt: Date;
  storagePath: string;
  size: number;
  aiProcessed?: boolean;
  aiAnalysis?: Record<string, unknown>;
  matchesFound?: number;
}

export const useUserFiles = () => {
  const { user } = useAuthContext();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get CV file specifically
  const cvFile = files.find(file => file.fileType === 'cv');
  
  // Get job description files
  const jobDescriptionFiles = files.filter(file => file.fileType === 'jobDescription');

  useEffect(() => {
    if (!user?.uid) {
      setFiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Create query for user's files
    const filesRef = collection(db, 'users', user.uid, 'files');
    const q = query(
      filesRef,
      orderBy('uploadedAt', 'desc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const userFiles: UserFile[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              fileName: data.fileName || 'Unknown file',
              fileType: data.fileType || 'cv',
              uploadedAt: data.uploadedAt?.toDate() || new Date(),
              storagePath: data.storagePath || '',
              size: data.size || 0,
              aiProcessed: data.aiProcessed || false,
              aiAnalysis: data.aiAnalysis,
              matchesFound: data.matchesFound,
            };
          });
          
          setFiles(userFiles);
          setLoading(false);
        } catch (err) {
          console.error('Error processing user files:', err);
          setError('Failed to load files');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error listening to user files:', err);
        setError('Failed to load files');
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [user?.uid]);

  return {
    files,
    cvFile,
    jobDescriptionFiles,
    loading,
    error,
    hasCV: !!cvFile,
    hasCVProcessed: cvFile?.aiProcessed === true,
  };
};