import * as HTTP from "./http";
import type { AuthUser } from "@/store/auth-store";

const API_BASE = "/api/v1/users";

export async function getProfile(): Promise<AuthUser> {
  const r = await HTTP.get(`${API_BASE}/me/`);
  if (!r.ok) throw new Error("Failed to fetch profile");
  return r.json();
}

export async function updateProfile(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
}): Promise<AuthUser> {
  const r = await HTTP.patch(`${API_BASE}/me/`, data);
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail ?? Object.values(err).flat().join(" ") ?? "Failed to update profile");
  }
  return r.json();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const r = await HTTP.post(`${API_BASE}/me/change-password/`, {
    current_password: currentPassword,
    new_password: newPassword,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    const msg = err.current_password?.[0] ?? err.new_password?.[0] ?? err.detail ?? "Failed to change password";
    throw new Error(String(msg));
  }
}

export async function uploadAvatar(file: File): Promise<AuthUser> {
  const formData = new FormData();
  formData.append("avatar", file);
  const r = await HTTP.postFormData(`${API_BASE}/me/avatar/`, formData);
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    const msg = err.avatar?.[0] ?? err.detail ?? "Failed to upload avatar";
    throw new Error(String(msg));
  }
  return r.json();
}
