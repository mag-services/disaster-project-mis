import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { getCurrentUser } from "@/api/auth";

/**
 * Validates token on mount and fetches user if we have token but no user.
 * Call this at app root to restore session on refresh.
 */
export function useAuth() {
  const { token, user, setUser, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    if (user) return; // Already have user, token was validated

    getCurrentUser()
      .then((userData) => {
        setUser(userData);
      })
      .catch((err) => {
        if (err.message === "UNAUTHORIZED") {
          clearAuth();
        }
      });
  }, [token, user, setUser, clearAuth]);

  return { token, user, isAuthenticated: !!token };
}
