import { NextResponse } from "next/server";

import { getCurrentUser } from "@/src/application/use-cases/get-current-user";
import { AppError } from "@/src/domain/errors/app-error";

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
  }
  return user;
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  if (error && typeof error === "object" && "issues" in error) {
    return NextResponse.json(
      { error: "Validation failed", details: error },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: "Unexpected server error" },
    { status: 500 },
  );
}
