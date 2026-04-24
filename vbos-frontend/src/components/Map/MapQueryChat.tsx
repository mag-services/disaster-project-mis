/**
 * Natural-language map query: sends text to the backend planner and applies the returned plan.
 */
import { useState, useCallback } from "react";
import { LuChevronUp, LuMessageSquareText, LuSend } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { postMapQuery } from "@/api/postMapQuery";
import { applyMapQueryPlan } from "@/lib/applyMapQueryPlan";
import { toast } from "@/utils/toast";

export function MapQueryChat() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const [lastWarnings, setLastWarnings] = useState<string[]>([]);

  const submit = useCallback(async () => {
    const q = text.trim();
    if (!q || loading) return;
    setLoading(true);
    setLastExplanation(null);
    setLastWarnings([]);
    try {
      const { plan, warnings } = await postMapQuery(q);
      await applyMapQueryPlan(plan);
      setLastExplanation(plan.explanation || null);
      setLastWarnings(warnings ?? []);
      toast.success("Map updated", plan.explanation || "Filters and layers applied.");
      setText("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      toast.error("Could not run map query", msg);
    } finally {
      setLoading(false);
    }
  }, [text, loading]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-4 left-3 right-3 z-[1040] md:left-4 md:right-auto md:max-w-md",
        "drmis-panel-enter",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto overflow-hidden rounded-[var(--drmis-radius-card)] border border-border",
          "bg-card/90 shadow-[var(--drmis-shadow-sm)] backdrop-blur-md backdrop-saturate-150",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium",
            "hover:bg-muted/50 md:py-2",
          )}
          aria-expanded={open}
        >
          <span className="flex items-center gap-2">
            <LuMessageSquareText className="size-4 shrink-0 text-primary" aria-hidden />
            Ask the map
          </span>
          <LuChevronUp
            className={cn("size-4 shrink-0 transition-transform", !open && "rotate-180")}
            aria-hidden
          />
        </button>
        {open && (
          <div className="border-t border-border px-3 pb-3 pt-2">
            <p className="mb-2 text-xs text-muted-foreground">
              Describe what you want to see. Example: schools in Tafea with more than 200
              students.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Show health facilities in Shefa"
              className={cn(
                "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-h-[4.5rem] resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              )}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void submit();
                }
              }}
              aria-label="Natural language map query"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">
                Ctrl+Enter to send
              </span>
              <Button
                type="button"
                size="sm"
                disabled={loading || !text.trim()}
                onClick={() => void submit()}
                className="gap-1.5"
              >
                <LuSend className="size-3.5" aria-hidden />
                {loading ? "…" : "Apply"}
              </Button>
            </div>
            {lastExplanation && (
              <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
                {lastExplanation}
              </p>
            )}
            {lastWarnings.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-[11px] text-amber-700 dark:text-amber-400">
                {lastWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
