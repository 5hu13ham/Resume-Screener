import type { Candidate, ScreeningSession } from "@/src/domain/entities/screening";

export interface ReportGenerator {
  generateSessionReport(params: {
    session: ScreeningSession;
    candidates: Candidate[];
  }): Promise<Buffer>;
  generateCandidateReport(params: {
    session: ScreeningSession;
    candidate: Candidate;
  }): Promise<Buffer>;
}
