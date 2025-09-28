/**
 * OpenAI Service
 * Handles AI analysis using OpenAI API
 */

import OpenAI from 'openai';
import * as logger from "firebase-functions/logger";
import { CVAnalysis, JobAnalysis } from '../../../shared/types/aiTypes';
import * as admin from 'firebase-admin';

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Resolve model with env override and safe default
function resolveModel(): string {
  return process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini'; // smaller, faster JSON friendly; can be overridden
}

// Upload a file (buffer) to OpenAI Files API and return file id
async function uploadBufferToOpenAI(buffer: Buffer, fileName: string, purpose: 'assistants' | 'fine-tune' = 'assistants'): Promise<string> {
  const client = getOpenAIClient();
  logger.info('Uploading file to OpenAI', { structuredData: true, fileName, size: buffer.length });
  // Use lower-level form creation accepted by openai lib: pass as ReadableStream
  const file = await client.files.create({
    file: buffer as any, // Buffer accepted
    purpose
  });
  logger.info('File uploaded to OpenAI', { structuredData: true, fileId: file.id, fileName });
  return file.id;
}

// Helper to download file buffer from Firebase Storage
export async function downloadStorageFile(storagePath: string): Promise<{ buffer: Buffer; fileName: string; contentType: string; }> {
  const bucket = admin.storage().bucket();
  const file = bucket.file(storagePath);
  const [metadata] = await file.getMetadata();
  const [buffer] = await file.download();
  return { buffer, fileName: metadata.name || 'uploaded_file', contentType: metadata.contentType || 'application/octet-stream' };
}

// Generic JSON extraction instruction reused for file-mode prompts
const cvSystemPrompt = 'You are a professional CV analyzer. Extract structured information from CVs and return only valid JSON.';
const jobSystemPrompt = 'You are a professional job description analyzer. Extract structured information from job postings and return only valid JSON.';

const cvUserInstructions = `Extract the following JSON fields (omit if unknown):\n- jobHistory: string[]\n- technologies: string[]\n- experienceYears: number\n- name: string\n- email: string\n- phone: string\n- location: string\n- summary: string\n- education: string[]\nReturn ONLY minified JSON.`;

const jobUserInstructions = `Extract the following JSON fields (omit if unknown):\n- title: string\n- company: string\n- requiredSkills: string[]\n- experienceRequired: number\n- location: string\n- salary: string\n- description: string\n- requirements: string[]\nReturn ONLY minified JSON.`;

