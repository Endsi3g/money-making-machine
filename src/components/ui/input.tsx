import * as React from "react";
import { cn } from "@/lib/utils";

// ── Precision Input — underline focus, no radius ──

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base
          "flex h-9 w-full rounded-md bg-white px-3 py-1 text-sm text-[#242424] shadow-cal-1",
          // Border: hairline all-around
          "border border-input",
          // Placeholder
          "placeholder:text-muted-foreground",
          // Focus: blue focus ring
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-40",
          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // Transition
          "transition-colors duration-150",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
