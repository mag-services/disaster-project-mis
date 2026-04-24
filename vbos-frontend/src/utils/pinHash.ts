/**
 * Hash a 4-digit PIN for local storage (not sent to server).
 * Uses Web Crypto API for consistent comparison.
 */
export async function hashPin(pin: string): Promise<string> {
  const buf = new TextEncoder().encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPin(enteredPin: string, storedHash: string): Promise<boolean> {
  const hash = await hashPin(enteredPin);
  return hash === storedHash;
}
