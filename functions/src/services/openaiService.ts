import OpenAI from "openai";
import * as logger from "firebase-functions/logger";
import { CVAnalysis, JobAnalysis } from "../../../shared/types/aiTypes";
import { extractTextFromBuffer, extractTextFromStorageFile } from "../utils/storage";


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

// Función para dividir texto en chunks inteligentes
function createTextChunks(
  text: string,
  maxChunkSize: number = 200000
): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let chunkEnd = Math.min(currentIndex + maxChunkSize, text.length);

    // Si no estamos al final del texto, buscar un buen punto de corte
    if (chunkEnd < text.length) {
      // Buscar el último salto de línea, punto, o espacio para evitar cortar palabras/oraciones
      const searchEnd = Math.max(
        chunkEnd - 500,
        currentIndex + maxChunkSize * 0.9
      );
      const lastNewline = text.lastIndexOf("\n", chunkEnd);
      const lastPeriod = text.lastIndexOf(".", chunkEnd);
      const lastSpace = text.lastIndexOf(" ", chunkEnd);

      if (lastNewline > searchEnd) {
        chunkEnd = lastNewline + 1;
      } else if (lastPeriod > searchEnd) {
        chunkEnd = lastPeriod + 1;
      } else if (lastSpace > searchEnd) {
        chunkEnd = lastSpace + 1;
      }
    }

    chunks.push(text.slice(currentIndex, chunkEnd).trim());
    currentIndex = chunkEnd;
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

// Función para mergear respuestas de análisis de manera inteligente
function mergeAnalysisResponses(responses: any[], kind: "cv" | "job"): any {
  if (responses.length === 0) return null;
  if (responses.length === 1) return responses[0];

  const merged: any = {};

  if (kind === "cv") {
    // Mergear información de CV
    merged.name = responses.find((r) => r.name && r.name.trim())?.name || "";
    merged.email =
      responses.find((r) => r.email && r.email.trim())?.email || "";
    merged.phone =
      responses.find((r) => r.phone && r.phone.trim())?.phone || "";
    merged.location =
      responses.find((r) => r.location && r.location.trim())?.location || "";

    // Para summary, usar el más largo/completo
    const summaries = responses.filter((r) => r.summary && r.summary.trim());
    merged.summary =
      summaries.length > 0
        ? summaries.reduce((longest, current) =>
            current.summary.length > longest.summary.length ? current : longest
          ).summary
        : "";

    // Para experienceYears, usar el máximo encontrado
    merged.experienceYears = Math.max(
      ...responses.map((r) => r.experienceYears || 0)
    );

    // Mergear arrays eliminando duplicados
    merged.technologies = [
      ...new Set(responses.flatMap((r) => r.technologies || [])),
    ];

    // Mergear job history eliminando duplicados por company+position
    const allJobs = responses.flatMap((r) => r.jobHistory || []);
    const uniqueJobs = allJobs.filter(
      (job, index, arr) =>
        index ===
        arr.findIndex(
          (j) => j.company === job.company && j.position === job.position
        )
    );
    merged.jobHistory = uniqueJobs;

    // Mergear education eliminando duplicados
    const allEducation = responses.flatMap((r) => r.education || []);
    const uniqueEducation = allEducation.filter(
      (edu, index, arr) =>
        index ===
        arr.findIndex(
          (e) => e.institution === edu.institution && e.degree === edu.degree
        )
    );
    merged.education = uniqueEducation;
  } else {
    // Mergear información de job
    merged.title =
      responses.find((r) => r.title && r.title.trim())?.title || "";
    merged.company =
      responses.find((r) => r.company && r.company.trim())?.company || "";
    merged.location =
      responses.find((r) => r.location && r.location.trim())?.location || "";
    merged.salary =
      responses.find((r) => r.salary && r.salary.trim())?.salary || "";

    // Para description, usar la más larga/completa
    const descriptions = responses.filter(
      (r) => r.description && r.description.trim()
    );
    merged.description =
      descriptions.length > 0
        ? descriptions.reduce((longest, current) =>
            current.description.length > longest.description.length
              ? current
              : longest
          ).description
        : "";

    // Para experienceRequired, usar el máximo encontrado
    merged.experienceRequired = Math.max(
      ...responses.map((r) => r.experienceRequired || 0)
    );

    // Mergear arrays eliminando duplicados
    merged.requiredSkills = [
      ...new Set(responses.flatMap((r) => r.requiredSkills || [])),
    ];
    merged.requirements = [
      ...new Set(responses.flatMap((r) => r.requirements || [])),
    ];
  }

  // Combinar todos los warnings únicos de todas las respuestas recursivas
  const allWarnings = responses.flatMap((r) => r.warnings || []);
  merged.warnings = [...new Set(allWarnings)];

  return merged;
}

