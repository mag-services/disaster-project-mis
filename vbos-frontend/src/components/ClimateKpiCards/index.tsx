import { useMemo, useState } from "react";
import { useAreaStore } from "@/store/area-store";
import { useScenario } from "@/hooks/useScenario";
import { useMapStore } from "@/store/map-store";
import { useLandAccounts } from "@/hooks/useLandAccounts";
import { LAND_ACCOUNT_PROVINCES } from "@/data/landAccountsData";
import { CLIMATE_KPIS } from "@/config/climateKpis";
import { KpiCard } from "@/components/ui/KpiCard";
import { KpiDrillDownSheet } from "@/components/ui/KpiDrillDownSheet";
import { cn } from "@/lib/utils";
import type { KpiDrillDownData } from "@/config/kpis";

const ClimateKpiCards = () => {
  const scenario = useScenario();
  const { provinces } = useAreaStore();
  const zoom = useMapStore((s) => s.viewState.zoom);
  const { landAccountsData } = useLandAccounts();
  const [drillDown, setDrillDown] = useState<KpiDrillDownData | null>(null);

  const provincesList = useMemo(() => {
    const list = provinces.length > 0
      ? provinces
      : LAND_ACCOUNT_PROVINCES.filter((p) =>
          landAccountsData.provinces[p] != null,
        );
    return list;
  }, [provinces, landAccountsData]);

  const ctx = useMemo(
    () => ({ provinces: provincesList, landAccountsData }),
    [provincesList, landAccountsData],
  );

  if (scenario.id !== "climate") return null;

  const zoomNorm = Math.max(0, Math.min(1, (zoom - 6) / 6));
  const scale = 1 + zoomNorm * 0.02;
  const lift = -zoomNorm * 8;

  return (
    <>
      <div
        className={cn(
          "contain-panel absolute right-4 top-4 z-[1000] max-w-[calc(100%-2rem)] overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm",
          "md:right-6 md:top-6 md:max-w-[340px] md:p-4",
          "-translate-y-0.5",
        )}
        style={{
          transform: `scale(${scale}) translateY(${lift}px)`,
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Land accounts · 2020 → 2023
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {CLIMATE_KPIS.map((kpi) => {
            const result = kpi.formula(ctx);
            const drillData = kpi.getDrillDown?.(ctx) ?? null;
            return (
              <KpiCard
                key={kpi.id}
                label={kpi.label}
                result={result}
                unit={kpi.unit}
                trend={kpi.trend}
                showMapPin={kpi.id === "total_land"}
                onClick={
                  drillData
                    ? () => setDrillDown(drillData)
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>
      <KpiDrillDownSheet
        open={!!drillDown}
        onOpenChange={(open) => !open && setDrillDown(null)}
        data={drillDown}
      />
    </>
  );
};

export default ClimateKpiCards;
