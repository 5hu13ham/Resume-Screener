import { uploadResumes } from "@/src/application/use-cases/upload-resumes";
import { screenSession } from "@/src/application/use-cases/screen-session";
import type { Candidate, ScreeningSession } from "@/src/domain/entities/screening";
import type { AiRecruiterService } from "@/src/domain/ports/ai-recruiter";
import type { FileStorage } from "@/src/domain/ports/file-storage";
import type { ResumeParser } from "@/src/domain/ports/resume-parser";
import type { ScreeningRepository } from "@/src/domain/ports/screening-repository";
import { DEMO_SESSION_TITLE } from "@/src/infrastructure/demo/job-description";
import { loadDemoDataset } from "@/src/infrastructure/demo/load-demo-dataset";

export type InstantDemoResult = {
  session: ScreeningSession;
  candidates: Candidate[];
  reusedExisting: boolean;
};

export async function runInstantDemo(params: {
  userId: string;
  repository: ScreeningRepository;
  fileStorage: FileStorage;
  resumeParser: ResumeParser;
  aiRecruiter: AiRecruiterService;
  forceRefresh?: boolean;
}): Promise<InstantDemoResult> {
  if (!params.forceRefresh) {
    const existing = (await params.repository.listSessions(params.userId)).find(
      (session) =>
        session.isDemo === true &&
        session.status === "completed" &&
        session.title === DEMO_SESSION_TITLE,
    );

    if (existing) {
      const candidates = await params.repository.listCandidatesBySession(
        params.userId,
        existing.id,
      );
      if (candidates.some((candidate) => candidate.evaluation)) {
        return {
          session: existing,
          candidates,
          reusedExisting: true,
        };
      }
    }
  }

  const dataset = await loadDemoDataset();
  const now = new Date().toISOString();

  const session = await params.repository.saveSession({
    id: crypto.randomUUID(),
    userId: params.userId,
    title: dataset.title,
    jobDescription: dataset.jobDescription,
    status: "draft",
    errorMessage: null,
    isDemo: true,
    createdAt: now,
    updatedAt: now,
  });

  await uploadResumes({
    userId: params.userId,
    sessionId: session.id,
    files: dataset.files,
    repository: params.repository,
    fileStorage: params.fileStorage,
    resumeParser: params.resumeParser,
  });

  const screened = await screenSession({
    userId: params.userId,
    sessionId: session.id,
    repository: params.repository,
    fileStorage: params.fileStorage,
    resumeParser: params.resumeParser,
    aiRecruiter: params.aiRecruiter,
  });

  return {
    session: screened.session,
    candidates: screened.candidates,
    reusedExisting: false,
  };
}
