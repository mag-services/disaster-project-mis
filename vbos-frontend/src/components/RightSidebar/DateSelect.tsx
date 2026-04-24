import { useState, useEffect, startTransition } from "react";
import { useDateStore } from "@/store/date-store";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export const DateSelect = () => {
  const minYear = 2004;
  const maxYear = new Date().getFullYear();
  const { year, setYear } = useDateStore();

  const getInitialYear = () => {
    if (year) return Number(year);
    const params = new URLSearchParams(window.location.search);
    const urlYear = params.get("year");
    return urlYear ? Number(urlYear) : maxYear - 1;
  };

  const [value, setValue] = useState([getInitialYear()]);

  useEffect(() => {
    if (year) setValue([Number(year)]);
  }, [year]);

  return (
    <div className="w-full space-y-2">
      <div className="mb-2 flex items-center justify-between">
        <Label>Set year data</Label>
        <span className="font-bold">{value[0]}</span>
      </div>
      <div className="slider-neumorphic">
      <Slider
        min={minYear}
        max={maxYear}
        value={value}
        onValueChange={setValue}
        onValueCommit={(v) => startTransition(() => setYear(String(v[0])))}
      />
      </div>
    </div>
  );
};
