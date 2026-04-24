/**
 * Simple year dropdown for Disaster dashboard.
 * No play button, just select a year.
 */
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDateStore } from "@/store/date-store";

const MIN_YEAR = 2004;
const MAX_YEAR = new Date().getFullYear();

const YEARS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, i) => String(MAX_YEAR - i),
);

export function YearSelect() {
  const { year, setYear } = useDateStore();

  return (
    <div className="w-full space-y-2">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Year
      </Label>
      <Select value={year} onValueChange={setYear}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
