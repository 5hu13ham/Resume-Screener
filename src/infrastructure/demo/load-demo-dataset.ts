import { promises as fs } from "fs";
import path from "path";

import {
  DEMO_JAVA_BACKEND_JD,
  DEMO_SESSION_TITLE,
} from "@/src/infrastructure/demo/job-description";
import { DEMO_RESUME_BLUEPRINTS } from "@/src/infrastructure/demo/resume-blueprints";

const DEMO_RESUMES_DIR = path.join(
  process.cwd(),
  "src",
  "infrastructure",
  "demo",
  "resumes",
);

export type DemoDatasetFile = {
  filename: string;
  mimeType: string;
  buffer: Buffer;
};

export async function loadDemoDataset(): Promise<{
  title: string;
  jobDescription: string;
  files: DemoDatasetFile[];
}> {
  const files: DemoDatasetFile[] = [];

  for (const blueprint of DEMO_RESUME_BLUEPRINTS) {
    const filePath = path.join(DEMO_RESUMES_DIR, blueprint.filename);
    const buffer = await fs.readFile(filePath);
    files.push({
      filename: blueprint.filename,
      mimeType: "application/pdf",
      buffer,
    });
  }

  if (!files.length) {
    throw new Error(
      "Demo resume assets are missing. Run: npm run fixtures:demo",
    );
  }

  return {
    title: DEMO_SESSION_TITLE,
    jobDescription: DEMO_JAVA_BACKEND_JD,
    files,
  };
}

export function getDemoResumesDirectory(): string {
  return DEMO_RESUMES_DIR;
}
