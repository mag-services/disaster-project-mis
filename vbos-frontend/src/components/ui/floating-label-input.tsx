import * as React from "react";

import { cn } from "@/lib/utils";

export interface FloatingLabelInputProps
  extends Omit<React.ComponentProps<"input">, "placeholder"> {
  /** Visible label; animates from inside the field to a small caption above. */
  label: string;
}

/**
 * Material-style floating label: label sits in the field, then moves up with a
 * smaller font on focus or when the field has a value. Uses `placeholder=" "` so
 * `:placeholder-shown` tracks empty vs filled for controlled inputs.
 */
const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          data-slot="floating-label-input"
          className={cn(
            "peer flex h-14 w-full min-w-0 rounded-md border border-input bg-transparent px-3 pb-2.5 pt-6 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none md:text-sm",
            "text-foreground selection:bg-primary selection:text-primary-foreground",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
            "dark:bg-input/30",
            className,
          )}
          {...props}
          placeholder=" "
        />
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute left-3 z-10 text-muted-foreground motion-safe:transition-[top,transform,font-size,color] motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none",
            "top-1/2 -translate-y-1/2 text-[15px] leading-none",
            "peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-primary",
            "peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:text-foreground",
          )}
        >
          {label}
        </label>
      </div>
    );
  },
);

FloatingLabelInput.displayName = "FloatingLabelInput";

export { FloatingLabelInput };
