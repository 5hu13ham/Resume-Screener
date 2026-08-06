import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "fixtures");
mkdirSync(outDir, { recursive: true });

async function writeResume(filename, lines) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let y = 740;
  for (const line of lines) {
    page.drawText(line, {
      x: 50,
      y,
      size: 11,
      font,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: 500,
    });
    y -= 16;
  }
  const bytes = await pdf.save();
  writeFileSync(path.join(outDir, filename), bytes);
}

await writeResume("alice-frontend.pdf", [
  "Alice Nguyen",
  "alice.nguyen@email.com | +1 555 010 2211 | linkedin.com/in/alicenguyen",
  "Frontend Engineer with 6 years experience",
  "Skills: TypeScript, React, Next.js, Tailwind, GraphQL, Git, Agile",
  "Experience",
  "- Built design systems and dashboards in React/Next.js",
  "- Improved Core Web Vitals and accessibility across product surfaces",
  "Education",
  "Bachelor of Computer Science — State University (2018)",
  "Projects",
  "- Hiring Portal: React + TypeScript candidate workspace",
  "Certifications: AWS Cloud Practitioner",
]);

await writeResume("bob-backend.pdf", [
  "Bob Martinez",
  "bob.martinez@email.com | +1 555 014 8899",
  "Backend Engineer with 4 years experience",
  "Skills: Node.js, PostgreSQL, Docker, AWS, REST, Python, CI/CD",
  "Experience",
  "- Designed APIs and data models for recruiting platforms",
  "- Owned on-call rotations and production incident response",
  "Education",
  "Bachelor of Software Engineering — Tech College (2020)",
]);

console.log("Sample resumes written to fixtures/");
