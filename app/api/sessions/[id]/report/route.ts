import { NotFoundError } from "@/src/domain/errors/app-error";
import { getContainer } from "@/src/infrastructure/di/container";
import { jsonError, requireUser } from "@/src/presentation/lib/api";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const container = getContainer();
    const session = await container.screeningRepository.getSession(user.id, id);
    if (!session) throw new NotFoundError("Screening session not found.");

    const candidates =
      await container.screeningRepository.listCandidatesBySession(user.id, id);

    const pdf = await container.reportGenerator.generateSessionReport({
      session,
      candidates,
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="screening-${id}.pdf"`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
