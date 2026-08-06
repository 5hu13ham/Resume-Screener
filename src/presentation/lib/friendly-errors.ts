import { AppError } from "@/src/domain/errors/app-error";

const FRIENDLY_BY_CODE: Record<string, string> = {
  UNAUTHORIZED: "Please sign in again to continue.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  VALIDATION_ERROR: "Please check your input and try again.",
  AI_ERROR:
    "We couldn't finish AI evaluation right now. You can retry this candidate shortly.",
};

const FRIENDLY_FALLBACKS: Array<{ match: RegExp; message: string }> = [
  {
    match: /job description/i,
    message: "Please paste a clearer job description before screening.",
  },
  {
    match: /upload|pdf|docx|file/i,
    message: "Please upload PDF or DOCX resumes and try again.",
  },
  {
    match: /unauthorized|sign in/i,
    message: "Please sign in again to continue.",
  },
  {
    match: /not found/i,
    message: "That screening or candidate is no longer available.",
  },
];

export function toRecruiterFriendlyError(error: unknown): string {
  if (error instanceof AppError) {
    return FRIENDLY_BY_CODE[error.code] ?? error.message;
  }

  if (error && typeof error === "object" && "issues" in error) {
    return "Some details look incomplete. Please review the form and try again.";
  }

  if (error instanceof Error && error.message.trim()) {
    for (const item of FRIENDLY_FALLBACKS) {
      if (item.match.test(error.message)) {
        return item.message;
      }
    }
    // Avoid leaking raw/internal phrasing when possible.
    if (!/stack|exception|errno|EPERM|ENOENT/i.test(error.message)) {
      return error.message;
    }
  }

  return "Something went wrong while preparing this screening. Please try again.";
}

export function readApiErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error: unknown }).error === "string"
  ) {
    const message = (payload as { error: string }).error.trim();
    return message || fallback;
  }
  return fallback;
}
