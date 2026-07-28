import axios from "axios";

type ApiErrorResponse = {
  message?: unknown;
};

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;
    return typeof message === "string" && message.trim() ? message : fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
