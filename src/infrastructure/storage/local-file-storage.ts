import { promises as fs } from "fs";
import path from "path";

import type { FileStorage } from "@/src/domain/ports/file-storage";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export class LocalFileStorage implements FileStorage {
  async save(params: {
    userId: string;
    sessionId: string;
    filename: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<{ storagePath: string }> {
    const dir = path.join(UPLOAD_ROOT, params.userId, params.sessionId);
    await fs.mkdir(dir, { recursive: true });
    const safeName = `${Date.now()}-${sanitizeFilename(params.filename)}`;
    const storagePath = path.join(dir, safeName);
    await fs.writeFile(storagePath, params.buffer);
    return { storagePath };
  }

  async read(storagePath: string): Promise<Buffer> {
    return fs.readFile(storagePath);
  }

  async remove(storagePath: string): Promise<void> {
    try {
      await fs.unlink(storagePath);
    } catch {
      // Missing file is fine during demo reset.
    }
  }

  async removeSessionDirectory(userId: string, sessionId: string): Promise<void> {
    const dir = path.join(UPLOAD_ROOT, userId, sessionId);
    await fs.rm(dir, { recursive: true, force: true });
  }
}
