/**
 * Shows cyclone intensity by area council when province/area council is selected.
 * Appears in the right panel when a cyclone intensity layer (vector or PMTiles) is active.
 * Full table for users who want the detailed breakdown.
 */
import { useCycloneIntensityData, type IntensityRow } from "@/hooks/useCycloneIntensityData";
import { CYCLONE_INTENSITY_LEGEND } from "@/config/disaster";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { LuWind } from "react-icons/lu";
import { cn } from "@/lib/utils";

function IntensityTable({
  title,
  rows,
}: {
  title: string;
  rows: IntensityRow[];
}) {
  if (rows.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-amber-200/70 bg-gradient-to-b from-amber-50/80 to-white p-5 shadow-md dark:border-amber-800/50 dark:from-amber-950/40 dark:to-card",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <LuWind className="size-5 text-amber-600 dark:text-amber-500" />
        <h3 className="text-base font-bold text-foreground">{title}</h3>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Cyclone intensity by area council
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-semibold">Area Council</TableHead>
            <TableHead className="text-xs font-semibold">Province</TableHead>
            <TableHead className="w-24 text-xs font-semibold">Intensity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={`${r.areaCouncil}-${r.province}`}>
              <TableCell className="text-xs">{r.areaCouncil}</TableCell>
              <TableCell className="text-xs">{r.province}</TableCell>
              <TableCell className="text-xs">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    r.intensityColor && "font-semibold",
                  )}
                >
                  {r.intensityColor && (
                    <span
                      className="inline-block size-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: r.intensityColor }}
                    />
                  )}
                  {r.intensity !== "" ? r.intensity : "—"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        {CYCLONE_INTENSITY_LEGEND.map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1">
            <span
              className="inline-block size-2 rounded-sm"
              style={{ backgroundColor: color }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CycloneIntensityCard() {
  const data = useCycloneIntensityData();

  if (!data) return null;
  if (data.isLoading) {
    return (
      <div className="rounded-xl border-2 border-amber-200/70 bg-amber-50/30 p-5 dark:border-amber-800/50 dark:bg-amber-950/20">
        <div className="mb-3 flex items-center gap-2">
          <LuWind className="size-5 text-amber-600 dark:text-amber-500" />
          <h3 className="text-base font-bold">{data.cycloneName || "Cyclone Intensity"}</h3>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (!data.hasData) return null;

  return (
    <IntensityTable
      title={data.cycloneName || "Cyclone Intensity"}
      rows={data.rows}
    />
  );
}
