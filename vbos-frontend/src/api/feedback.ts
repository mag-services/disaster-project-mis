import { postFormData } from "./http";

export type FeedbackCategory = "bug" | "feature" | "general";

function extractErrorMessage(data: Record<string, unknown>): string {
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) return String(data.detail[0] ?? "Failed to submit");
  const nonField = data.non_field_errors;
  if (Array.isArray(nonField) && nonField[0]) return String(nonField[0]);
  for (const key of ["category", "message", "screenshot", "user_email"]) {
    const arr = data[key];
    if (Array.isArray(arr) && arr[0]) return String(arr[0]);
  }
  return "Failed to submit feedback";
}

export async function submitFeedback(formData: FormData): Promise<void> {
  const res = await postFormData("/api/v1/feedback/", formData);
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(extractErrorMessage(data));
  }
}
