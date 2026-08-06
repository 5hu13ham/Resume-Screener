import { deleteScreeningSession } from "@/src/application/use-cases/delete-screening-session";
import { renameScreeningSession } from "@/src/application/use-cases/rename-screening-session";
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
    if (!session) throw new NotFoundError("We couldn't find that screening session.");
    const candidates = await screeningRepository.listCandidatesBySession(
      user.id,
      id,
    );
    return jsonOk({ session, candidates });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = (await request.json()) as { title?: string };
    const container = getContainer();
    const session = await renameScreeningSession({
      userId: user.id,
      sessionId: id,
      title: body.title ?? "",
      repository: container.screeningRepository,
    });
    return jsonOk({ session });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const container = getContainer();
    const result = await deleteScreeningSession({
      userId: user.id,
      sessionId: id,
      repository: container.screeningRepository,
      fileStorage: container.fileStorage,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
