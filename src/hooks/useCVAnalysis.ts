import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { CVAnalysis } from "../../shared/types/aiTypes";

interface UseCVAnalysisReturn {
  analysis: CVAnalysis | null;
  loading: boolean;
  error: string | null;
}

export const useCVAnalysis = (fileId: string): UseCVAnalysisReturn => {
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) {
      setLoading(false);
      return;
    }

    const cvDocRef = doc(db, "cvs", fileId);
    
    const unsubscribe = onSnapshot(
      cvDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as CVAnalysis;
          setAnalysis(data);
          setError(null);
        } else {
          setAnalysis(null);
          setError("CV analysis not found");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching CV analysis:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [fileId]);

  return { analysis, loading, error };
};