import axios from "axios";

type ApiErrorResponse = {
  message?: unknown;
  errors?: unknown;
};

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const issues = error.response?.data?.errors;
    if (Array.isArray(issues)) {
      const messages = issues.filter((issue): issue is { message: string } => Boolean(issue && typeof issue === "object" && typeof issue.message === "string" && issue.message.trim())).slice(0, 3).map((issue) => issue.message.slice(0, 300));
      if (messages.length) return [...new Set(messages)].join(". ");
    }
    const message = error.response?.data?.message;
    return typeof message === "string" && message.trim() ? message : fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
