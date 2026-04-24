import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

interface OpacityControlProps {
  value: number;
  onValueChange: (value: number) => void;
  children: React.ReactNode;
}

export function OpacityControl(props: OpacityControlProps) {
  const { value, onValueChange, children } = props;
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="center" side="top" className="max-w-[15rem]">
        <Slider
          value={[draftValue]}
          onValueChange={(v) => setDraftValue(v[0])}
          onValueCommit={(v) => onValueChange(v[0])}
          min={0}
          max={100}
        />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {draftValue}%
        </p>
      </PopoverContent>
    </Popover>
  );
}
