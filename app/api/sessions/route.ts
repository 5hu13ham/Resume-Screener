import { createScreeningSession } from "@/src/application/use-cases/create-screening-session";
import { getContainer } from "@/src/infrastructure/di/container";
import { jsonError, jsonOk, requireUser } from "@/src/presentation/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const { screeningRepository } = getContainer();
    const sessions = await screeningRepository.listSessions(user.id);
    return jsonOk({ sessions });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { screeningRepository } = getContainer();
    const session = await createScreeningSession({
      userId: user.id,
      input: body,
      repository: screeningRepository,
    });
    return jsonOk({ session }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
