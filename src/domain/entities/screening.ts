export type SessionStatus =
  | "draft"
  | "uploaded"
  | "processing"
  | "completed"
  | "failed";

export type CandidateStatus =
  | "uploaded"
  | "parsing"
  | "extracting"
  | "evaluating"
  | "ready"
  | "failed";

export type HiringRecommendation =
  | "strong_yes"
  | "yes"
  | "maybe"
  | "no"
  | "strong_no";

export type RecruiterDecisionRecommendation =
  | "Strong Interview"
  | "Interview"
  | "Maybe"
  | "Reject";

export type RecruiterDecisionConfidence = "High" | "Medium" | "Low";

export type RecruiterDecision = {
  recommendation: RecruiterDecisionRecommendation;
  confidence: RecruiterDecisionConfidence;
  strengths: string[];
  gaps: string[];
  interviewFocus: string[];
};

export type ScoreReasoning = {
  overall: string;
  skills: string;
  experience: string;
  education: string;
};

export type ResumeExtraction = {
  name: string;
  contact: {
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    location: string | null;
  };
  experienceYears: number | null;
  experience: Array<{
    title: string;
    company: string;
    startDate: string | null;
    endDate: string | null;
    highlights: string[];
  }>;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string | null;
  }>;
  certifications: string[];
};

export type CandidateEvaluation = {
  overallMatchScore: number;
  skillMatchScore: number;
  experienceMatchScore: number;
  educationMatchScore: number;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  transferableSkills: string[];
  employmentGapDetection: {
    detected: boolean;
    gaps: Array<{ from: string; to: string; months: number }>;
    notes: string;
  };
  jobHopperDetection: {
    detected: boolean;
    averageTenureMonths: number | null;
    notes: string;
  };
  recommendedInterviewQuestions: string[];
  hiringRecommendation: HiringRecommendation;
  executiveSummary: string;
  reasoning: ScoreReasoning;
  /** Concise recruiter-facing decision card; optional on legacy stored rows. */
  recruiterDecision?: RecruiterDecision;
};

export type ScreeningSession = {
  id: string;
  userId: string;
  title: string;
  jobDescription: string;
  status: SessionStatus;
  errorMessage: string | null;
  /** Sample Instant Demo session; never delete non-demo user data on reset. */
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Candidate = {
  id: string;
  sessionId: string;
  userId: string;
  sourceFilename: string;
  storagePath: string;
  mimeType: string;
  extractedText: string | null;
  extraction: ResumeExtraction | null;
  evaluation: CandidateEvaluation | null;
  status: CandidateStatus;
  errorMessage: string | null;
  rank: number | null;
  createdAt: string;
  updatedAt: string;
};
