import type { Candidate } from "@/src/domain/entities/screening";
import { NotFoundError, ValidationError } from "@/src/domain/errors/app-error";
import type { FileStorage } from "@/src/domain/ports/file-storage";
import type { ResumeParser } from "@/src/domain/ports/resume-parser";
import type { ScreeningRepository } from "@/src/domain/ports/screening-repository";

const MAX_UPLOAD_BYTES = Math.min(Math.max(Number(process.env.MAX_UPLOAD_BYTES) || 5_242_880, 1024), 10_485_760);
const MAX_UPLOAD_FILES = Math.min(Math.max(Number(process.env.MAX_UPLOAD_FILES) || 10, 1), 20);

export type UploadFileInput = {
  filename: string;
  mimeType: string;
  buffer: Buffer;
};

function validateFile(file: UploadFileInput): void {
  if (!file.buffer.length || file.buffer.length > MAX_UPLOAD_BYTES) {
    throw new ValidationError(file.filename + " is empty or exceeds the upload size limit.");
  }
  const extension = file.filename.toLowerCase().split(".").pop();
  const pdf = extension === "pdf" && file.buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  const docx = extension === "docx" && file.buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  if (!pdf && !docx) {
    throw new ValidationError("Only genuine PDF or DOCX files are accepted.");
  }
  if (pdf && !["application/pdf", "application/octet-stream", ""].includes(file.mimeType)) {
    throw new ValidationError("Mismatched PDF content type.");
  }
  if (docx && ![
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream", "",
  ].includes(file.mimeType)) {
    throw new ValidationError("Mismatched DOCX content type.");
  }
}

export async function uploadResumes(params: {
  userId: string;
  sessionId: string;
  files: UploadFileInput[];
  repository: ScreeningRepository;
  fileStorage: FileStorage;
  resumeParser: ResumeParser;
}): Promise<Candidate[]> {
  if (!params.files.length || params.files.length > MAX_UPLOAD_FILES) {
    throw new ValidationError("Upload between 1 and " + MAX_UPLOAD_FILES + " resumes.");
  }
  // Validate all files BEFORE persisting any file or candidate.
  for (const file of params.files) {
    validateFile(file);
    if (!params.resumeParser.supports(file.mimeType, file.filename)) {
      throw new ValidationError("Unsupported resume type.");
    }
  }

  const session = await params.repository.getSession(params.userId, params.sessionId);
  if (!session) throw new NotFoundError("Screening session not found.");
  if (session.status === "processing") {
    throw new ValidationError("Cannot upload while screening is in progress.");
  }

  const existing = await params.repository.listCandidatesBySession(params.userId, params.sessionId);
  if (existing.length + params.files.length > MAX_UPLOAD_FILES) {
    throw new ValidationError("This screening has reached its maximum candidate count.");
  }

  const created: Candidate[] = [];
  const storedPaths: string[] = [];
  const now = new Date().toISOString();
  try {
    for (const file of params.files) {
      const { storagePath } = await params.fileStorage.save({
        userId: params.userId, sessionId: params.sessionId,
        filename: file.filename, buffer: file.buffer, mimeType: file.mimeType,
      });
      storedPaths.push(storagePath);
      created.push({
        id: crypto.randomUUID(),
        sessionId: params.sessionId,
        userId: params.userId,
        sourceFilename: file.filename,
        storagePath, mimeType: file.mimeType,
        extractedText: null, extraction: null, evaluation: null,
        status: "uploaded", errorMessage: null, rank: null,
        createdAt: now, updatedAt: now,
      });
    }

    await params.repository.saveCandidates(created);
    await params.repository.saveSession({
      ...session, status: "uploaded", updatedAt: new Date().toISOString(),
    });
    return created;
  } catch (error) {
    await Promise.allSettled(storedPaths.map((file) => params.fileStorage.remove(file)));
    throw error;
  }
}
