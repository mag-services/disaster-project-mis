import * as React from "react";
import { cn } from "@/lib/utils";

const SidebarSectionHeading = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentProps<"h3">
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        "m-0 overflow-hidden text-ellipsis whitespace-pre text-base font-semibold text-blue-800",
        className
      )}
      {...props}
    />
  );
});

export { SidebarSectionHeading };
