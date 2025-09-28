/**
 * Example of how to get user files directly from Firestore (recommended approach)
 * This shows the proper client-side implementation for file retrieval
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs,
  DocumentSnapshot 
} from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

// Types for client-side file handling
export interface ClientFileInfo {
  fileId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  uploadType: 'cv' | 'jobDescription';
  uploadedAt: Date;
  fileSize: number;
  downloadURL?: string;
  processed?: boolean;
  status?: string;
  storagePath: string;
}

export interface GetFilesOptions {
  uploadType?: 'cv' | 'jobDescription';
  limitCount?: number;
  lastDoc?: DocumentSnapshot;
}


export async function getUserFilesFromFirestore(
  userId: string,
  options: GetFilesOptions = {}
): Promise<{
  files: ClientFileInfo[];
  lastDoc?: DocumentSnapshot;
  hasMore: boolean;
}> {
  try {
    const { uploadType, limitCount = 20, lastDoc } = options;

    // Build query
    let q = query(
      collection(db, 'users', userId, 'files'),
      orderBy('createdAt', 'desc'),
      limit(limitCount + 1) // Get one extra to check if there are more
    );

    // Add type filter if specified
    if (uploadType) {
      q = query(q, where('uploadType', '==', uploadType));
    }

    // Add pagination if lastDoc provided
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const files: ClientFileInfo[] = [];
    let newLastDoc: DocumentSnapshot | undefined;
    let hasMore = false;

    // Process results
    snapshot.docs.forEach((doc, index) => {
      if (index === limitCount) {
        hasMore = true;
        return;
      }

      const data = doc.data();
      files.push({
        fileId: doc.id,
        fileName: data.fileName,
        originalName: data.originalName,
        fileType: data.fileType,
        uploadType: data.uploadType,
        uploadedAt: data.uploadedAt?.toDate() || new Date(),
        fileSize: data.fileSize || 0,
        processed: data.processed || false,
        status: data.status || 'unknown',
        storagePath: data.storagePath,
      });

      newLastDoc = doc;
    });

    return {
      files,
      lastDoc: newLastDoc,
      hasMore,
    };

  } catch (error) {
    console.error('Error getting files from Firestore:', error);
    throw error;
  }
}

export async function getFileDownloadURL(storagePath: string): Promise<string> {
  try {
    const fileRef = ref(storage, storagePath);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
}


export function useUserFiles(): void {
  // This would be implemented as a React hook using the functions above
  // Example:
  /*
  const [files, setFiles] = useState<ClientFileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot>();
  const [hasMore, setHasMore] = useState(false);

  const loadFiles = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getUserFilesFromFirestore(userId, {
        uploadType,
        lastDoc: reset ? undefined : lastDoc,
      });
      
      if (reset) {
        setFiles(result.files);
      } else {
        setFiles(prev => [...prev, ...result.files]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadFiles(true);
    }
  }, [userId, uploadType]);

  return {
    files,
    loading,
    error,
    hasMore,
    loadMore: () => loadFiles(false),
    refresh: () => loadFiles(true),
  };
  */
  
  throw new Error('This is just an example - implement the actual hook');
}