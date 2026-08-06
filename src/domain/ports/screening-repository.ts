import type { Candidate, ScreeningSession } from "@/src/domain/entities/screening";

export interface ScreeningRepository {
  listSessions(userId: string): Promise<ScreeningSession[]>;
  getSession(userId: string, sessionId: string): Promise<ScreeningSession | null>;
  saveSession(session: ScreeningSession): Promise<ScreeningSession>;
  listCandidatesBySession(userId: string, sessionId: string): Promise<Candidate[]>;
  listCandidates(userId: string): Promise<Candidate[]>;
  getCandidate(userId: string, candidateId: string): Promise<Candidate | null>;
  saveCandidate(candidate: Candidate): Promise<Candidate>;
  saveCandidates(candidates: Candidate[]): Promise<Candidate[]>;
}
