import type { Candidate } from "@/src/domain/entities/screening";
import { NotFoundError, ValidationError } from "@/src/domain/errors/app-error";
import type { FileStorage } from "@/src/domain/ports/file-storage";
import type { ResumeParser } from "@/src/domain/ports/resume-parser";
import type { ScreeningRepository } from "@/src/domain/ports/screening-repository";

const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 5_242_880);

export type UploadFileInput = {
  filename: string;
  mimeType: string;
  buffer: Buffer;
};

export async function uploadResumes(params: {
  userId: string;
  sessionId: string;
  files: UploadFileInput[];
  repository: ScreeningRepository;
  fileStorage: FileStorage;
  resumeParser: ResumeParser;
}): Promise<Candidate[]> {
  if (!params.files.length) {
    throw new ValidationError("Upload at least one resume (PDF or DOCX).");
  }

  const session = await params.repository.getSession(
    params.userId,
    params.sessionId,
  );
  if (!session) {
    throw new NotFoundError("Screening session not found.");
  }

  const created: Candidate[] = [];
  const now = new Date().toISOString();

  for (const file of params.files) {
    if (file.buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new ValidationError(
        `${file.filename} exceeds the max upload size of ${MAX_UPLOAD_BYTES} bytes.`,
      );
    }

    if (!params.resumeParser.supports(file.mimeType, file.filename)) {
      throw new ValidationError(
        `${file.filename} is not a supported PDF/DOCX resume.`,
      );
    }

    const { storagePath } = await params.fileStorage.save({
      userId: params.userId,
      sessionId: params.sessionId,
      filename: file.filename,
      buffer: file.buffer,
      mimeType: file.mimeType,
    });

    const candidate: Candidate = {
      id: crypto.randomUUID(),
      sessionId: params.sessionId,
      userId: params.userId,
      sourceFilename: file.filename,
      storagePath,
      mimeType: file.mimeType,
      extractedText: null,
      extraction: null,
      evaluation: null,
      status: "uploaded",
      errorMessage: null,
      rank: null,
      createdAt: now,
      updatedAt: now,
    };

    created.push(candidate);
  }

  await params.repository.saveCandidates(created);
  await params.repository.saveSession({
    ...session,
    status: "uploaded",
    updatedAt: new Date().toISOString(),
  });

  return created;
}
