import type { FileStorage } from "@/src/domain/ports/file-storage";
import type { ScreeningRepository } from "@/src/domain/ports/screening-repository";

export type ResetDemoResult = {
  deletedSessionCount: number;
};

/**
 * Removes only Instant Demo sessions/files for the user.
 * Never deletes non-demo user-created screenings.
 */
export async function resetDemo(params: {
  userId: string;
  repository: ScreeningRepository;
  fileStorage: FileStorage;
}): Promise<ResetDemoResult> {
  const demoSessions = (await params.repository.listSessions(params.userId)).filter(
    (session) => session.isDemo === true,
  );

  for (const session of demoSessions) {
    const candidates = await params.repository.listCandidatesBySession(
      params.userId,
      session.id,
    );
    for (const candidate of candidates) {
      await params.fileStorage.remove(candidate.storagePath);
    }
    await params.fileStorage.removeSessionDirectory(params.userId, session.id);
  }

  await params.repository.deleteSessions(
    params.userId,
    demoSessions.map((session) => session.id),
  );

  return { deletedSessionCount: demoSessions.length };
}
