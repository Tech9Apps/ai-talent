import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuthContext } from "./useAuthContext";
import type { UserFileRecord } from "../../../shared";

export const useUserFiles = () => {
  const { user } = useAuthContext();
  const [files, setFiles] = useState<UserFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get CV file specifically
  const cvFile = files.find((file) => file.uploadType === "cv");

  // Get job description files
  const jobDescriptionFiles = files.filter(
    (file) => file.uploadType === "jobDescription"
  );

  useEffect(() => {
    if (!user?.uid) {
      setFiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Create query for user's files
    const filesRef = collection(db, "users", user.uid, "files");
    const q = query(filesRef, orderBy("uploadedAt", "desc"));

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const userFiles: UserFileRecord[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId || "",
              fileName: data.fileName || "Unknown file",
              originalName:
                data.originalName || data.fileName || "Unknown file",
              fileType: data.fileType || "text/plain",
              uploadType: data.uploadType || "cv",
              storagePath: data.storagePath || "",
              downloadURL: data.downloadURL || "",
              uploadedAt: data.uploadedAt || data.createdAt,
              size: data.size || 0,
              status: data.status || "uploaded",
              processed: data.processed || false,
              aiProcessed: data.aiProcessed,
              aiAnalysis: data.aiAnalysis,
              matchesFound: data.matchesFound,
              createdAt: data.createdAt,
            };
          });

          setFiles(userFiles);
          setLoading(false);
        } catch (err) {
          console.error("Error processing user files:", err);
          setError("Failed to load files");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error listening to user files:", err);
        setError("Failed to load files");
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
    hasCVProcessed: cvFile?.processed === true,
  };
};
