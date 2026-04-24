export const toSentenceCase = (str: string) => {
  if (!str) {
    return ""; // Handle empty or null strings
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/** Human-readable property keys for map UI (underscores → words, title case). */
export function formatPropertyLabel(key: string): string {
  if (!key) return "";
  return key
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
