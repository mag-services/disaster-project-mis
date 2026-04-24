/**
 * Land Cover → Storytelling: "What changed?" and "Why it matters"
 */
import {
  LAND_ACCOUNT_CATEGORIES,
  LAND_ACCOUNT_PROVINCES,
} from "@/data/landAccountsData";
import { LAND_COVER_IMPACTS } from "@/config/landCoverImpacts";
import { useAreaStore } from "@/store/area-store";
import { useLandAccounts } from "@/hooks/useLandAccounts";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export function LandCoverStorytelling() {
  const { provinces } = useAreaStore();
  const { landAccountsData } = useLandAccounts();

  const provincesList = useMemo(() => {
    return provinces.length > 0
      ? provinces
      : LAND_ACCOUNT_PROVINCES.filter((p) => landAccountsData.provinces[p] != null);
  }, [provinces, landAccountsData]);

  const changes = useMemo(() => {
    const result: { category: string; netChange: number; totalOpening: number; impact: string }[] = [];
    for (const cat of LAND_ACCOUNT_CATEGORIES) {
      let opening = 0;
      let netChange = 0;
      for (const p of provincesList) {
        const pa = landAccountsData.provinces[p]?.physical_account;
        if (pa) {
          opening += pa.opening[cat as keyof typeof pa.opening] ?? 0;
          netChange += pa.net_change[cat as keyof typeof pa.net_change] ?? 0;
        }
      }
      if (opening <= 0) continue;
      const impact = LAND_COVER_IMPACTS.find((i) => i.category === cat);
      result.push({
        category: cat,
        netChange,
        totalOpening: opening,
        impact: netChange < 0 ? impact?.lossImpact ?? "" : impact?.gainImpact ?? "",
      });
    }
    return result.filter((c) => Math.abs(c.netChange) > 0.1).sort((a, b) => Math.abs(b.netChange) - Math.abs(a.netChange));
  }, [provincesList, landAccountsData]);

  if (changes.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-4">
      <h3 className="mb-3 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        What changed?
      </h3>
      <ul className="space-y-3">
        {changes.slice(0, 5).map((c) => {
          const isLoss = c.netChange < 0;
          const pctChange = (c.netChange / c.totalOpening) * 100;
          return (
            <li key={c.category} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{c.category}</span>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    isLoss
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {isLoss ? "↓" : "↑"} {Math.abs(pctChange).toFixed(1)}%
                </span>
              </div>
              {c.impact && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  → {c.impact}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
