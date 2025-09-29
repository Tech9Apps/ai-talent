import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import type { CVAnalysis } from "../../../shared/types/aiTypes";

interface UseCVAnalysisResult {
  analysis: CVAnalysis | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch CV analysis data from Firestore
 * @param fileId - The ID of the file to get analysis for
 * @returns Object with analysis data, loading state, and error
 */
export const useCVAnalysis = (fileId: string | null): UseCVAnalysisResult => {
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) {
      setAnalysis(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time listener for the CV analysis document
    const analysisRef = doc(db, "cvs", fileId);
    
    const unsubscribe = onSnapshot(
      analysisRef,
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Map the Firestore data to CVAnalysis interface
            const analysisData: CVAnalysis = {
              name: data.name || undefined,
              email: data.email || undefined,
              phone: data.phone || undefined,
              location: data.location || undefined,
              summary: data.summary || undefined,
              experienceYears: data.experienceYears || 0,
              jobHistory: data.jobHistory || [],
              technologies: data.technologies || [],
              education: data.education || [],
              warnings: data.warnings || [],
            };
            
            setAnalysis(analysisData);
            setError(null);
          } else {
            // Document doesn't exist yet (maybe still processing)
            setAnalysis(null);
            setError(null);
          }
        } catch (err) {
          console.error("Error processing CV analysis data:", err);
          setError("Failed to process analysis data");
          setAnalysis(null);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching CV analysis:", err);
        setError("Failed to fetch analysis data");
        setAnalysis(null);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount or when fileId changes
    return () => unsubscribe();
  }, [fileId]);

  return {
    analysis,
    loading,
    error,
  };
};