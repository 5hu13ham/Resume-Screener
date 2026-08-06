import type { AiRecruiterService } from "@/src/domain/ports/ai-recruiter";
import type { FileStorage } from "@/src/domain/ports/file-storage";
import type { ReportGenerator } from "@/src/domain/ports/report-generator";
import type { ResumeParser } from "@/src/domain/ports/resume-parser";
import type { ScreeningRepository } from "@/src/domain/ports/screening-repository";

import { FileScreeningRepository } from "@/src/infrastructure/db/file-screening-repository";
import { OpenAiRecruiterService } from "@/src/infrastructure/llm/openai-recruiter";
import { ResumeParserRouter } from "@/src/infrastructure/parsers/resume-parser-router";
import { PdfReportGenerator } from "@/src/infrastructure/reports/pdf-report-generator";
import { LocalFileStorage } from "@/src/infrastructure/storage/local-file-storage";

export type AppContainer = {
  screeningRepository: ScreeningRepository;
  fileStorage: FileStorage;
  resumeParser: ResumeParser;
  aiRecruiter: AiRecruiterService;
  reportGenerator: ReportGenerator;
};

let container: AppContainer | null = null;

export function getContainer(): AppContainer {
  if (!container) {
    container = {
      screeningRepository: new FileScreeningRepository(),
      fileStorage: new LocalFileStorage(),
      resumeParser: new ResumeParserRouter(),
      aiRecruiter: new OpenAiRecruiterService(),
      reportGenerator: new PdfReportGenerator(),
    };
  }
  return container;
}
