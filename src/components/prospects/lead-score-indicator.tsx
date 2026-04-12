import { cn } from "@/lib/utils";

interface LeadScoreIndicatorProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-slate-400";
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-slate-300";
}

export function LeadScoreIndicator({ score, showLabel = false, className }: LeadScoreIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", getScoreBarColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("text-xs font-medium tabular-nums", getScoreColor(score))}>
        {score}
        {showLabel && <span className="text-muted-foreground">/100</span>}
      </span>
    </div>
  );
}
