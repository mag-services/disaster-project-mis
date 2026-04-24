import { useAuthStore } from "@/store/auth-store";
import { useOfflineStore } from "@/store/offline-store";
import { DeviceOfflineError } from "@/errors";
import { toast } from "@/utils/toast";

enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  PUT = "PUT",
  DELETE = "DELETE",
}

type RequestPayload = Record<string, unknown>;

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }
  return headers;
}

function request(
  url: string,
  method: HttpMethod,
  payload?: RequestPayload,
): Promise<Response> {
  const base = import.meta.env.VITE_API_HOST ?? "";
  return fetch(`${base}${url}`, {
    method,
    headers: getAuthHeaders(),
    body: payload ? JSON.stringify(payload) : undefined,
  })
    .then((response) => {
      if (response.status === 401 || response.status === 403) {
        const hadToken = !!useAuthStore.getState().token;
        useAuthStore.getState().clearAuth();
        // Only show toast when user had a session that expired – not when on login page
        if (hadToken) {
          toast.warning(
            response.status === 403 ? "Access denied" : "Session expired",
            "Please sign in again.",
          );
        }
      }
      if (response.status === 599) {
        useOfflineStore.getState().incrementQueued();
        toast.error("You're offline", "Please check your connection and try again.");
        throw new DeviceOfflineError();
      }
      return response;
    })
    .catch((err) => {
      if (!navigator.onLine) {
        useOfflineStore.getState().incrementQueued();
        toast.error("You're offline", "Please check your connection and try again.");
        throw new DeviceOfflineError();
      }
      if (
        err?.name === "TypeError" ||
        err?.message?.toLowerCase().includes("fetch") ||
        err?.message?.toLowerCase().includes("network")
      ) {
        const hint = base
          ? `Backend at ${base} may be down, or check CORS.`
          : "Backend at localhost:8000 may be down. Ensure docker compose is running.";
        toast.error("Could not reach server", hint);
        throw new Error("Connection failed");
      }
      throw err;
    });
}

export function get(url: string): Promise<Response> {
  return request(url, HttpMethod.GET);
}

export function post(url: string, payload?: RequestPayload): Promise<Response> {
  return request(url, HttpMethod.POST, payload);
}

export function patch(url: string, payload: RequestPayload): Promise<Response> {
  return request(url, HttpMethod.PATCH, payload);
}

export function put(url: string, payload: RequestPayload): Promise<Response> {
  return request(url, HttpMethod.PUT, payload);
}

/** Upload multipart form data (e.g. file upload). Does not set Content-Type. */
export function postFormData(url: string, formData: FormData): Promise<Response> {
  const base = import.meta.env.VITE_API_HOST ?? "";
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }
  return fetch(`${base}${url}`, {
    method: "POST",
    headers,
    body: formData,
  }).then((response) => {
    if (response.status === 401 || response.status === 403) {
      const hadToken = !!useAuthStore.getState().token;
      useAuthStore.getState().clearAuth();
      if (hadToken) {
        toast.warning(
          response.status === 403 ? "Access denied" : "Session expired",
          "Please sign in again.",
        );
      }
    }
    return response;
  });
}

export function _delete(url: string): Promise<Response> {
  return request(url, HttpMethod.DELETE);
}
