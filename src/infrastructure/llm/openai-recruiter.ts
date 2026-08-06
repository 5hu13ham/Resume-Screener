import OpenAI from "openai";

import {
  candidateEvaluationSchema,
  resumeExtractionSchema,
} from "@/src/application/dto/screening-dto";
import type {
  CandidateEvaluation,
  ResumeExtraction,
} from "@/src/domain/entities/screening";
import { AiError } from "@/src/domain/errors/app-error";
import type { AiRecruiterService } from "@/src/domain/ports/ai-recruiter";

import { HeuristicRecruiterService } from "@/src/infrastructure/llm/heuristic-recruiter";
import {
  DEFAULT_LLM_BASE_URL,
  DEFAULT_LLM_MODEL,
  getLlmRuntimeConfig,
} from "@/src/infrastructure/llm/llm-config";

async function withRetry<T>(
  operation: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`LLM request failed (attempt ${attempt}/${attempts})`, error);
      if (attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 600));
    }
  }
  throw lastError;
}

function extractJson(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? content;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new AiError("AI response did not include JSON.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

export class OpenAiRecruiterService implements AiRecruiterService {
  private readonly client: OpenAI | null;
  private readonly model: string;
  private readonly fallback = new HeuristicRecruiterService();

  constructor() {
    const config = getLlmRuntimeConfig();
    this.model = config.model || DEFAULT_LLM_MODEL;
    this.client = config.hasApiKey
      ? new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: config.baseUrl || DEFAULT_LLM_BASE_URL,
        })
      : null;
  }

  private async complete(system: string, user: string): Promise<string> {
    if (!this.client) {
      throw new AiError("OPENAI_API_KEY is not configured.");
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new AiError("Empty AI response.");
    }
    return content;
  }

  async extractResume(resumeText: string): Promise<ResumeExtraction> {
    if (!this.client) {
      return this.fallback.extractResume(resumeText);
    }

    try {
      return await withRetry(async () => {
        const content = await this.complete(
          `You are an expert technical recruiter resume parser.
Return ONLY valid JSON matching this shape:
{
  "name": string,
  "contact": { "email": string|null, "phone": string|null, "linkedin": string|null, "location": string|null },
  "experienceYears": number|null,
  "experience": [{ "title": string, "company": string, "startDate": string|null, "endDate": string|null, "highlights": string[] }],
  "skills": string[],
  "projects": [{ "name": string, "description": string, "technologies": string[] }],
  "education": [{ "degree": string, "institution": string, "year": string|null }],
  "certifications": string[]
}
If unknown, use null or empty arrays. Do not invent employers.`,
          `Resume text:\n\n${resumeText.slice(0, 14000)}`,
        );
        return resumeExtractionSchema.parse(extractJson(content));
      });
    } catch (error) {
      console.error("LLM request failed", error);
      return this.fallback.extractResume(resumeText);
    }
  }

  async evaluateCandidate(params: {
    jobDescription: string;
    resumeText: string;
    extraction: ResumeExtraction;
  }): Promise<CandidateEvaluation> {
    if (!this.client) {
      return this.fallback.evaluateCandidate(params);
    }

    try {
      return await withRetry(async () => {
        const content = await this.complete(
          `You are an AI Recruiter Copilot. Evaluate candidate fit for hiring decision support.
Return ONLY valid JSON with:
overallMatchScore, skillMatchScore, experienceMatchScore, educationMatchScore (0-100),
strengths, weaknesses, missingSkills, transferableSkills (string arrays),
employmentGapDetection { detected, gaps:[{from,to,months}], notes },
jobHopperDetection { detected, averageTenureMonths, notes },
recommendedInterviewQuestions (string[]),
hiringRecommendation ("strong_yes"|"yes"|"maybe"|"no"|"strong_no"),
executiveSummary (string),
reasoning { overall, skills, experience, education }.
Be strict, evidence-based, and useful for deciding who to interview.`,
          `Job Description:\n${params.jobDescription.slice(0, 8000)}\n\nStructured Extraction:\n${JSON.stringify(params.extraction)}\n\nResume Text:\n${params.resumeText.slice(0, 12000)}`,
        );
        return candidateEvaluationSchema.parse(extractJson(content));
      });
    } catch (error) {
      console.error("LLM request failed", error);
      return this.fallback.evaluateCandidate(params);
    }
  }
}
