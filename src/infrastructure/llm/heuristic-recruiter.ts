import type {
  CandidateEvaluation,
  HiringRecommendation,
  ResumeExtraction,
} from "@/src/domain/entities/screening";
import type { AiRecruiterService } from "@/src/domain/ports/ai-recruiter";
import { buildHeuristicRecruiterDecision } from "@/src/application/dto/recruiter-decision";

const COMMON_SKILLS = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node",
  "node.js",
  "python",
  "java",
  "spring boot",
  "kafka",
  "microservices",
  "hibernate",
  "mysql",
  "redis",
  "sql",
  "postgresql",
  "mongodb",
  "aws",
  "azure",
  "docker",
  "kubernetes",
  "graphql",
  "rest",
  "tailwind",
  "git",
  "ci/cd",
  "agile",
  "leadership",
  "communication",
  "figma",
  "html",
  "css",
  "go",
  "rust",
  "c#",
  "devops",
  "machine learning",
  "openai",
  "supabase",
];

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function unique(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function extractEmail(text: string): string | null {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
}

function extractPhone(text: string): string | null {
  return text.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? null;
}

function extractLinkedIn(text: string): string | null {
  return text.match(/linkedin\.com\/in\/[A-Za-z0-9_-]+/i)?.[0] ?? null;
}

function extractName(text: string): string {
  const firstLine =
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 2 && line.length < 60 && !line.includes("@")) ??
    "Unknown Candidate";
  return firstLine.replace(/[^a-zA-Z\s.'-]/g, "").trim() || "Unknown Candidate";
}

function containsSkill(text: string, skill: string): boolean {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  return COMMON_SKILLS.filter((skill) => lower.includes(skill.toLowerCase()));
}");
  const regex = new RegExp("(^|[^a-z0-9])" + escaped + "(?=$|[^a-z0-9])", "i");
  return regex.test(text);
}
function extractSkills(text: string): string[] {
  return COMMON_SKILLS.filter((skill) => containsSkill(text, skill));
}

function extractYears(text: string): number | null {
  const match = text.match(/(\d{1,2})\+?\s*(?:years|yrs)/i);
  return match ? Number(match[1]) : null;
}

function tokenize(text: string): string[] {
  return unique(
    text
      .toLowerCase()
      .split(/[^a-z0-9+.#/]+/)
      .filter((token) => token.length > 2),
  );
}

function recommendationFromScore(score: number): HiringRecommendation {
  if (score >= 85) return "strong_yes";
  if (score >= 70) return "yes";
  if (score >= 55) return "maybe";
  if (score >= 40) return "no";
  return "strong_no";
}

export class HeuristicRecruiterService implements AiRecruiterService {
  async extractResume(resumeText: string): Promise<ResumeExtraction> {
    const skills = extractSkills(resumeText);
    const years = extractYears(resumeText);

    return {
      provenance: { engine: "heuristic", model: "keyword-v1" },
      name: extractName(resumeText),
      contact: {
        email: extractEmail(resumeText),
        phone: extractPhone(resumeText),
        linkedin: extractLinkedIn(resumeText),
        location: null,
      },
      experienceYears: years,
      experience: [
        {
          title: "Professional Experience",
          company: "See resume",
          startDate: null,
          endDate: null,
          highlights: resumeText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.startsWith("•") || line.startsWith("-"))
            .slice(0, 5)
            .map((line) => line.replace(/^[-•]\s*/, "")),
        },
      ],
      skills,
      projects: [],
      education: resumeText.toLowerCase().includes("bachelor")
        ? [
            {
              degree: "Bachelor's Degree",
              institution: "See resume",
              year: null,
            },
          ]
        : [],
      certifications: resumeText.toLowerCase().includes("certified")
        ? ["Certification mentioned in resume"]
        : [],
    };
  }

  async evaluateCandidate(params: {
    jobDescription: string;
    resumeText: string;
    extraction: ResumeExtraction;
  }): Promise<CandidateEvaluation> {
    const jdTokens = tokenize(params.jobDescription);
    const resumeTokens = new Set(tokenize(params.resumeText));
    const jdSkills = COMMON_SKILLS.filter((skill) =>
      containsSkill(params.jobDescription, skill),
    );
    const resumeSkills = new Set(
      params.extraction.skills.map((skill) => skill.toLowerCase()),
    );

    const matchedSkills = jdSkills.filter((skill) =>
      resumeSkills.has(skill.toLowerCase()),
    );
    const missingSkills = jdSkills.filter(
      (skill) => !resumeSkills.has(skill.toLowerCase()),
    );

    const overlap =
      jdTokens.length === 0
        ? 0
        : (jdTokens.filter((token) => resumeTokens.has(token)).length /
            jdTokens.length) *
          100;

    const skillMatchScore = clamp(
      jdSkills.length === 0
        ? overlap
        : (matchedSkills.length / Math.max(jdSkills.length, 1)) * 100,
    );
    const experienceMatchScore = clamp(
      (params.extraction.experienceYears ?? 2) >= 3
        ? 70 + Math.min(20, (params.extraction.experienceYears ?? 0) * 2)
        : 45 + (params.extraction.experienceYears ?? 0) * 5,
    );
    const educationMatchScore = clamp(
      params.extraction.education.length > 0 ? 75 : 50,
    );
    const overallMatchScore = clamp(
      skillMatchScore * 0.45 +
        experienceMatchScore * 0.3 +
        educationMatchScore * 0.1 +
        overlap * 0.15,
    );

    const transferableSkills = params.extraction.skills
      .filter((skill) => !jdSkills.includes(skill.toLowerCase()))
      .slice(0, 5);

    const recruiterDecision = buildHeuristicRecruiterDecision({
      overallMatchScore,
      skillMatchScore,
      experienceMatchScore,
      educationMatchScore,
      matchedSkills,
      missingSkills: missingSkills.slice(0, 8),
      extraction: params.extraction,
    });

    return {
      provenance: {
        engine: "heuristic",
        model: "keyword-v1",
        extractionEngine: params.extraction.provenance?.engine,
        rubricVersion: "portfolio-v1",
        generatedAt: new Date().toISOString(),
      },
      overallMatchScore,
      skillMatchScore,
      experienceMatchScore,
      educationMatchScore,
      strengths: [
        ...(matchedSkills.length
          ? [`Matched key skills: ${matchedSkills.join(", ")}`]
          : ["Shows relevant professional background"]),
        ...(params.extraction.experienceYears
          ? [`About ${params.extraction.experienceYears} years of experience`]
          : []),
      ].slice(0, 5),
      weaknesses: [
        ...(missingSkills.length
          ? [`Missing role skills: ${missingSkills.slice(0, 5).join(", ")}`]
          : ["Limited evidence of niche domain depth"]),
      ],
      missingSkills: missingSkills.slice(0, 8),
      transferableSkills,
      employmentGapDetection: {
        detected: false,
        gaps: [],
        notes: "No clear multi-month employment gaps detected from available dates.",
      },
      jobHopperDetection: {
        detected: false,
        averageTenureMonths: null,
        notes: "Insufficient dated role history to confirm job hopping.",
      },
      recommendedInterviewQuestions: [
        "Walk me through a project most similar to this role's responsibilities.",
        missingSkills[0]
          ? `How have you approached learning or compensating for ${missingSkills[0]}?`
          : "Which recent accomplishment best demonstrates impact in this domain?",
        "Describe a production issue you owned end-to-end and how you resolved it.",
        "How do you prioritize work when requirements are ambiguous?",
        "What would your first 90 days look like in this role?",
      ],
      hiringRecommendation: recommendationFromScore(overallMatchScore),
      executiveSummary: `${params.extraction.name} scores ${overallMatchScore}/100 against the job description, with strongest alignment on skills (${skillMatchScore}/100) and experience (${experienceMatchScore}/100).`,
      reasoning: {
        overall: `Weighted blend of skill overlap, experience signals, education evidence, and JD keyword coverage (${Math.round(overlap)}%).`,
        skills: `Matched ${matchedSkills.length}/${jdSkills.length || "n"} prioritized skills extracted from the JD.`,
        experience: params.extraction.experienceYears
          ? `Estimated ${params.extraction.experienceYears} years of experience from resume text.`
          : "Experience years were not explicit; scored from role narrative density.",
        education:
          params.extraction.education.length > 0
            ? "Education section present and counted as role-supporting."
            : "Limited education details found in the resume text.",
      },
      recruiterDecision,
    };
  }
}
