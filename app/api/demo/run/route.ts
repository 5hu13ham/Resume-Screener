import { runInstantDemo } from "@/src/application/use-cases/run-instant-demo";
import { getContainer } from "@/src/infrastructure/di/container";
import { jsonError, jsonOk, requireUser } from "@/src/presentation/lib/api";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => ({}))) as {
      forceRefresh?: boolean;
    };
    const container = getContainer();
    const result = await runInstantDemo({
      userId: user.id,
      repository: container.screeningRepository,
      fileStorage: container.fileStorage,
      resumeParser: container.resumeParser,
      aiRecruiter: container.aiRecruiter,
      forceRefresh: Boolean(body.forceRefresh),
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
