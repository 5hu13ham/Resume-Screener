import { retryCandidateScreening } from "@/src/application/use-cases/screen-session";
import { getContainer } from "@/src/infrastructure/di/container";
import { jsonError, jsonOk, requireUser } from "@/src/presentation/lib/api";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const container = getContainer();
    const candidate = await retryCandidateScreening({
      userId: user.id,
      candidateId: id,
      repository: container.screeningRepository,
      fileStorage: container.fileStorage,
      resumeParser: container.resumeParser,
      aiRecruiter: container.aiRecruiter,
    });
    return jsonOk({ candidate });
  } catch (error) {
    return jsonError(error);
  }
}
