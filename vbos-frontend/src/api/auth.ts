import * as HTTP from "./http";
import type { AuthUser } from "@/store/auth-store";

const API_HOST = import.meta.env.VITE_API_HOST ?? "";

export type LoginResponse =
  | { token: string }
  | {
      requires_2fa: true;
      temp_token: string;
      mfa_method: "email" | "totp";
    };

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(`${API_HOST}/api-token-auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let message = "Invalid username or password";
    try {
      const data = await response.json();
      message = data.non_field_errors?.[0] ?? data.detail ?? message;
    } catch {
      // Response was not JSON, use default message
    }
    throw new Error(String(message));
  }

  return response.json();
}

export async function verify2fa(
  tempToken: string,
  code: string,
): Promise<{ token: string }> {
  const response = await fetch(`${API_HOST}/api/v1/auth/verify-2fa/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ temp_token: tempToken, code }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      data.non_field_errors?.[0] ?? data.detail ?? "Invalid or expired code.";
    throw new Error(String(message));
  }

  return response.json();
}

export async function resendEmailOtp(tempToken: string): Promise<void> {
  const response = await fetch(`${API_HOST}/api/v1/auth/resend-email-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ temp_token: tempToken }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.non_field_errors?.[0] ?? "Failed to resend code.");
  }
}

export async function setupTotpRequest(): Promise<{
  secret: string;
  qr_svg: string;
  provisioning_uri: string;
}> {
  const response = await HTTP.post("/api/v1/auth/setup-totp/", {});
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.non_field_errors?.[0] ?? "Failed to start setup.");
  }
  return response.json();
}

export async function setupTotpVerify(code: string): Promise<{
  mfa_enabled: boolean;
  mfa_method: string;
}> {
  const response = await HTTP.post("/api/v1/auth/setup-totp-verify/", { code });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.non_field_errors?.[0] ?? "Invalid code.");
  }
  return response.json();
}

export async function setupEmailOtp(): Promise<{
  mfa_enabled: boolean;
  mfa_method: string;
}> {
  const response = await HTTP.post("/api/v1/auth/setup-email-otp/", {});
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.non_field_errors?.[0] ?? "Failed to enable email 2FA.");
  }
  return response.json();
}

export async function disable2fa(password: string): Promise<void> {
  const response = await HTTP.post("/api/v1/auth/disable-2fa/", { password });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.non_field_errors?.[0] ?? "Failed to disable 2FA.");
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await HTTP.get("/api/v1/auth/me/");

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error("Failed to fetch user");
  }

  const data = await response.json();
  return data;
}
