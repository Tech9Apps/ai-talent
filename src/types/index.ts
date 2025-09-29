export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface FileUploadData {
  file: File;
  type: 'cv' | 'jobDescription';
  timestamp: Date;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface UploadStats {
  totalUploads: number;
  successfulMatches: number;
  pendingReviews: number;
  rejectedApplications: number;
}

export interface NotificationItem {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'success' | 'info' | 'warning' | 'error';
}