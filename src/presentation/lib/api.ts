import { NextResponse } from "next/server";

import { getCurrentUser } from "@/src/application/use-cases/get-current-user";
import { AppError } from "@/src/domain/errors/app-error";
import { toRecruiterFriendlyError } from "@/src/presentation/lib/friendly-errors";

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AppError("Please sign in again to continue.", "UNAUTHORIZED", 401);
  }
  return user;
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: toRecruiterFriendlyError(error), code: error.code },
      { status: error.status },
    );
  }

  if (error && typeof error === "object" && "issues" in error) {
    return NextResponse.json(
      {
        error: "Some details look incomplete. Please review and try again.",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json(
    {
      error:
        "Something went wrong while preparing this screening. Please try again.",
      code: "UNEXPECTED",
    },
    { status: 500 },
  );
}
