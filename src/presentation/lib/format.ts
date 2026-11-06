import type { HiringRecommendation } from "@/src/domain/entities/screening";

export function formatRecommendation(value: HiringRecommendation | undefined) {
  switch (value) {
    case "strong_yes":
      return "High alignment";
    case "yes":
      return "Good alignment";
    case "maybe":
      return "Review evidence";
    case "no":
      return "Needs human review";
    case "strong_no":
      return "Needs human review";
    default:
      return "Pending";
  }
}

export function recommendationTone(value: HiringRecommendation | undefined) {
  switch (value) {
    case "strong_yes":
    case "yes":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "maybe":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "no":
    case "strong_no":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export function scoreTone(score: number | null | undefined) {
  if (score == null) return "text-slate-500";
  if (score >= 75) return "text-emerald-700";
  if (score >= 55) return "text-amber-700";
  return "text-rose-700";
}
