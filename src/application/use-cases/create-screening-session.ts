import { createSessionSchema } from "@/src/application/dto/screening-dto";
import type { ScreeningSession } from "@/src/domain/entities/screening";
import type { ScreeningRepository } from "@/src/domain/ports/screening-repository";

function titleFromJd(jobDescription: string): string {
  const firstLine =
    jobDescription
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? "Untitled Screening";
  return firstLine.slice(0, 80);
}

export async function createScreeningSession(params: {
  userId: string;
  input: unknown;
  repository: ScreeningRepository;
}): Promise<ScreeningSession> {
  const parsed = createSessionSchema.parse(params.input);
  const now = new Date().toISOString();

  const session: ScreeningSession = {
    id: crypto.randomUUID(),
    userId: params.userId,
    title: parsed.title?.trim() || titleFromJd(parsed.jobDescription),
    jobDescription: parsed.jobDescription.trim(),
    status: "draft",
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };

  return params.repository.saveSession(session);
}
