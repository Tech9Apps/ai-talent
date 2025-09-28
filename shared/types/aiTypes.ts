/**
 * AI Analysis types - shared between client and functions
 */

export interface AIAnalysisRequest {
  fileId: string;
  uploadType: 'cv' | 'jobDescription';
}

export interface CVAnalysis {
  jobHistory: string[];
  technologies: string[];
  experienceYears: number;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  education?: string[];
  warnings: string[];
}

export interface JobAnalysis {
  title: string;
  company?: string;
  requiredSkills: string[];
  experienceRequired: number;
  location?: string;
  salary?: string;
  description: string;
  requirements: string[];
  warnings: string[];
}

export type AIAnalysisResult = CVAnalysis | JobAnalysis;

export interface AIProcessResponse {
  success: boolean;
  message: string;
  fileId: string;
  analysis: AIAnalysisResult;
  warnings: string[];
  processedAt: string;
}

export interface JobMatchRequest {
  fileId: string;
  cvAnalysisId?: string;
}

export interface JobMatch {
  jobId: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: boolean;
  location?: string;
}

export interface JobMatchResponse {
  success: boolean;
  message: string;
  fileId: string;
  matches: JobMatch[];
  totalMatches: number;
  warnings: string[];
  processedAt: string;
}