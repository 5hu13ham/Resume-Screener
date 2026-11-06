import { screenSession } from "@/src/application/use-cases/screen-session";
import { getContainer } from "@/src/infrastructure/di/container";
import { jsonError, jsonOk, requireUser } from "@/src/presentation/lib/api";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireUser({ realAccountOnly: true });
    const { id } = await params;
    const container = getContainer();
    const result = await screenSession({
      userId: user.id,
      sessionId: id,
      repository: container.screeningRepository,
      fileStorage: container.fileStorage,
      resumeParser: container.resumeParser,
      aiRecruiter: container.aiRecruiter,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
