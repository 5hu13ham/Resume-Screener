import { z } from "zod";

import { NotFoundError, ValidationError } from "@/src/domain/errors/app-error";
import type { ScreeningSession } from "@/src/domain/entities/screening";
import type { ScreeningRepository } from "@/src/domain/ports/screening-repository";

export const renameSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(120, "Title is too long"),
});

export async function renameScreeningSession(params: {
  userId: string;
  sessionId: string;
  title: string;
  repository: ScreeningRepository;
}): Promise<ScreeningSession> {
  const parsed = renameSessionSchema.parse({ title: params.title });
  const session = await params.repository.getSession(
    params.userId,
    params.sessionId,
  );
  if (!session) {
    throw new NotFoundError("We couldn't find that screening session.");
  }

  if (!parsed.title) {
    throw new ValidationError("Please enter a screening title.");
  }

  return params.repository.saveSession({
    ...session,
    title: parsed.title,
    updatedAt: new Date().toISOString(),
  });
}
