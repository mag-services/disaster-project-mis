import { useState } from "react";
import { LuArrowDown, LuArrowUp, LuArrowUpDown } from "react-icons/lu";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { useDeferredArea } from "@/hooks/useDeferredArea";
import { TabularData } from "@/types/api";
import { consolidateStats } from "@/utils/consolidateStats";
import { getAttributes, getAttributeValueSum } from "@/utils/getAttributes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type StatsTableProps = {
  stats: TabularData[];
  unit?: string | null;
};

export function StatsTable({ stats, unit }: StatsTableProps) {
  const { province, ac } = useDeferredArea();
  const rightSidebarExpanded = useUiStore((s) => s.rightSidebarExpanded);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  let rows = consolidateStats(stats, province ? "area_council" : "province");
  if (ac) {
    rows = rows.filter((row) => row.place === ac);
  }
  const columns = getAttributes(stats);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortCol) return 0;
    const placeCol = "place";
    if (sortCol === placeCol) {
      const cmp = String(a.place).localeCompare(String(b.place));
      return sortDir === "asc" ? cmp : -cmp;
    }
    const va = (a[sortCol] as number) ?? 0;
    const vb = (b[sortCol] as number) ?? 0;
    const cmp = va - vb;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortIcon = ({ col }: { col: string }) => {
    const isActive = sortCol === col;
    if (!isActive) return <LuArrowUpDown className="ml-1 size-3.5 opacity-50" />;
    return sortDir === "asc" ? (
      <LuArrowUp className="ml-1 size-3.5" />
    ) : (
      <LuArrowDown className="ml-1 size-3.5" />
    );
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-muted/20 p-4",
        rightSidebarExpanded &&
          "rounded-xl border-border/40 bg-white p-5 shadow-sm dark:bg-card/80",
      )}
    >
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Data table
      </h4>
      <div className="relative w-full overflow-x-auto">
        <Table className="table-zebra">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 min-w-max border-b-foreground/20 bg-background">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-full justify-start gap-0 p-0 font-medium hover:bg-transparent"
                onClick={() => handleSort("place")}
              >
                {province ? "Area Council" : "Province"}
                <SortIcon col="place" />
              </Button>
            </TableHead>
            {columns.map((col) => (
              <TableHead
                key={col}
                className="text-right capitalize border-b-foreground/20"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto w-full justify-end gap-0 p-0 font-medium hover:bg-transparent"
                  onClick={() => handleSort(col)}
                >
                  {col.replace(/_/g, " ")}
                  {unit && (
                    <span className="ml-1 text-xs font-normal opacity-50">({unit})</span>
                  )}
                  <SortIcon col={col} />
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="text-muted-foreground">
          {sortedRows.map((row) => (
            <TableRow key={row.place}>
              <TableCell className="sticky left-0 z-10 bg-background">
                {row.place}
              </TableCell>
              {columns.map((col) => (
                <TableCell key={col} className="font-mono-num text-right tabular-nums">
                  {row[col].toLocaleString()}
                </TableCell>
              ))}
            </TableRow>
          ))}
          <TableRow className="total-row border-t-2 border-border">
            <TableCell className="sticky left-0 z-10 font-semibold bg-background">
              Total
            </TableCell>
            {columns.map((col) => (
              <TableCell key={col} className="font-mono-num text-right font-semibold tabular-nums">
                {getAttributeValueSum(stats, col).toLocaleString()}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
