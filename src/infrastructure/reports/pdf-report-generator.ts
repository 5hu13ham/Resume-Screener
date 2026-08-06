import PDFDocument from "pdfkit";

import type { Candidate, ScreeningSession } from "@/src/domain/entities/screening";
import type { ReportGenerator } from "@/src/domain/ports/report-generator";

function recommendationLabel(value: string | undefined): string {
  switch (value) {
    case "strong_yes":
      return "Strong Yes";
    case "yes":
      return "Yes";
    case "maybe":
      return "Maybe";
    case "no":
      return "No";
    case "strong_no":
      return "Strong No";
    default:
      return "Pending";
  }
}

async function renderPdf(
  build: (doc: PDFKit.PDFDocument) => void,
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50, size: "LETTER" });
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    build(doc);
    doc.end();
  });
}

export class PdfReportGenerator implements ReportGenerator {
  async generateSessionReport(params: {
    session: ScreeningSession;
    candidates: Candidate[];
  }): Promise<Buffer> {
    return renderPdf((doc) => {
      doc.fontSize(20).text("AI Resume Screening Report", { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Session: ${params.session.title}`);
      doc.text(`Generated: ${new Date().toLocaleString()}`);
      doc.text(`Candidates: ${params.candidates.length}`);
      doc.moveDown();
      doc.fontSize(14).text("Job Description");
      doc.fontSize(10).text(params.session.jobDescription, { align: "left" });
      doc.moveDown();
      doc.fontSize(14).text("Ranked Candidates");
      doc.moveDown(0.5);

      params.candidates.forEach((candidate, index) => {
        const name = candidate.extraction?.name ?? candidate.sourceFilename;
        const score = candidate.evaluation?.overallMatchScore ?? "—";
        const rec = recommendationLabel(candidate.evaluation?.hiringRecommendation);
        doc
          .fontSize(11)
          .text(
            `#${candidate.rank ?? index + 1}  ${name}  |  Score: ${score}  |  ${rec}`,
          );
        if (candidate.evaluation?.executiveSummary) {
          doc.fontSize(9).fillColor("#333").text(candidate.evaluation.executiveSummary);
          doc.fillColor("#000");
        }
        doc.moveDown(0.6);
      });
    });
  }

  async generateCandidateReport(params: {
    session: ScreeningSession;
    candidate: Candidate;
  }): Promise<Buffer> {
    const { candidate, session } = params;
    const evaluation = candidate.evaluation;
    const extraction = candidate.extraction;

    return renderPdf((doc) => {
      doc.fontSize(20).text("Candidate Screening Report", { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Candidate: ${extraction?.name ?? candidate.sourceFilename}`);
      doc.text(`Session: ${session.title}`);
      doc.text(`Rank: ${candidate.rank ?? "—"}`);
      doc.text(
        `Recommendation: ${recommendationLabel(evaluation?.hiringRecommendation)}`,
      );
      doc.moveDown();

      if (evaluation) {
        doc.fontSize(14).text("Scores");
        doc.fontSize(11).text(`Overall: ${evaluation.overallMatchScore}`);
        doc.text(`Skills: ${evaluation.skillMatchScore}`);
        doc.text(`Experience: ${evaluation.experienceMatchScore}`);
        doc.text(`Education: ${evaluation.educationMatchScore}`);
        doc.moveDown();
        doc.fontSize(14).text("Executive Summary");
        doc.fontSize(10).text(evaluation.executiveSummary);
        doc.moveDown();
        doc.fontSize(14).text("Strengths");
        evaluation.strengths.forEach((item) => doc.fontSize(10).text(`• ${item}`));
        doc.moveDown(0.5);
        doc.fontSize(14).text("Weaknesses");
        evaluation.weaknesses.forEach((item) => doc.fontSize(10).text(`• ${item}`));
        doc.moveDown(0.5);
        doc.fontSize(14).text("Missing Skills");
        doc.fontSize(10).text(evaluation.missingSkills.join(", ") || "None");
        doc.moveDown();
        doc.fontSize(14).text("Interview Questions");
        evaluation.recommendedInterviewQuestions.forEach((q, i) =>
          doc.fontSize(10).text(`${i + 1}. ${q}`),
        );
        doc.moveDown();
        doc.fontSize(14).text("Score Reasoning");
        doc.fontSize(10).text(`Overall: ${evaluation.reasoning.overall}`);
        doc.text(`Skills: ${evaluation.reasoning.skills}`);
        doc.text(`Experience: ${evaluation.reasoning.experience}`);
        doc.text(`Education: ${evaluation.reasoning.education}`);
      }

      if (extraction) {
        doc.addPage();
        doc.fontSize(14).text("Parsed Profile");
        doc.fontSize(10).text(`Email: ${extraction.contact.email ?? "—"}`);
        doc.text(`Phone: ${extraction.contact.phone ?? "—"}`);
        doc.text(`Skills: ${extraction.skills.join(", ")}`);
        doc.moveDown();
        doc.fontSize(12).text("Education");
        extraction.education.forEach((edu) =>
          doc.fontSize(10).text(`• ${edu.degree} — ${edu.institution}`),
        );
        doc.moveDown();
        doc.fontSize(12).text("Certifications");
        doc
          .fontSize(10)
          .text(extraction.certifications.join(", ") || "None listed");
      }
    });
  }
}