// Función recursiva principal para análisis con chunking
async function recursiveAnalysis(
  textChunks: string[],
  kind: "cv" | "job",
  chunkIndex: number = 0,
  accumulatedResponses: any[] = []
): Promise<any> {
  if (chunkIndex >= textChunks.length) {
    return mergeAnalysisResponses(accumulatedResponses, kind);
  }

  const currentChunk = textChunks[chunkIndex];
  const client = getOpenAIClient();
  const model = resolveModel();

  const systemPrompt =
    kind === "cv"
      ? "You are a professional CV analyzer. Extract comprehensive information from CVs and respond ONLY with valid JSON."
      : "You are a professional job analyzer. Extract comprehensive information from job descriptions and respond ONLY with valid JSON.";

  const chunkContext =
    textChunks.length > 1
      ? ` (Analyzing part ${chunkIndex + 1} of ${textChunks.length})`
      : "";

  const userPrompt =
    kind === "cv"
      ? `Analyze this CV section and extract comprehensive information in JSON format${chunkContext}:

CV Content:
${currentChunk}

Required JSON format:
{
  "name": "full name",
  "email": "email address",  
  "phone": "phone number",
  "location": "location",
  "summary": "professional summary",
  "experienceYears": number,
  "technologies": ["tech1", "tech2", "tech3"],
  "jobHistory": [{"company": "company name", "position": "job title", "duration": "time period", "description": "job description"}],
  "education": [{"institution": "school name", "degree": "degree type", "year": "graduation year"}]
}

Respond with JSON only:`
      : `Analyze this job description section and extract comprehensive information in JSON format${chunkContext}:

Job Content:
${currentChunk}

Required JSON format:
{
  "title": "job title",
  "company": "company name",
  "location": "location", 
  "salary": "salary range",
  "experienceRequired": number,
  "requiredSkills": ["skill1", "skill2", "skill3"],
  "description": "detailed job description",
  "requirements": ["requirement1", "requirement2"]
}

Respond with JSON only:`;

  try {
    logger.info("Processing chunk with recursive analysis", {
      structuredData: true,
      chunkIndex: chunkIndex + 1,
      totalChunks: textChunks.length,
      chunkLength: currentChunk.length,
      kind,
    });

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const responseContent = response.choices[0]?.message?.content?.trim();
    if (!responseContent) {
      logger.warn("Empty response for chunk, skipping", {
        structuredData: true,
        chunkIndex: chunkIndex + 1,
        kind,
      });
      return recursiveAnalysis(
        textChunks,
        kind,
        chunkIndex + 1,
        accumulatedResponses
      );
    }

    // Clean and parse JSON
    const firstBrace = responseContent.indexOf("{");
    const lastBrace = responseContent.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      logger.warn("Invalid JSON response for chunk, skipping", {
        structuredData: true,
        chunkIndex: chunkIndex + 1,
        kind,
      });
      return recursiveAnalysis(
        textChunks,
        kind,
        chunkIndex + 1,
        accumulatedResponses
      );
    }

    const cleanedResponse = responseContent.substring(
      firstBrace,
      lastBrace + 1
    );
    const parsed = JSON.parse(cleanedResponse);

    logger.info("Successfully processed chunk", {
      structuredData: true,
      chunkIndex: chunkIndex + 1,
      totalChunks: textChunks.length,
      kind,
    });

    // Continuar recursivamente con el siguiente chunk
    return recursiveAnalysis(textChunks, kind, chunkIndex + 1, [
      ...accumulatedResponses,
      parsed,
    ]);
  } catch (error) {
    logger.warn("Error processing chunk, continuing with next", {
      structuredData: true,
      chunkIndex: chunkIndex + 1,
      error: error instanceof Error ? error.message : String(error),
      kind,
    });

    // Continuar con el siguiente chunk aunque este falle
    return recursiveAnalysis(
      textChunks,
      kind,
      chunkIndex + 1,
      accumulatedResponses
    );
  }
}





