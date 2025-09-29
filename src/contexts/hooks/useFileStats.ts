import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../../firebase";

interface FileStats {
  time: string;
  timestamp: number;
  cvs: number;
  jobs: number;
}

interface UseFileStatsReturn {
  stats: FileStats[];
  loading: boolean;
  error: string | null;
}

interface CVDocument {
  id: string;
  createdAt: Timestamp;
  [key: string]: unknown;
}

interface JobDocument {
  id: string;
  createdAt: Timestamp;
  [key: string]: unknown;
}

export const useFileStats = (): UseFileStatsReturn => {
  const [stats, setStats] = useState<FileStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Query CVs collection
    const cvsRef = collection(db, "cvs");
    const cvsQuery = query(cvsRef, orderBy("createdAt", "asc"));

    // Query jobs collection
    const jobsRef = collection(db, "jobs");
    const jobsQuery = query(jobsRef, orderBy("createdAt", "asc"));

    let cvsData: CVDocument[] = [];
    let jobsData: JobDocument[] = [];
    let cvsLoaded = false;
    let jobsLoaded = false;

    const processData = () => {
      if (!cvsLoaded || !jobsLoaded) return;

      try {
        // Combine all documents with their dates
        const allDocuments: Array<{ date: Date; type: 'cv' | 'job' }> = [];

        // Add CVs
        cvsData.forEach((doc) => {
          if (doc.createdAt && doc.createdAt.toDate) {
            allDocuments.push({
              date: doc.createdAt.toDate(),
              type: 'cv'
            });
          }
        });

        // Add Jobs
        jobsData.forEach((doc) => {
          if (doc.createdAt && doc.createdAt.toDate) {
            allDocuments.push({
              date: doc.createdAt.toDate(),
              type: 'job'
            });
          }
        });

        // Sort by date
        allDocuments.sort((a, b) => a.date.getTime() - b.date.getTime());

        if (allDocuments.length === 0) {
          // No data - create empty state
          const now = new Date();
          const statsArray: FileStats[] = [{
            time: `${now.getHours()}:00`,
            timestamp: now.getTime(),
            cvs: 0,
            jobs: 0,
          }];
          setStats(statsArray);
          setLoading(false);
          return;
        }

        // Get the first document date and subtract 12 hours
        const firstDate = allDocuments[0].date;
        const startTime = new Date(firstDate.getTime() - (12 * 60 * 60 * 1000)); // 12 hours before

        // Create 12-hour intervals from start time
        const intervals = new Map<string, { timestamp: number; cvs: number; jobs: number }>();

        // Helper function to get 12-hour interval key
        const getIntervalKey = (date: Date): { key: string; timestamp: number } => {
          const hours = date.getHours();
          const intervalStart = Math.floor(hours / 12) * 12;
          const intervalEnd = intervalStart + 12;
          
          // Format 24-hour to 12-hour format with AM/PM
          const formatTime = (hour: number): string => {
            if (hour === 0) return "12:00 AM";
            if (hour === 12) return "12:00 PM";
            if (hour < 12) return `${hour}:00 AM`;
            return `${hour - 12}:00 PM`;
          };
          
          const key = `${formatTime(intervalEnd)}`;
        //   const key = `${formatTime(intervalStart)} - ${formatTime(intervalEnd)}`;
          
          // Create timestamp for the start of this interval
          const intervalDate = new Date(date);
          intervalDate.setHours(intervalStart, 0, 0, 0);
          
          return { key, timestamp: intervalDate.getTime() };
        };

        // Initialize intervals starting 12 hours before first document
        const { key: startKey, timestamp: startTimestamp } = getIntervalKey(startTime);
        intervals.set(startKey, { timestamp: startTimestamp, cvs: 0, jobs: 0 });

        // Process all documents
        allDocuments.forEach((doc) => {
          const { key, timestamp } = getIntervalKey(doc.date);
          
          if (!intervals.has(key)) {
            intervals.set(key, { timestamp, cvs: 0, jobs: 0 });
          }
          
          const interval = intervals.get(key)!;
          if (doc.type === 'cv') {
            interval.cvs += 1;
          } else {
            interval.jobs += 1;
          }
        });

        // Convert to stats array and sort by timestamp
        const statsArray: FileStats[] = Array.from(intervals.entries())
          .map(([timeRange, data]) => ({
            time: timeRange,
            timestamp: data.timestamp,
            cvs: data.cvs,
            jobs: data.jobs,
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        setStats(statsArray);
        setLoading(false);
      } catch (err) {
        console.error("Error processing file stats:", err);
        setError("Failed to process file statistics");
        setLoading(false);
      }
    };

    // Subscribe to CVs collection
    const unsubscribeCvs = onSnapshot(
      cvsQuery,
      (snapshot) => {
        cvsData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          cvsData.push({
            ...data,
            id: doc.id,
          } as CVDocument);
        });
        cvsLoaded = true;
        processData();
      },
      (err) => {
        console.error("Error fetching CVs:", err);
        setError("Failed to fetch CVs data");
        setLoading(false);
      }
    );

    // Subscribe to jobs collection
    const unsubscribeJobs = onSnapshot(
      jobsQuery,
      (snapshot) => {
        jobsData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          jobsData.push({
            ...data,
            id: doc.id,
          } as JobDocument);
        });
        jobsLoaded = true;
        processData();
      },
      (err) => {
        console.error("Error fetching jobs:", err);
        setError("Failed to fetch jobs data");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeCvs();
      unsubscribeJobs();
    };
  }, []);

  return { stats, loading, error };
};