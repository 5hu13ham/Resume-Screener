import type { Candidate, ScreeningSession } from "@/src/domain/entities/screening";
import { NotFoundError } from "@/src/domain/errors/app-error";
import type { AiRecruiterService } from "@/src/domain/ports/ai-recruiter";
import type { FileStorage } from "@/src/domain/ports/file-storage";
import type { ResumeParser } from "@/src/domain/ports/resume-parser";
import type { ScreeningRepository } from "@/src/domain/ports/screening-repository";

async function processCandidate(params: {
  candidate: Candidate;
  session: ScreeningSession;
  fileStorage: FileStorage;
  resumeParser: ResumeParser;
  aiRecruiter: AiRecruiterService;
  repository: ScreeningRepository;
}): Promise<Candidate> {
  let candidate: Candidate = {
    ...params.candidate,
    status: "parsing",
    errorMessage: null,
    updatedAt: new Date().toISOString(),
  };
  await params.repository.saveCandidate(candidate);

  try {
    const buffer = await params.fileStorage.read(candidate.storagePath);
    const parsed = await params.resumeParser.parse(
      buffer,
      candidate.sourceFilename,
    );

    candidate = {
      ...candidate,
      extractedText: parsed.text,
      status: "extracting",
      updatedAt: new Date().toISOString(),
    };
    await params.repository.saveCandidate(candidate);

    const extraction = await params.aiRecruiter.extractResume(parsed.text);
    candidate = {
      ...candidate,
      extraction,
      status: "evaluating",
      updatedAt: new Date().toISOString(),
    };
    await params.repository.saveCandidate(candidate);

    const evaluation = await params.aiRecruiter.evaluateCandidate({
      jobDescription: params.session.jobDescription,
      resumeText: parsed.text,
      extraction,
    });

    candidate = {
      ...candidate,
      evaluation,
      status: "ready",
      errorMessage: null,
      updatedAt: new Date().toISOString(),
    };
    await params.repository.saveCandidate(candidate);
    return candidate;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process candidate.";
    candidate = {
      ...candidate,
      status: "failed",
      errorMessage: message,
      updatedAt: new Date().toISOString(),
    };
    await params.repository.saveCandidate(candidate);
    return candidate;
  }
}

function rankCandidates(candidates: Candidate[]): Candidate[] {
  const ready = candidates
    .filter((c) => c.evaluation)
    .sort(
      (a, b) =>
        (b.evaluation?.overallMatchScore ?? 0) -
        (a.evaluation?.overallMatchScore ?? 0),
    )
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
      updatedAt: new Date().toISOString(),
    }));

  const others = candidates
    .filter((c) => !c.evaluation)
    .map((candidate) => ({
      ...candidate,
      rank: null,
      updatedAt: new Date().toISOString(),
    }));

  return [...ready, ...others];
}

export async function screenSession(params: {
  userId: string;
  sessionId: string;
  repository: ScreeningRepository;
  fileStorage: FileStorage;
  resumeParser: ResumeParser;
  aiRecruiter: AiRecruiterService;
}): Promise<{ session: ScreeningSession; candidates: Candidate[] }> {
  const session = await params.repository.getSession(
    params.userId,
    params.sessionId,
  );
  if (!session) {
    throw new NotFoundError("Screening session not found.");
  }

  const existing = await params.repository.listCandidatesBySession(
    params.userId,
    params.sessionId,
  );
  if (!existing.length) {
    throw new NotFoundError("Upload resumes before running screening.");
  }

  await params.repository.saveSession({
    ...session,
    status: "processing",
    errorMessage: null,
    updatedAt: new Date().toISOString(),
  });

  const processed: Candidate[] = [];
  for (const candidate of existing) {
    processed.push(
      await processCandidate({
        candidate,
        session,
        fileStorage: params.fileStorage,
        resumeParser: params.resumeParser,
        aiRecruiter: params.aiRecruiter,
        repository: params.repository,
      }),
    );
  }

  const ranked = rankCandidates(processed);
  await params.repository.saveCandidates(ranked);

  const failedCount = ranked.filter((c) => c.status === "failed").length;
  const updatedSession = await params.repository.saveSession({
    ...session,
    status: failedCount === ranked.length ? "failed" : "completed",
    errorMessage:
      failedCount > 0
        ? `${failedCount} candidate(s) failed during AI screening.`
        : null,
    updatedAt: new Date().toISOString(),
  });

  return { session: updatedSession, candidates: ranked };
}

export async function retryCandidateScreening(params: {
  userId: string;
  candidateId: string;
  repository: ScreeningRepository;
  fileStorage: FileStorage;
  resumeParser: ResumeParser;
  aiRecruiter: AiRecruiterService;
}): Promise<Candidate> {
  const candidate = await params.repository.getCandidate(
    params.userId,
    params.candidateId,
  );
  if (!candidate) {
    throw new NotFoundError("Candidate not found.");
  }

  const session = await params.repository.getSession(
    params.userId,
    candidate.sessionId,
  );
  if (!session) {
    throw new NotFoundError("Screening session not found.");
  }

  const processed = await processCandidate({
    candidate,
    session,
    fileStorage: params.fileStorage,
    resumeParser: params.resumeParser,
    aiRecruiter: params.aiRecruiter,
    repository: params.repository,
  });

  const all = await params.repository.listCandidatesBySession(
    params.userId,
    session.id,
  );
  const merged = all.map((item) =>
    item.id === processed.id ? processed : item,
  );
  const ranked = rankCandidates(merged);
  await params.repository.saveCandidates(ranked);

  return ranked.find((item) => item.id === processed.id) ?? processed;
}
