export interface FileStorage {
  save(params: {
    userId: string;
    sessionId: string;
    filename: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<{ storagePath: string }>;
  read(storagePath: string): Promise<Buffer>;
  remove(storagePath: string): Promise<void>;
  removeSessionDirectory(userId: string, sessionId: string): Promise<void>;
}
