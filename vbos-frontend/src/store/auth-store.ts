import { create } from "zustand";
import { persist } from "zustand/middleware";

const AUTH_TOKEN_KEY = "vbos-auth-token";

export interface AuthOrganisation {
  id: number;
  name: string;
  slug: string;
  short_name: string | null;
}

export interface AuthUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string | null;
  /** Ministry / partner org when backend assigns one (GGGI, MoCCA, …). */
  organisation?: AuthOrganisation | null;
  role?: "admin" | "analyst" | "field_officer" | "read_only";
  is_staff: boolean;
  is_superuser: boolean;
  mfa_enabled?: boolean;
  mfa_method?: "email" | "totp" | "";
  otp_required_for_all_logins?: boolean;
  groups: string[];
  permissions: string[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser | null) => void;
  clearAuth: () => void;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
    (set) => ({
      token: null,
      user: null,

      setAuth: (token, user) => set({ token, user }),

      clearAuth: () => set({ token: null, user: null }),

      setUser: (user) => set({ user }),
    }),
    {
      name: AUTH_TOKEN_KEY,
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