// Attempt analysis by uploading raw file to OpenAI (using responses API with file content reference) – experimental
export async function analyzeFileWithOpenAI(fileBuffer: Buffer, originalName: string, kind: 'cv' | 'job'): Promise<any> {
  try {
    const model = resolveModel();
    const fileId = await uploadBufferToOpenAI(fileBuffer, originalName);

    const client = getOpenAIClient();

    // Use Responses API with input array referencing uploaded file
    const instructions = kind === 'cv' ? cvUserInstructions : jobUserInstructions;
    const system = kind === 'cv' ? cvSystemPrompt : jobSystemPrompt;

    const response = await client.responses.create({
      model,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: [
          { type: 'input_text', text: instructions },
          { type: 'input_text', text: 'Use the attached file to extract data.' },
          { type: 'input_file', file_id: fileId }
        ] }
      ],
      temperature: 0.2,
      max_output_tokens: 1200
    });

    // Flatten output text pieces
    let text = '';
    if (Array.isArray(response.output)) {
      text = response.output.map((item: any) => {
        if (item.type === 'output_text') {
          return item.text;
        }
        if (item.type === 'message') {
          // message has content array
            const parts = item.content?.map((p: any) => p.text || '').join('\n');
            return parts;
        }
        return '';
      }).join('\n');
    } else if ((response as any).output_text) {
      text = (response as any).output_text;
    }
    if (!text) throw new Error('Empty AI response');
    let parsed;
    try { parsed = JSON.parse(text); } catch { throw new Error('Invalid JSON in AI response'); }
    return parsed;
  } catch (err) {
    logger.warn('File-based OpenAI analysis failed, will fallback to text extraction', { structuredData: true, error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

/**
 * Analyzes CV using OpenAI with text content
 */
export async function analyzeCVWithOpenAI(text: string): Promise<CVAnalysis> {
  const warnings: string[] = [];
  
  try {
    logger.info("Analyzing CV with OpenAI", {
      structuredData: true,
      textLength: text.length,
      timestamp: new Date().toISOString(),
    });

    const completion = await getOpenAIClient().chat.completions.create({
      model: resolveModel(),
      messages: [
        {
          role: "system",
          content: "You are a professional CV analyzer. Extract structured information from CVs and return only valid JSON."
        },
        {
          role: "user",
          content: `Analyze this CV/Resume text and extract the following information in JSON format:

CV Text:
${text}

Extract:
- jobHistory: Array of job positions with company and dates (e.g., ["Software Developer at TechCorp (2020-2023)"])
- technologies: Array of technical skills, programming languages, frameworks, tools
- experienceYears: Total years of professional experience (number)
- name: Full name of the person
- email: Email address
- phone: Phone number
- location: Current location/city
- summary: Brief professional summary (2-3 sentences)
- education: Array of educational background (e.g., ["Computer Science, University of XYZ (2018)"])

Return ONLY valid JSON. If any field cannot be determined from the text, omit it or use empty array/null.`
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      warnings.push("OpenAI returned empty response");
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(responseContent);
    } catch (parseError) {
      warnings.push("Failed to parse AI response as JSON");
      throw new Error("Invalid JSON response from AI");
    }

    // Validate and build the response with warnings for missing fields
    const analysis: CVAnalysis = {
      jobHistory: parsedData.jobHistory || [],
      technologies: parsedData.technologies || [],
      experienceYears: parsedData.experienceYears || 0,
      education: parsedData.education || [],
      warnings: [...warnings]
    };

    // Only add fields that have actual values (not undefined)
    if (parsedData.name) analysis.name = parsedData.name;
    if (parsedData.email) analysis.email = parsedData.email;
    if (parsedData.phone) analysis.phone = parsedData.phone;
    if (parsedData.location) analysis.location = parsedData.location;
    if (parsedData.summary) analysis.summary = parsedData.summary;

    // Add warnings for missing critical fields
    if (!analysis.name) {
      analysis.warnings.push("Name not found in CV");
    }
    if (!analysis.email) {
      analysis.warnings.push("Email not found in CV");
    }
    if (analysis.jobHistory.length === 0) {
      analysis.warnings.push("No work experience found");
    }
    if (analysis.technologies.length === 0) {
      analysis.warnings.push("No technical skills identified");
    }
    if (analysis.experienceYears === 0) {
      analysis.warnings.push("Could not determine years of experience");
    }

    logger.info("CV analysis completed", {
      structuredData: true,
      warningsCount: analysis.warnings.length,
      technologiesCount: analysis.technologies.length,
      jobHistoryCount: analysis.jobHistory.length,
      timestamp: new Date().toISOString(),
    });

    return analysis;

  } catch (error) {
    logger.error("Failed to analyze CV with OpenAI", {
      structuredData: true,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    // Return default structure with error warnings
    return {
      jobHistory: [],
      technologies: [],
      experienceYears: 0,
      warnings: [
        ...warnings,
        "AI analysis failed - using manual processing",
        error instanceof Error ? error.message : "Unknown error occurred"
      ]
    };
  }
}

/**
 * Analyzes Job Description text using OpenAI
 */
export async function analyzeJobWithOpenAI(text: string): Promise<JobAnalysis> {
  const warnings: string[] = [];
  
  try {
    logger.info("Analyzing Job Description with OpenAI", {
      structuredData: true,
      textLength: text.length,
      timestamp: new Date().toISOString(),
    });

    const prompt = `
Analyze this Job Description text and extract the following information in JSON format:

Job Description Text:
${text}

Extract:
- title: Job title/position
- company: Company name
- requiredSkills: Array of technical skills, technologies, frameworks required
- experienceRequired: Minimum years of experience required (number)
- location: Job location (city, state, or "Remote")
- salary: Salary range if mentioned
- description: Brief job description (2-3 sentences)
- requirements: Array of key requirements/qualifications

Return ONLY valid JSON. If any field cannot be determined from the text, omit it or use empty array/null.
`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: resolveModel(),
      messages: [
        {
          role: "system",
          content: "You are a professional job description analyzer. Extract structured information from job postings and return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      warnings.push("OpenAI returned empty response");
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(responseContent);
    } catch (parseError) {
      warnings.push("Failed to parse AI response as JSON");
      throw new Error("Invalid JSON response from AI");
    }

    // Validate and build the response with warnings for missing fields
    const analysis: JobAnalysis = {
      title: parsedData.title || "Unknown Position",
      requiredSkills: parsedData.requiredSkills || [],
      experienceRequired: parsedData.experienceRequired || 0,
      description: parsedData.description || "",
      requirements: parsedData.requirements || [],
      warnings: [...warnings]
    };

    // Only add fields that have actual values (not undefined)
    if (parsedData.company) analysis.company = parsedData.company;
    if (parsedData.location) analysis.location = parsedData.location;
    if (parsedData.salary) analysis.salary = parsedData.salary;

    // Add warnings for missing critical fields
    if (analysis.title === "Unknown Position") {
      analysis.warnings.push("Job title not clearly identified");
    }
    if (!analysis.company) {
      analysis.warnings.push("Company name not found");
    }
    if (analysis.requiredSkills.length === 0) {
      analysis.warnings.push("No technical requirements identified");
    }
    if (analysis.experienceRequired === 0) {
      analysis.warnings.push("Experience requirements not specified");
    }
    if (!analysis.location) {
      analysis.warnings.push("Job location not specified");
    }
    if (analysis.requirements.length === 0) {
      analysis.warnings.push("Job requirements not clearly listed");
    }

    logger.info("Job analysis completed", {
      structuredData: true,
      warningsCount: analysis.warnings.length,
      requiredSkillsCount: analysis.requiredSkills.length,
      requirementsCount: analysis.requirements.length,
      timestamp: new Date().toISOString(),
    });

    return analysis;

  } catch (error) {
    logger.error("Failed to analyze Job Description with OpenAI", {
      structuredData: true,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    // Return default structure with error warnings
    return {
      title: "Unknown Position",
      requiredSkills: [],
      experienceRequired: 0,
      description: "",
      requirements: [],
      warnings: [
        ...warnings,
        "AI analysis failed - using manual processing",
        error instanceof Error ? error.message : "Unknown error occurred"
      ]
    };
  }
}