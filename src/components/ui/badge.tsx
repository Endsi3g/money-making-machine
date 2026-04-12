import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ── Precision Badge — pill shape, caps label, semantic colors ──

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors border-transparent shadow-[0_0_0_1px_rgba(34,42,53,0.08)]",
  {
    variants: {
      variant: {
        // Dark pill
        default:
          "bg-[#242424] text-white hover:bg-[#242424]/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-black/5",
        destructive:
          "bg-destructive/10 text-destructive shadow-none",
        outline:
          "bg-white text-muted-foreground hover:text-foreground",
        // Status badges — muted colors
        success:
          "bg-emerald-50 text-emerald-600 shadow-none",
        warning:
          "bg-amber-50 text-amber-600 shadow-none",
        info:
          "bg-blue-50 text-blue-600 shadow-none",
        // Pure dot indicator
        dot:
          "bg-transparent text-muted-foreground gap-1.5 px-0 leading-none shadow-none",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
