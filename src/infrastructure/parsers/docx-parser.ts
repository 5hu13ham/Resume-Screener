import mammoth from "mammoth";

import type { ParsedResume, ResumeParser } from "@/src/domain/ports/resume-parser";

export class DocxResumeParser implements ResumeParser {
  supports(mimeType: string, filename: string): boolean {
    return (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      filename.toLowerCase().endsWith(".docx")
    );
  }

  async parse(buffer: Buffer): Promise<ParsedResume> {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value.trim(),
    };
  }
}
