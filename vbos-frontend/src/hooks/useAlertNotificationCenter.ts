import { useEffect, useRef, useState } from "react";
import { useLiveAlerts } from "@/hooks/useLiveAlerts";
import type { LiveAlert } from "@/api/getLiveAlerts";

const SEEN_ALERTS_KEY = "drmis-seen-alert-ids-v1";

function readSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_ALERTS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((v) => String(v)));
  } catch {
    return new Set();
  }
}

function writeSeenIds(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_ALERTS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore storage errors
  }
}

function shouldPulse(alert: LiveAlert): boolean {
  return alert.severity === "critical" || alert.severity === "high";
}

function notify(alert: LiveAlert) {
  if (typeof Notification === "undefined") return;
  const title = `[${alert.source}] ${alert.title}`;
  const body = `${alert.severity.toUpperCase()} · ${alert.type} · ${alert.summary || "New alert received."}`;
  try {
    const opts: NotificationOptions & { renotify?: boolean } = {
      body,
      tag: `drmis-alert-${alert.id}`,
      renotify: true,
    };
    new Notification(title, opts);
  } catch {
    // best effort
  }
}

function playAlertTone() {
  try {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.24);
    oscillator.onended = () => {
      void ctx.close();
    };
  } catch {
    // audio is best-effort only
  }
}

export function useAlertNotificationCenter() {
  const { data } = useLiveAlerts();
  const [pulse, setPulse] = useState(false);
  const initializedRef = useRef(false);
  const pulseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const alerts = data?.alerts ?? [];
    if (alerts.length === 0 || typeof window === "undefined") return;

    const seen = readSeenIds();
    if (!initializedRef.current) {
      alerts.forEach((a) => seen.add(String(a.id)));
      writeSeenIds(seen);
      initializedRef.current = true;
      return;
    }

    const unseen = alerts.filter((a) => !seen.has(String(a.id)));
    if (unseen.length === 0) return;

    unseen.forEach((a) => seen.add(String(a.id)));
    writeSeenIds(seen);

    const hasCriticalOrHigh = unseen.some(shouldPulse);
    if (hasCriticalOrHigh) {
      setPulse(true);
      playAlertTone();
      if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = window.setTimeout(() => setPulse(false), 15000);
    }

    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      unseen.slice(0, 3).forEach(notify);
      return;
    }
    if (Notification.permission === "default") {
      Notification.requestPermission()
        .then((perm) => {
          if (perm === "granted") unseen.slice(0, 3).forEach(notify);
        })
        .catch(() => {});
    }
  }, [data]);

  return {
    alertCount: data?.count ?? 0,
    alertPulse: pulse,
  };
}
