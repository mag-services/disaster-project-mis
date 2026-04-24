import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

type ToastDescription = string | ReactNode;

export const toast = {
  success: (message: string, description?: ToastDescription) =>
    sonnerToast.success(message, { description }),
  error: (message: string, description?: ToastDescription) =>
    sonnerToast.error(message, { description }),
  warning: (message: string, description?: ToastDescription) =>
    sonnerToast.warning(message, { description }),
  info: (message: string, description?: ToastDescription) =>
    sonnerToast.info(message, { description }),
};
