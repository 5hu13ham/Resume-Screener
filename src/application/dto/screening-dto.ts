import { z } from "zod";

export const createSessionSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  jobDescription: z.string().trim().min(40, "Job description is too short"),
});

export const scoreReasoningSchema = z.object({
  overall: z.string(),
  skills: z.string(),
  experience: z.string(),
  education: z.string(),
});

export const resumeExtractionSchema = z.object({
  name: z.string(),
  contact: z.object({
    email: z.string().nullable(),
    phone: z.string().nullable(),
    linkedin: z.string().nullable(),
    location: z.string().nullable(),
  }),
  experienceYears: z.number().nullable(),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      highlights: z.array(z.string()),
    }),
  ),
  skills: z.array(z.string()),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      year: z.string().nullable(),
    }),
  ),
  certifications: z.array(z.string()),
});

export const candidateEvaluationSchema = z.object({
  overallMatchScore: z.number().min(0).max(100),
  skillMatchScore: z.number().min(0).max(100),
  experienceMatchScore: z.number().min(0).max(100),
  educationMatchScore: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missingSkills: z.array(z.string()),
  transferableSkills: z.array(z.string()),
  employmentGapDetection: z.object({
    detected: z.boolean(),
    gaps: z.array(
      z.object({
        from: z.string(),
        to: z.string(),
        months: z.number(),
      }),
    ),
    notes: z.string(),
  }),
  jobHopperDetection: z.object({
    detected: z.boolean(),
    averageTenureMonths: z.number().nullable(),
    notes: z.string(),
  }),
  recommendedInterviewQuestions: z.array(z.string()),
  hiringRecommendation: z.enum([
    "strong_yes",
    "yes",
    "maybe",
    "no",
    "strong_no",
  ]),
  executiveSummary: z.string(),
  reasoning: scoreReasoningSchema,
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
