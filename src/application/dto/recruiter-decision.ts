import type {
  CandidateEvaluation,
  RecruiterDecision,
  RecruiterDecisionConfidence,
  RecruiterDecisionRecommendation,
  ResumeExtraction,
} from "@/src/domain/entities/screening";

export function recommendationFromOverallScore(
  score: number,
): RecruiterDecisionRecommendation {
  if (score >= 85) return "Strong Interview";
  if (score >= 70) return "Interview";
  if (score >= 55) return "Maybe";
  return "Reject";
}

export function confidenceFromSignals(params: {
  overallMatchScore: number;
  skillMatchScore: number;
  experienceMatchScore: number;
  educationMatchScore: number;
  missingRequiredCount: number;
}): RecruiterDecisionConfidence {
  const spread =
    Math.max(
      params.skillMatchScore,
      params.experienceMatchScore,
      params.educationMatchScore,
      params.overallMatchScore,
    ) -
    Math.min(
      params.skillMatchScore,
      params.experienceMatchScore,
      params.educationMatchScore,
      params.overallMatchScore,
    );

  if (params.missingRequiredCount >= 4 || spread >= 35) return "Low";
  if (params.missingRequiredCount >= 2 || spread >= 20) return "Medium";
  if (params.overallMatchScore >= 70 && params.missingRequiredCount <= 1) {
    return "High";
  }
  return "Medium";
}

function titleCaseSkill(skill: string): string {
  if (skill.toLowerCase() === "aws") return "AWS";
  if (skill.toLowerCase() === "ci/cd") return "CI/CD";
  if (skill.toLowerCase() === "spring boot") return "Spring Boot";
  return skill
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildHeuristicRecruiterDecision(params: {
  overallMatchScore: number;
  skillMatchScore: number;
  experienceMatchScore: number;
  educationMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  extraction: ResumeExtraction;
}): RecruiterDecision {
  const strengths: string[] = [];
  if (params.matchedSkills.length) {
    strengths.push(
      `Matched required skills: ${params.matchedSkills
        .slice(0, 4)
        .map(titleCaseSkill)
        .join(", ")}`,
    );
  }
  if (params.extraction.experienceYears != null) {
    strengths.push(
      `${params.extraction.experienceYears}+ years of relevant experience`,
    );
  }
  if (params.extraction.certifications.length) {
    strengths.push(
      `Certifications: ${params.extraction.certifications.slice(0, 2).join(", ")}`,
    );
  }
  if (params.extraction.education.length) {
    strengths.push(
      `Education: ${params.extraction.education[0]?.degree ?? "Degree on file"}`,
    );
  }
  if (!strengths.length) {
    strengths.push("Some transferable background relative to the role");
  }

  const gaps = params.missingSkills
    .slice(0, 3)
    .map((skill) => `Limited evidence of ${titleCaseSkill(skill)}`);

  if (!gaps.length && params.skillMatchScore < 70) {
    gaps.push("Skill evidence is thinner than the role typically requires");
  }

  const interviewFocus = (
    params.missingSkills.length
      ? params.missingSkills
      : gaps.map((gap) => gap.replace(/^Limited evidence of\s+/i, ""))
  )
    .slice(0, 3)
    .map(titleCaseSkill);

  return {
    recommendation: recommendationFromOverallScore(params.overallMatchScore),
    confidence: confidenceFromSignals({
      overallMatchScore: params.overallMatchScore,
      skillMatchScore: params.skillMatchScore,
      experienceMatchScore: params.experienceMatchScore,
      educationMatchScore: params.educationMatchScore,
      missingRequiredCount: params.missingSkills.length,
    }),
    strengths: strengths.slice(0, 5),
    gaps: gaps.slice(0, 3),
    interviewFocus: interviewFocus.slice(0, 3),
  };
}

/** Backfill for older stored evaluations that predate recruiterDecision. */
export function ensureRecruiterDecision(
  evaluation: CandidateEvaluation,
): RecruiterDecision {
  if (evaluation.recruiterDecision) {
    return {
      recommendation: evaluation.recruiterDecision.recommendation,
      confidence: evaluation.recruiterDecision.confidence,
      strengths: evaluation.recruiterDecision.strengths.slice(0, 5),
      gaps: evaluation.recruiterDecision.gaps.slice(0, 3),
      interviewFocus: evaluation.recruiterDecision.interviewFocus.slice(0, 3),
    };
  }

  return buildHeuristicRecruiterDecision({
    overallMatchScore: evaluation.overallMatchScore,
    skillMatchScore: evaluation.skillMatchScore,
    experienceMatchScore: evaluation.experienceMatchScore,
    educationMatchScore: evaluation.educationMatchScore,
    matchedSkills: [],
    missingSkills: evaluation.missingSkills,
    extraction: {
      name: "Candidate",
      contact: {
        email: null,
        phone: null,
        linkedin: null,
        location: null,
      },
      experienceYears: null,
      experience: [],
      skills: [],
      projects: [],
      education: [],
      certifications: [],
    },
  });
}
