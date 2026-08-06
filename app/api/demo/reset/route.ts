import { resetDemo } from "@/src/application/use-cases/reset-demo";
import { getContainer } from "@/src/infrastructure/di/container";
import { jsonError, jsonOk, requireUser } from "@/src/presentation/lib/api";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireUser();
    const container = getContainer();
    const result = await resetDemo({
      userId: user.id,
      repository: container.screeningRepository,
      fileStorage: container.fileStorage,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
