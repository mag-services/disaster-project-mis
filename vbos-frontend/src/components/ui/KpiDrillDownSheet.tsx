/**
 * Sheet for KPI drill-down details.
 */
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { KpiDrillDownData } from "@/config/kpis";

export interface KpiDrillDownSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: KpiDrillDownData | null;
}

export function KpiDrillDownSheet({
  open,
  onOpenChange,
  data,
}: KpiDrillDownSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{data?.title ?? "Details"}</SheetTitle>
        </SheetHeader>
        {data && (
          <div className="flex flex-col gap-4 p-4">
            <div className="rounded-lg border border-border bg-muted/30">
              <table className="w-full text-sm">
                <tbody>
                  {data.rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-2.5 font-medium text-muted-foreground">
                        {row.label}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.source && (
              <p className="text-xs text-muted-foreground">{data.source}</p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
