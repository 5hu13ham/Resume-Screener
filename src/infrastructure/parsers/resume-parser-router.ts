import { ValidationError } from "@/src/domain/errors/app-error";
import type { ParsedResume, ResumeParser } from "@/src/domain/ports/resume-parser";

import { DocxResumeParser } from "@/src/infrastructure/parsers/docx-parser";
import { PdfResumeParser } from "@/src/infrastructure/parsers/pdf-parser";

export class ResumeParserRouter implements ResumeParser {
  private readonly parsers: ResumeParser[] = [
    new PdfResumeParser(),
    new DocxResumeParser(),
  ];

  supports(mimeType: string, filename: string): boolean {
    return this.parsers.some((parser) => parser.supports(mimeType, filename));
  }

  async parse(buffer: Buffer, filename: string): Promise<ParsedResume> {
    const mimeGuess = filename.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : filename.toLowerCase().endsWith(".docx")
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/octet-stream";

    const parser = this.parsers.find((item) =>
      item.supports(mimeGuess, filename),
    );

    if (!parser) {
      throw new ValidationError("Only PDF and DOCX resumes are supported.");
    }

    const parsed = await parser.parse(buffer, filename);
    if (!parsed.text || parsed.text.length < 40) {
      throw new ValidationError(
        `Could not extract enough text from ${filename}. Try a text-based PDF/DOCX.`,
      );
    }

    return parsed;
  }
}
