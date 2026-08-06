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
    const candidate = await container.screeningRepository.getCandidate(
      user.id,
      id,
    );
    if (!candidate) throw new NotFoundError("Candidate not found.");

    const session = await container.screeningRepository.getSession(
      user.id,
      candidate.sessionId,
    );
    if (!session) throw new NotFoundError("Screening session not found.");

    const pdf = await container.reportGenerator.generateCandidateReport({
      session,
      candidate,
    });

    const safeName = (candidate.extraction?.name ?? "candidate")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}-report.pdf"`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
