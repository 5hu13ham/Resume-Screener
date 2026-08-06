import { extractText, getDocumentProxy } from "unpdf";

import type { ParsedResume, ResumeParser } from "@/src/domain/ports/resume-parser";

export class PdfResumeParser implements ResumeParser {
  supports(mimeType: string, filename: string): boolean {
    return (
      mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf")
    );
  }

  async parse(buffer: Buffer): Promise<ParsedResume> {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    return {
      text: text.trim(),
      pageCount: totalPages,
    };
  }
}
