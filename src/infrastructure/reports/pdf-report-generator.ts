import PDFDocument from "pdfkit";

import { ensureRecruiterDecision } from "@/src/application/dto/recruiter-decision";
import type { Candidate, ScreeningSession } from "@/src/domain/entities/screening";
import type { ReportGenerator } from "@/src/domain/ports/report-generator";

function recommendationLabel(value: string | undefined): string {
  switch (value) {
    case "strong_yes":
      return "High alignment";
    case "yes":
      return "Good alignment";
    case "maybe":
      return "Maybe";
    case "no":
      return "Needs human review";
    case "strong_no":
      return "Needs human review";
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

function writeRecruiterDecision(
  doc: PDFKit.PDFDocument,
  evaluation: NonNullable<Candidate["evaluation"]>,
) {
  const decision = ensureRecruiterDecision(evaluation);
  doc.fontSize(14).text("Recruiter Decision");
  doc
    .fontSize(10)
    .text(`${decision.recommendation === "Reject" ? "Needs human review" : decision.recommendation}  |  Indicative confidence: ${decision.confidence}`);
  doc.moveDown(0.3);
  doc.fontSize(10).text("Strengths:");
  decision.strengths.forEach((item) => doc.text(`✓ ${item}`));
  doc.moveDown(0.2);
  doc.text("Gaps:");
  if (decision.gaps.length) {
    decision.gaps.forEach((item) => doc.text(`⚠ ${item}`));
  } else {
    doc.text("None material");
  }
  doc.moveDown(0.2);
  doc.text("Interview Focus:");
  decision.interviewFocus.forEach((item) => doc.text(`• ${item}`));
  doc.moveDown();
}

export class PdfReportGenerator implements ReportGenerator {
  async generateSessionReport(params: {
    session: ScreeningSession;
    candidates: Candidate[];
  }): Promise<Buffer> {
    return renderPdf((doc) => {
      doc.fontSize(20).text("AI Resume Screening Report", { underline: true });
      doc.fontSize(9).text("Human review required. Uncalibrated indicators, not automated hiring decisions.");
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
        const decision = candidate.evaluation
          ? ensureRecruiterDecision(candidate.evaluation)
          : null;
        const rec =
          decision?.recommendation ??
          recommendationLabel(candidate.evaluation?.hiringRecommendation);
        doc
          .fontSize(11)
          .text(
            `#${candidate.rank ?? index + 1}  ${name}  |  Score: ${score}  |  ${rec}${
              decision ? `  |  Confidence: ${decision.confidence}` : ""
            }`,
          );
        if (decision?.interviewFocus.length) {
          doc
            .fontSize(9)
            .fillColor("#333")
            .text(`Interview focus: ${decision.interviewFocus.join(", ")}`);
          doc.fillColor("#000");
        } else if (candidate.evaluation?.executiveSummary) {
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
      doc.fontSize(9).text("For interview preparation only. Not a hiring decision.");
      doc.moveDown();
      doc.fontSize(12).text(`Candidate: ${extraction?.name ?? candidate.sourceFilename}`);
      doc.text(`Session: ${session.title}`);
      doc.text(`Rank: ${candidate.rank ?? "—"}`);
      doc.text(
        `Recommendation: ${recommendationLabel(evaluation?.hiringRecommendation)}`,
      );
      doc.moveDown();

      if (evaluation) {
        writeRecruiterDecision(doc, evaluation);
        doc.fontSize(9).text(`Evaluation: ${evaluation.provenance?.engine ?? "unrecorded"} / ${evaluation.provenance?.model ?? "legacy"}, rubric ${evaluation.provenance?.rubricVersion ?? "unknown"}`);
        doc.moveDown(0.4);
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
