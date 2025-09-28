import OpenAI from "openai";
import * as logger from "firebase-functions/logger";
import { CVAnalysis, JobAnalysis } from "../../../shared/types/aiTypes";
import * as admin from "firebase-admin";
import pdfParse from "pdf-parse";
import * as mammoth from "mammoth";
import * as path from "path";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not configured");
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

function resolveModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

// Función para extraer texto de diferentes tipos de archivos
async function extractTextFromBuffer(buffer: Buffer, fileName: string): Promise<string> {
  const fileExtension = path.extname(fileName).toLowerCase();
  
  logger.info('Extracting text from file', {
    structuredData: true,
    fileName,
    fileExtension,
    size: buffer.length
  });

  try {
    switch (fileExtension) {
      case '.pdf':
        const pdfData = await pdfParse(buffer);
        logger.info('PDF text extracted', {
          structuredData: true,
          fileName,
          textLength: pdfData.text.length,
          pages: pdfData.numpages
        });
        return pdfData.text;

      case '.docx':
      case '.doc':
        const result = await mammoth.extractRawText({ buffer });
        logger.info('Word document text extracted', {
          structuredData: true,
          fileName,
          textLength: result.value.length
        });
        return result.value;

      case '.txt':
        const textContent = buffer.toString('utf-8');
        logger.info('Text file content extracted', {
          structuredData: true,
          fileName,
          textLength: textContent.length
        });
        return textContent;

      default:
        // Intenta leer como texto plano por defecto
        const defaultContent = buffer.toString('utf-8');
        logger.info('Default text extraction used', {
          structuredData: true,
          fileName,
          fileExtension,
          textLength: defaultContent.length
        });
        return defaultContent;
    }
  } catch (error) {
    logger.error('Text extraction failed', {
      structuredData: true,
      fileName,
      fileExtension,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(`Failed to extract text from ${fileExtension} file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Función para extraer texto de archivo en Firebase Storage
async function extractTextFromStorageFile(storagePath: string, originalName: string): Promise<string> {
  try {
    logger.info("Downloading file from storage for text extraction", {
      structuredData: true,
      storagePath,
      originalName
    });

    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);
    const [buffer] = await file.download();
    
    logger.info("File downloaded from storage", {
      structuredData: true,
      storagePath,
      downloadedSize: buffer.length
    });

    return await extractTextFromBuffer(buffer, originalName);
  } catch (error) {
    logger.error('Storage file text extraction failed', {
      structuredData: true,
      storagePath,
      originalName,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export async function analyzeFileWithOpenAI(
  fileBuffer: Buffer,
  originalName: string,
  kind: "cv" | "job"
): Promise<any> {
  try {
    logger.info('Starting text-based OpenAI analysis', { 
      structuredData: true, 
      originalName, 
      size: fileBuffer.length, 
      kind 
    });
    
    // Extraer texto del archivo
    const extractedText = await extractTextFromBuffer(fileBuffer, originalName);
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error(`Could not extract text from file ${originalName}. The file might be corrupted, empty, or in an unsupported format.`);
    }

    if (extractedText.length < 50) {
      throw new Error(`File ${originalName} contains very little text (${extractedText.length} characters). This might not be a valid ${kind === 'cv' ? 'CV' : 'job description'}.`);
    }

    logger.info('Text extracted successfully, sending to OpenAI', {
      structuredData: true,
      originalName,
      textLength: extractedText.length,
      textPreview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : ''),
      kind
    });
    
    const client = getOpenAIClient();
    const model = resolveModel();
    
    const systemPrompt = kind === "cv" 
      ? "You are a professional CV analyzer. Extract structured information from CVs and respond ONLY with valid JSON, no additional explanations."
      : "You are a professional job description analyzer. Extract structured information from job postings and respond ONLY with valid JSON, no additional explanations.";
      
    const userPrompt = kind === "cv" 
      ? `Analyze this CV and extract the information in JSON:
{
  "name": "full name",
  "email": "email address",  
  "phone": "phone number",
  "location": "location",
  "summary": "brief summary",
  "experienceYears": number,
  "technologies": ["tech1", "tech2"],
  "jobHistory": [{"company": "", "position": "", "duration": "", "description": ""}],
  "education": [{"institution": "", "degree": "", "year": ""}]
}

CV:
${extractedText.substring(0, 8000)}

Respond only JSON:`
      : `Analyze this job offer and extract the information in JSON:
{
  "title": "job title",
  "company": "company name",
  "location": "location", 
  "salary": "salary",
  "experienceRequired": number,
  "requiredSkills": ["skill1", "skill2"],
  "description": "job description",
  "requirements": ["req1", "req2"]
}

JOB OFFER:
${extractedText.substring(0, 8000)}

Respond only JSON:`;
    
    logger.info('Sending text content to OpenAI', {
      structuredData: true,
      kind,
      textLength: extractedText.length
    });
    
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 2500, // Aumentar tokens para respuestas más completas
    });
    
    const responseContent = response.choices[0]?.message?.content?.trim();
    if (!responseContent) {
      throw new Error('OpenAI did not return a valid response. This could indicate a problem with the file content.');
    }

    // Check if response indicates it's not the expected document type
    if (responseContent.toLowerCase().includes('not a cv') || 
        responseContent.toLowerCase().includes('not a job') ||
        responseContent.toLowerCase().includes('invalid document') ||
        responseContent.toLowerCase().includes('cannot analyze')) {
      throw new Error(`The file does not appear to be a valid ${kind === 'cv' ? 'CV' : 'job description'}: ${responseContent}`);
    }

    // Check for token limit issues
    if (responseContent.toLowerCase().includes('too large') || 
        responseContent.toLowerCase().includes('token limit') ||
        responseContent.toLowerCase().includes('exceeds limit')) {
      throw new Error(`The file is too large to be processed. Please reduce the file size and try again.`);
    }
    
    logger.info('Received response from OpenAI', {
      structuredData: true,
      responseLength: responseContent.length,
      responsePreview: responseContent.substring(0, 100) + (responseContent.length > 100 ? '...' : ''),
      kind
    });
    
    // Clean and validate JSON response
    let cleanedResponse = responseContent;
    
    // Remove any text before the first { or after the last }
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      logger.error('Response does not contain valid JSON braces', {
        structuredData: true,
        response: responseContent,
        kind
      });
      throw new Error('AI response is not valid JSON format');
    }
    
    cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
    
    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (parseError) {
      logger.error('Failed to parse cleaned JSON response', {
        structuredData: true,
        originalResponse: responseContent,
        cleanedResponse,
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
        kind
      });
      throw new Error('Invalid JSON in AI response');
    }

    // Add warnings for missing fields (only warnings, not errors)
    const warnings: string[] = [];
    if (kind === 'cv') {
      if (!parsed.name || !parsed.name.trim()) warnings.push('Name not found in CV');
      if (!parsed.email || !parsed.email.trim()) warnings.push('Email not found in CV');
      if (!parsed.experienceYears || parsed.experienceYears === 0) warnings.push('Years of experience not found in CV');
      if (!parsed.technologies || parsed.technologies.length === 0) warnings.push('Technologies not found in CV');
      if (!parsed.jobHistory || parsed.jobHistory.length === 0) warnings.push('Job history not found in CV');
    } else {
      if (!parsed.title || !parsed.title.trim()) warnings.push('Job title not found');
      if (!parsed.company || !parsed.company.trim()) warnings.push('Company name not found');
      if (!parsed.requiredSkills || parsed.requiredSkills.length === 0) warnings.push('Required skills not found');
      if (!parsed.description || !parsed.description.trim()) warnings.push('Job description not found');
    }
    
    // Add warnings to parsed object
    parsed.warnings = warnings;

    logger.info('Text-based analysis completed successfully', { 
      structuredData: true, 
      kind, 
      originalName,
      textLength: extractedText.length,
      warningsCount: warnings.length
    });
    
    return parsed;
  } catch (error) {
    logger.error('Text-based OpenAI analysis failed', { 
      structuredData: true, 
      originalName, 
      kind, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

export async function analyzeStorageFileWithOpenAI(
  storagePath: string,
  originalName: string,
  kind: "cv" | "job"
): Promise<any> {
  try {
    logger.info("Starting storage-based text analysis", { 
      structuredData: true, 
      storagePath, 
      originalName, 
      kind 
    });
    
    // Extraer texto del archivo de storage
    const extractedText = await extractTextFromStorageFile(storagePath, originalName);
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error(`Could not extract text from file ${originalName}. The file might be corrupted, empty, or in an unsupported format.`);
    }

    if (extractedText.length < 50) {
      throw new Error(`File ${originalName} contains very little text (${extractedText.length} characters). This might not be a valid ${kind === 'cv' ? 'CV' : 'job description'}.`);
    }

    logger.info('Text extracted from storage file, sending to OpenAI', {
      structuredData: true,
      storagePath,
      originalName,
      textLength: extractedText.length,
      textPreview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : ''),
      kind
    });
    
    const client = getOpenAIClient();
    const model = resolveModel();
    
    const systemPrompt = kind === "cv" 
      ? "You are a professional CV analyzer. Extract structured information from CVs and respond ONLY with valid JSON, no additional explanations."
      : "You are a professional job description analyzer. Extract structured information from job postings and respond ONLY with valid JSON, no additional explanations.";
      
    const userPrompt = kind === "cv" 
      ? `Analyze this CV and extract the information in JSON:
{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "location": "location", 
  "summary": "brief summary",
  "experienceYears": number,
  "technologies": ["tech1", "tech2"],
  "jobHistory": [{"company": "", "position": "", "duration": "", "description": ""}],
  "education": [{"institution": "", "degree": "", "year": ""}]
}

CV:
${extractedText.substring(0, 8000)}

Respond only JSON:`
      : `Analyze this job offer and extract the information in JSON:
{
  "title": "job title",
  "company": "company name",
  "location": "location", 
  "salary": "salary",
  "experienceRequired": number,
  "requiredSkills": ["skill1", "skill2"],
  "description": "job description",
  "requirements": ["req1", "req2"]
}

JOB OFFER:
${extractedText.substring(0, 8000)}

Respond only JSON:`;
    
    logger.info('Sending storage file text content to OpenAI', {
      structuredData: true,
      storagePath,
      kind,
      textLength: extractedText.length
    });
    
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 2500,
    });
    
    const responseContent = response.choices[0]?.message?.content?.trim();
    if (!responseContent) {
      throw new Error('OpenAI did not return a valid response. This could indicate a problem with the file content.');
    }

    // Check if response indicates it's not the expected document type
    if (responseContent.toLowerCase().includes('not a cv') || 
        responseContent.toLowerCase().includes('not a job') ||
        responseContent.toLowerCase().includes('invalid document') ||
        responseContent.toLowerCase().includes('cannot analyze')) {
      throw new Error(`The file does not appear to be a valid ${kind === 'cv' ? 'CV' : 'job description'}: ${responseContent}`);
    }

    // Check for token limit issues
    if (responseContent.toLowerCase().includes('too large') || 
        responseContent.toLowerCase().includes('token limit') ||
        responseContent.toLowerCase().includes('exceeds limit')) {
      throw new Error(`The file is too large to be processed. Please reduce the file size and try again.`);
    }
    
    logger.info('Received response from OpenAI for storage file', {
      structuredData: true,
      responseLength: responseContent.length,
      responsePreview: responseContent.substring(0, 100) + (responseContent.length > 100 ? '...' : ''),
      storagePath,
      kind
    });
    
    // Clean and validate JSON response
    let cleanedResponse = responseContent;
    
    // Remove any text before the first { or after the last }
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      logger.error('Response does not contain valid JSON braces', {
        structuredData: true,
        response: responseContent,
        storagePath,
        kind
      });
      throw new Error('AI response is not valid JSON format');
    }
    
    cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
    
    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (parseError) {
      logger.error('Failed to parse cleaned JSON response', {
        structuredData: true,
        originalResponse: responseContent,
        cleanedResponse,
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
        storagePath,
        kind
      });
      throw new Error('Invalid JSON in AI response');
    }

    // Add warnings for missing fields (only warnings, not errors)
    const warnings: string[] = [];
    if (kind === 'cv') {
      if (!parsed.name || !parsed.name.trim()) warnings.push('Name not found in CV');
      if (!parsed.email || !parsed.email.trim()) warnings.push('Email not found in CV');
      if (!parsed.experienceYears || parsed.experienceYears === 0) warnings.push('Years of experience not found in CV');
      if (!parsed.technologies || parsed.technologies.length === 0) warnings.push('Technologies not found in CV');
      if (!parsed.jobHistory || parsed.jobHistory.length === 0) warnings.push('Job history not found in CV');
    } else {
      if (!parsed.title || !parsed.title.trim()) warnings.push('Job title not found');
      if (!parsed.company || !parsed.company.trim()) warnings.push('Company name not found');
      if (!parsed.requiredSkills || parsed.requiredSkills.length === 0) warnings.push('Required skills not found');
      if (!parsed.description || !parsed.description.trim()) warnings.push('Job description not found');
    }
    
    // Add warnings to parsed object
    parsed.warnings = warnings;
    
    logger.info('Storage-based text analysis completed successfully', { 
      structuredData: true, 
      storagePath, 
      originalName,
      textLength: extractedText.length,
      warningsCount: warnings.length,
      kind 
    });
    
    return parsed;
  } catch (error) {
    logger.error('Storage-based text analysis failed', { 
      structuredData: true, 
      storagePath, 
      originalName, 
      kind, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

export async function analyzeCVWithOpenAI(text: string): Promise<CVAnalysis> {
  const warnings: string[] = [];

  try {
    logger.info("Analyzing CV with OpenAI", {
      structuredData: true,
      textLength: text.length,
    });

    const completion = await getOpenAIClient().chat.completions.create({
      model: resolveModel(),
      messages: [
        {
          role: "system",
          content: "You are a professional CV analyzer. You MUST respond with ONLY valid JSON, no explanations, no apologies, no additional text.",
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

CRITICAL: Return ONLY valid JSON. Start with { and end with }. No explanations before or after.`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.1,
    });

    const responseContent = completion.choices[0]?.message?.content?.trim();
    if (!responseContent) {
      warnings.push("OpenAI returned empty response");
      throw new Error("Empty response from OpenAI");
    }

    logger.info("CV analysis - received OpenAI response", {
      structuredData: true,
      textLength: text.length,
      responseLength: responseContent.length,
      fullResponse: responseContent, // Log completo de la respuesta
    });

    // Clean and validate JSON response
    let cleanedResponse = responseContent;
    
    // Remove any text before the first { or after the last }
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      logger.error('CV analysis response does not contain valid JSON braces', {
        structuredData: true,
        response: responseContent,
      });
      warnings.push("AI response is not valid JSON format");
      throw new Error("AI response is not valid JSON format");
    }
    
    cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      logger.error('Failed to parse CV analysis JSON response', {
        structuredData: true,
        originalResponse: responseContent,
        cleanedResponse,
        parseError: parseError instanceof Error ? parseError.message : String(parseError)
      });
      warnings.push("Failed to parse AI response as JSON");
      throw new Error("Invalid JSON response from AI");
    }

    const analysis: CVAnalysis = {
      jobHistory: parsedData.jobHistory || [],
      technologies: parsedData.technologies || [],
      experienceYears: parsedData.experienceYears || 0,
      education: parsedData.education || [],
      warnings: [...warnings],
    };

    if (parsedData.name) analysis.name = parsedData.name;
    if (parsedData.email) analysis.email = parsedData.email;
    if (parsedData.phone) analysis.phone = parsedData.phone;
    if (parsedData.location) analysis.location = parsedData.location;
    if (parsedData.summary) analysis.summary = parsedData.summary;

    if (!analysis.name) analysis.warnings.push("Name not found in CV");
    if (!analysis.email) analysis.warnings.push("Email not found in CV");
    if (analysis.jobHistory.length === 0) analysis.warnings.push("No work experience found");
    if (analysis.technologies.length === 0) analysis.warnings.push("No technical skills identified");
    if (analysis.experienceYears === 0) analysis.warnings.push("Could not determine years of experience");

    logger.info("CV analysis completed", {
      structuredData: true,
      warningsCount: analysis.warnings.length,
    });

    return analysis;
  } catch (error) {
    logger.error("Failed to analyze CV with OpenAI", {
      structuredData: true,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      jobHistory: [],
      technologies: [],
      experienceYears: 0,
      education: [],
      warnings: [
        ...warnings,
        "AI analysis failed",
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
}

export async function analyzeJobWithOpenAI(text: string): Promise<JobAnalysis> {
  const warnings: string[] = [];

  try {
    logger.info("Analyzing Job Description with OpenAI", {
      structuredData: true,
      textLength: text.length,
    });

    const completion = await getOpenAIClient().chat.completions.create({
      model: resolveModel(),
      messages: [
        {
          role: "system",
          content: "You are a professional job description analyzer. You MUST respond with ONLY valid JSON, no explanations, no apologies, no additional text.",
        },
        {
          role: "user",
          content: `Analyze this Job Description text and extract the following information in JSON format:

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

CRITICAL: Return ONLY valid JSON. Start with { and end with }. No explanations before or after.`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const responseContent = completion.choices[0]?.message?.content?.trim();
    if (!responseContent) {
      warnings.push("OpenAI returned empty response");
      throw new Error("Empty response from OpenAI");
    }

    logger.info("Job analysis - received OpenAI response", {
      structuredData: true,
      textLength: text.length,
      responseLength: responseContent.length,
      fullResponse: responseContent, // Log completo de la respuesta
    });

    // Clean and validate JSON response
    let cleanedResponse = responseContent;
    
    // Remove any text before the first { or after the last }
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      logger.error('Job analysis response does not contain valid JSON braces', {
        structuredData: true,
        response: responseContent,
      });
      warnings.push("AI response is not valid JSON format");
      throw new Error("AI response is not valid JSON format");
    }
    
    cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      logger.error('Failed to parse Job analysis JSON response', {
        structuredData: true,
        originalResponse: responseContent,
        cleanedResponse,
        parseError: parseError instanceof Error ? parseError.message : String(parseError)
      });
      warnings.push("Failed to parse AI response as JSON");
      throw new Error("Invalid JSON response from AI");
    }

    const analysis: JobAnalysis = {
      title: parsedData.title || "Unknown Position",
      requiredSkills: parsedData.requiredSkills || [],
      experienceRequired: parsedData.experienceRequired || 0,
      description: parsedData.description || "",
      requirements: parsedData.requirements || [],
      warnings: [...warnings],
    };

    if (parsedData.company) analysis.company = parsedData.company;
    if (parsedData.location) analysis.location = parsedData.location;
    if (parsedData.salary) analysis.salary = parsedData.salary;

    if (analysis.title === "Unknown Position") analysis.warnings.push("Job title not clearly identified");
    if (!analysis.company) analysis.warnings.push("Company name not found");
    if (analysis.requiredSkills.length === 0) analysis.warnings.push("No technical requirements identified");
    if (analysis.experienceRequired === 0) analysis.warnings.push("Experience requirements not specified");
    if (!analysis.location) analysis.warnings.push("Job location not specified");
    if (analysis.requirements.length === 0) analysis.warnings.push("Job requirements not clearly listed");

    logger.info("Job analysis completed", {
      structuredData: true,
      warningsCount: analysis.warnings.length,
    });

    return analysis;
  } catch (error) {
    logger.error("Failed to analyze Job Description with OpenAI", {
      structuredData: true,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      title: "Unknown Position",
      requiredSkills: [],
      experienceRequired: 0,
      description: "",
      requirements: [],
      warnings: [
        ...warnings,
        "AI analysis failed",
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
}
