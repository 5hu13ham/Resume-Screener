export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { logLlmStatus } = await import("@/src/infrastructure/llm/llm-config");
  logLlmStatus();
}
