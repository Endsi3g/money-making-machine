import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base: 8px radius, tight tracking, standard transition
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 tracking-tight",
  {
    variants: {
      variant: {
        // Primary: Dark Charcoal fill + inset highlight
        default:
          "bg-[#242424] text-white hover:bg-[#242424]/90 shadow-cal-4 active:scale-[0.98]",
        // Destructive
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        // Outline: ring shadow
        outline:
          "shadow-cal-2 bg-white text-[#242424] hover:bg-black/5",
        // Secondary: light gray fill
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Ghost: totally invisible until hovered
        ghost:
          "bg-transparent text-muted-foreground hover:bg-black/5 hover:text-[#242424]",
        // Link
        link:
          "text-[#242424] underline-offset-4 hover:underline bg-transparent p-0 h-auto",
        // Luxury (Legacy) -> mapped to Cal outline
        luxury:
          "shadow-cal-2 bg-white text-[#242424] hover:bg-black/5",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-8 px-3 text-xs",
        lg:      "h-11 px-6 text-base",
        xl:      "h-12 px-8 text-base",
        icon:    "h-9 w-9",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
