import { NotFoundError } from "@/src/domain/errors/app-error";
import { getContainer } from "@/src/infrastructure/di/container";
import { jsonError, jsonOk, requireUser } from "@/src/presentation/lib/api";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { screeningRepository } = getContainer();
    const candidate = await screeningRepository.getCandidate(user.id, id);
    if (!candidate) throw new NotFoundError("Candidate not found.");
    const session = await screeningRepository.getSession(
      user.id,
      candidate.sessionId,
    );
    return jsonOk({ candidate, session });
  } catch (error) {
    return jsonError(error);
  }
}
