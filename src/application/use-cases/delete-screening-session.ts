import { NotFoundError } from "@/src/domain/errors/app-error";
import type { FileStorage } from "@/src/domain/ports/file-storage";
import type { ScreeningRepository } from "@/src/domain/ports/screening-repository";

export async function deleteScreeningSession(params: {
  userId: string;
  sessionId: string;
  repository: ScreeningRepository;
  fileStorage: FileStorage;
}): Promise<{ deleted: true }> {
  const session = await params.repository.getSession(
    params.userId,
    params.sessionId,
  );
  if (!session) {
    throw new NotFoundError("We couldn't find that screening session.");
  }

  const candidates = await params.repository.listCandidatesBySession(
    params.userId,
    params.sessionId,
  );

  for (const candidate of candidates) {
    await params.fileStorage.remove(candidate.storagePath);
  }
  await params.fileStorage.removeSessionDirectory(
    params.userId,
    params.sessionId,
  );
  await params.repository.deleteSessions(params.userId, [params.sessionId]);

  return { deleted: true };
}
