import { getContainer } from "@/src/infrastructure/di/container";
import { jsonError, jsonOk, requireUser } from "@/src/presentation/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const { screeningRepository } = getContainer();
    const candidates = await screeningRepository.listCandidates(user.id);
    return jsonOk({ candidates });
  } catch (error) {
    return jsonError(error);
  }
}
