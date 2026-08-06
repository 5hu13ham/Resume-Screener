import type {
  CandidateEvaluation,
  ResumeExtraction,
} from "@/src/domain/entities/screening";

export interface AiRecruiterService {
  extractResume(resumeText: string): Promise<ResumeExtraction>;
  evaluateCandidate(params: {
    jobDescription: string;
    resumeText: string;
    extraction: ResumeExtraction;
  }): Promise<CandidateEvaluation>;
}
