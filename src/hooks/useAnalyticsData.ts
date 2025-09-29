import type { CVAnalysis, JobAnalysis } from "../../shared/types/aiTypes";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthContext } from "../contexts/hooks/useAuthContext";

interface CVAnalysisWithId extends CVAnalysis {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface JobAnalysisWithId extends JobAnalysis {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UseAnalyticsDataReturn {
  cvs: CVAnalysisWithId[];
  jobs: JobAnalysisWithId[];
  loading: boolean;
  error: string | null;
}

export const useAnalyticsData = (): UseAnalyticsDataReturn => {
  const { user } = useAuthContext();
  const [cvs, setCvs] = useState<CVAnalysisWithId[]>([]);
  const [jobs, setJobs] = useState<JobAnalysisWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up CVs listener
    const cvsQuery = query(
      collection(db, "cvs"),
      where("userId", "==", user.uid)
    );

    const unsubscribeCvs = onSnapshot(
      cvsQuery,
      (snapshot) => {
        const cvsData: CVAnalysisWithId[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          cvsData.push({
            id: doc.id,
            name: data.name || "",
            summary: data.summary || "",
            jobHistory: data.jobHistory || [],
            technologies: data.technologies || [],
            experienceYears: data.experienceYears || 0,
            education: data.education || [],
            warnings: data.warnings || [],
            email: data.email,
            phone: data.phone,
            location: data.location,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });
        setCvs(cvsData);
      },
      (err) => {
        console.error("Error fetching CVs:", err);
        setError("Failed to load CVs");
      }
    );

    // Set up Jobs listener
    const jobsQuery = query(
      collection(db, "jobs"),
      where("userId", "==", user.uid)
    );

    const unsubscribeJobs = onSnapshot(
      jobsQuery,
      (snapshot) => {
        const jobsData: JobAnalysisWithId[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          jobsData.push({
            id: doc.id,
            title: data.title || "Unknown Position",
            company: data.company,
            requiredSkills: data.requiredSkills || [],
            experienceRequired: data.experienceRequired || 0,
            description: data.description || "",
            requirements: data.requirements || [],
            location: data.location,
            salary: data.salary,
            warnings: data.warnings || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });
        setJobs(jobsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching Jobs:", err);
        setError("Failed to load Jobs");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeCvs();
      unsubscribeJobs();
    };
  }, [user?.uid]);

  return { cvs, jobs, loading, error };
};