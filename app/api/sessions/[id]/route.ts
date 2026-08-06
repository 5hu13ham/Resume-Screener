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
    const session = await screeningRepository.getSession(user.id, id);
    if (!session) throw new NotFoundError("Screening session not found.");
    const candidates = await screeningRepository.listCandidatesBySession(
      user.id,
      id,
    );
    return jsonOk({ session, candidates });
  } catch (error) {
    return jsonError(error);
  }
}