export async function analyzeFileWithOpenAI(
  fileBuffer: Buffer,
  originalName: string,
  kind: "cv" | "job"
): Promise<any> {
  try {
    logger.info("Starting text-based OpenAI analysis", {
      structuredData: true,
      originalName,
      size: fileBuffer.length,
      kind,
    });

    // Extraer texto del archivo
    const extractedText = await extractTextFromBuffer(fileBuffer, originalName);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error(
        `Could not extract text from file ${originalName}. The file might be corrupted, empty, or in an unsupported format.`
      );
    }

    if (extractedText.length < 50) {
      throw new Error(
        `File ${originalName} contains very little text (${
          extractedText.length
        } characters). This might not be a valid ${
          kind === "cv" ? "CV" : "job description"
        }.`
      );
    }

    logger.info("Text extracted successfully, sending to recursive analysis", {
      structuredData: true,
      originalName,
      textLength: extractedText.length,
      textPreview:
        extractedText.substring(0, 200) +
        (extractedText.length > 200 ? "..." : ""),
      kind,
    });

    // Usar análisis recursivo con chunking optimizado para límites de tokens
    const textChunks = createTextChunks(extractedText, 150000);
    logger.info("Created text chunks for analysis", {
      structuredData: true,
      originalName,
      totalChunks: textChunks.length,
      averageChunkSize: Math.round(extractedText.length / textChunks.length),
      kind,
    });

    const result = await recursiveAnalysis(textChunks, kind);

    if (!result) {
      throw new Error(
        `Failed to analyze ${
          kind === "cv" ? "CV" : "job description"
        }. No valid responses received from any text chunks.`
      );
    }

    // Add warnings for missing fields (only warnings, not errors)
    const warnings: string[] = result.warnings || [];
    if (kind === "cv") {
      if (!result.name || !result.name.trim())
        warnings.push("Name not found in CV");
      if (!result.email || !result.email.trim())
        warnings.push("Email not found in CV");
      if (!result.experienceYears || result.experienceYears === 0)
        warnings.push("Years of experience not found in CV");
      if (!result.technologies || result.technologies.length === 0)
        warnings.push("Technologies not found in CV");
      if (!result.jobHistory || result.jobHistory.length === 0)
        warnings.push("Job history not found in CV");
    } else {
      if (!result.title || !result.title.trim())
        warnings.push("Job title not found");
      if (!result.company || !result.company.trim())
        warnings.push("Company name not found");
      if (!result.requiredSkills || result.requiredSkills.length === 0)
        warnings.push("Required skills not found");
      if (!result.description || !result.description.trim())
        warnings.push("Job description not found");
    }

    result.warnings = warnings;

    logger.info("Recursive analysis completed successfully", {
      structuredData: true,
      kind,
      originalName,
      totalChunks: textChunks.length,
      warningsCount: warnings.length,
    });

    return result;
  } catch (error) {
    logger.error("Text-based OpenAI analysis failed", {
      structuredData: true,
      originalName,
      kind,
      error: error instanceof Error ? error.message : String(error),
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
      kind,
    });

    // Extraer texto del archivo de storage
    const extractedText = await extractTextFromStorageFile(
      storagePath,
      originalName
    );

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error(
        `Could not extract text from file ${originalName}. The file might be corrupted, empty, or in an unsupported format.`
      );
    }

    if (extractedText.length < 50) {
      throw new Error(
        `File ${originalName} contains very little text (${
          extractedText.length
        } characters). This might not be a valid ${
          kind === "cv" ? "CV" : "job description"
        }.`
      );
    }

    logger.info(
      "Text extracted from storage file, sending to recursive analysis",
      {
        structuredData: true,
        storagePath,
        originalName,
        textLength: extractedText.length,
        textPreview:
          extractedText.substring(0, 200) +
          (extractedText.length > 200 ? "..." : ""),
        kind,
      }
    );

    // Usar análisis recursivo con chunking optimizado para límites de tokens
    const textChunks = createTextChunks(extractedText, 200000);
    logger.info("Created text chunks for storage file analysis", {
      structuredData: true,
      storagePath,
      originalName,
      totalChunks: textChunks.length,
      averageChunkSize: Math.round(extractedText.length / textChunks.length),
      kind,
    });

    const result = await recursiveAnalysis(textChunks, kind);

    if (!result) {
      throw new Error(
        `Failed to analyze ${
          kind === "cv" ? "CV" : "job description"
        }. No valid responses received from any text chunks.`
      );
    }

    // Add warnings for missing fields (only warnings, not errors)
    const warnings: string[] = result.warnings || [];
    if (kind === "cv") {
      if (!result.name || !result.name.trim())
        warnings.push("Name not found in CV");
      if (!result.email || !result.email.trim())
        warnings.push("Email not found in CV");
      if (!result.experienceYears || result.experienceYears === 0)
        warnings.push("Years of experience not found in CV");
      if (!result.technologies || result.technologies.length === 0)
        warnings.push("Technologies not found in CV");
      if (!result.jobHistory || result.jobHistory.length === 0)
        warnings.push("Job history not found in CV");
    } else {
      if (!result.title || !result.title.trim())
        warnings.push("Job title not found");
      if (!result.company || !result.company.trim())
        warnings.push("Company name not found");
      if (!result.requiredSkills || result.requiredSkills.length === 0)
        warnings.push("Required skills not found");
      if (!result.description || !result.description.trim())
        warnings.push("Job description not found");
    }

    result.warnings = warnings;

    logger.info("Storage-based recursive analysis completed successfully", {
      structuredData: true,
      storagePath,
      originalName,
      totalChunks: textChunks.length,
      warningsCount: warnings.length,
      kind,
    });

    return result;
  } catch (error) {
    logger.error("Storage-based text analysis failed", {
      structuredData: true,
      storagePath,
      originalName,
      kind,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function analyzeCVWithOpenAI(text: string): Promise<CVAnalysis> {
  try {
    logger.info("Analyzing CV with recursive chunking", {
      structuredData: true,
      textLength: text.length,
    });

    // Usar el mismo sistema recursivo con chunks optimizados
    const textChunks = createTextChunks(text, 200000);
    logger.info("Created text chunks for CV analysis", {
      structuredData: true,
      totalChunks: textChunks.length,
      averageChunkSize: Math.round(text.length / textChunks.length),
    });

    const result = await recursiveAnalysis(textChunks, "cv");

    if (!result) {
      throw new Error(
        "Failed to analyze CV. No valid responses received from any text chunks."
      );
    }

    // Convert to CVAnalysis format
    const analysis: CVAnalysis = {
      jobHistory: result.jobHistory || [],
      technologies: result.technologies || [],
      experienceYears: result.experienceYears || 0,
      education: result.education || [],
      warnings: result.warnings || [],
    };

    if (result.name) analysis.name = result.name;
    if (result.email) analysis.email = result.email;
    if (result.phone) analysis.phone = result.phone;
    if (result.location) analysis.location = result.location;
    if (result.summary) analysis.summary = result.summary;

    // Add missing field warnings
    if (!analysis.name) analysis.warnings.push("Name not found in CV");
    if (!analysis.email) analysis.warnings.push("Email not found in CV");
    if (analysis.jobHistory.length === 0)
      analysis.warnings.push("No work experience found");
    if (analysis.technologies.length === 0)
      analysis.warnings.push("No technical skills identified");
    if (analysis.experienceYears === 0)
      analysis.warnings.push("Could not determine years of experience");

    logger.info("CV recursive analysis completed", {
      structuredData: true,
      totalChunks: textChunks.length,
      warningsCount: analysis.warnings.length,
    });

    return analysis;
  } catch (error) {
    logger.error("Failed to analyze CV with recursive chunking", {
      structuredData: true,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      jobHistory: [],
      technologies: [],
      experienceYears: 0,
      education: [],
      warnings: [
        "AI analysis failed",
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
}

export async function analyzeJobWithOpenAI(text: string): Promise<JobAnalysis> {
  try {
    logger.info("Analyzing Job Description with recursive chunking", {
      structuredData: true,
      textLength: text.length,
    });

    // Usar el mismo sistema recursivo con chunks optimizados
    const textChunks = createTextChunks(text, 200000);
    logger.info("Created text chunks for Job analysis", {
      structuredData: true,
      totalChunks: textChunks.length,
      averageChunkSize: Math.round(text.length / textChunks.length),
    });

    const result = await recursiveAnalysis(textChunks, "job");

    if (!result) {
      throw new Error(
        "Failed to analyze job description. No valid responses received from any text chunks."
      );
    }

    // Convert to JobAnalysis format
    const analysis: JobAnalysis = {
      title: result.title || "Unknown Position",
      requiredSkills: result.requiredSkills || [],
      experienceRequired: result.experienceRequired || 0,
      description: result.description || "",
      requirements: result.requirements || [],
      warnings: result.warnings || [],
    };

    if (result.company) analysis.company = result.company;
    if (result.location) analysis.location = result.location;
    if (result.salary) analysis.salary = result.salary;

    // Add missing field warnings
    if (analysis.title === "Unknown Position")
      analysis.warnings.push("Job title not clearly identified");
    if (!analysis.company) analysis.warnings.push("Company name not found");
    if (analysis.requiredSkills.length === 0)
      analysis.warnings.push("No technical requirements identified");
    if (analysis.experienceRequired === 0)
      analysis.warnings.push("Experience requirements not specified");
    if (!analysis.location)
      analysis.warnings.push("Job location not specified");
    if (analysis.requirements.length === 0)
      analysis.warnings.push("Job requirements not clearly listed");

    logger.info("Job recursive analysis completed", {
      structuredData: true,
      totalChunks: textChunks.length,
      warningsCount: analysis.warnings.length,
    });

    return analysis;
  } catch (error) {
    logger.error("Failed to analyze Job Description with recursive chunking", {
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
        "AI analysis failed",
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
}
