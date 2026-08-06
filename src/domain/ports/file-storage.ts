export interface FileStorage {
  save(params: {
    userId: string;
    sessionId: string;
    filename: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<{ storagePath: string }>;
  read(storagePath: string): Promise<Buffer>;
}
