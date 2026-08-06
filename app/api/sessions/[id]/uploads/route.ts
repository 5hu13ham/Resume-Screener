import { uploadResumes } from "@/src/application/use-cases/upload-resumes";
import { ValidationError } from "@/src/domain/errors/app-error";
import { getContainer } from "@/src/infrastructure/di/container";
import { jsonError, jsonOk, requireUser } from "@/src/presentation/lib/api";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const formData = await request.formData();
    const files = formData.getAll("files");

    const parsedFiles = await Promise.all(
      files.map(async (entry) => {
        if (!(entry instanceof File)) {
          throw new ValidationError("Invalid file upload payload.");
        }
        const buffer = Buffer.from(await entry.arrayBuffer());
        return {
          filename: entry.name,
          mimeType: entry.type || "application/octet-stream",
          buffer,
        };
      }),
    );

    const container = getContainer();
    const candidates = await uploadResumes({
      userId: user.id,
      sessionId: id,
      files: parsedFiles,
      repository: container.screeningRepository,
      fileStorage: container.fileStorage,
      resumeParser: container.resumeParser,
    });

    return jsonOk({ candidates }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
