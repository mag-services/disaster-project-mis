/**
 * Legacy entry: the full-screen profile overlay was replaced by {@link SettingsPage}
 * in the app shell. This module remains so stale copies on deploy targets (e.g. after
 * rsync without --delete) still typecheck and behave sensibly.
 */
import { useEffect } from "react";
import { useUiStore } from "@/store/ui-store";

export function ProfilePage() {
  const setShellNavId = useUiStore((s) => s.setShellNavId);

  useEffect(() => {
    setShellNavId("settings");
  }, [setShellNavId]);

  return null;
}
