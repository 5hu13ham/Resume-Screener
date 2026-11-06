import { promises as fs } from "fs";
import path from "path";
import type { FileStorage } from "@/src/domain/ports/file-storage";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");
function sanitizeFilename(filename: string): string {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}
function insideRoot(target: string): string {
  const absolute = path.resolve(target);
  const relative = path.relative(UPLOAD_ROOT, absolute);
  if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) {
    throw new Error("Invalid local storage path");
  }
  return absolute;
}
function safePart(input: string): string {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(input)) throw new Error("Invalid storage identifier");
  return input;
}

export class LocalFileStorage implements FileStorage {
  async save(params: {
    userId: string; sessionId: string; filename: string;
    buffer: Buffer; mimeType: string;
  }): Promise<{ storagePath: string }> {
    const dir = insideRoot(path.join(UPLOAD_ROOT, safePart(params.userId), safePart(params.sessionId)));
    await fs.mkdir(dir, { recursive: true });
    const filename = crypto.randomUUID() + "-" + sanitizeFilename(params.filename);
    const storagePath = insideRoot(path.join(dir, filename));
    await fs.writeFile(storagePath, params.buffer, { flag: "wx" });
    return { storagePath };
  }
  async read(storagePath: string): Promise<Buffer> {
    return fs.readFile(insideRoot(storagePath));
  }
  async remove(storagePath: string): Promise<void> {
    try { await fs.unlink(insideRoot(storagePath)); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  async removeSessionDirectory(userId: string, sessionId: string): Promise<void> {
    const dir = insideRoot(path.join(UPLOAD_ROOT, safePart(userId), safePart(sessionId)));
    await fs.rm(dir, { recursive: true, force: true });
  }
}
