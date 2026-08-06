export const DEFAULT_LLM_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai";

export const DEFAULT_LLM_MODEL = "gemini-flash-latest";

export const LLM_PROVIDER_LABEL = "Gemini (OpenAI Compatible)";

export type LlmRuntimeConfig = {
  provider: string;
  model: string;
  baseUrl: string;
  hasApiKey: boolean;
  status: "live" | "heuristic";
  statusReason: string | null;
};

export function getLlmRuntimeConfig(): LlmRuntimeConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const hasApiKey = Boolean(apiKey);
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_LLM_MODEL;
  const baseUrl = process.env.OPENAI_API_BASE?.trim() || DEFAULT_LLM_BASE_URL;

  return {
    provider: LLM_PROVIDER_LABEL,
    model,
    baseUrl,
    hasApiKey,
    status: hasApiKey ? "live" : "heuristic",
    statusReason: hasApiKey ? null : "OPENAI_API_KEY not configured",
  };
}

let hasLoggedStatus = false;

export function logLlmStatus(force = false): void {
  if (hasLoggedStatus && !force) return;
  hasLoggedStatus = true;

  const config = getLlmRuntimeConfig();
  const statusLabel =
    config.status === "live" ? "Live LLM" : "Heuristic Fallback";

  console.log(`
---------------------------------------
LLM Status

Provider: ${config.provider}
Model: ${config.model}
Base URL: ${config.baseUrl}

Status:
${statusLabel}
---------------------------------------
`);
}
