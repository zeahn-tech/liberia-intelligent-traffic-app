import { cn } from "@/lib/utils";

interface ConfidenceBarProps {
  /** Confidence score 0-1 */
  score: number;
  /** Optional label to display next to the percentage */
  label?: string;
  /** Hide the percentage text display */
  hideLabel?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Custom class */
  className?: string;
}

const sizeMap = {
  sm: { bar: "h-1.5", text: "text-[10px]" },
  md: { bar: "h-2", text: "text-xs" },
  lg: { bar: "h-3", text: "text-sm" },
};

export function ConfidenceBar({
  score,
  label,
  hideLabel,
  size = "md",
  className,
}: ConfidenceBarProps) {
  const percent = Math.round(score * 100);
  const { bar, text } = sizeMap[size];

  const getColor = () => {
    if (percent >= 90) return "bg-success";
    if (percent >= 70) return "bg-warning";
    if (percent >= 50) return "bg-orange-500";
    return "bg-destructive";
  };

  return (
    <div className={cn("space-y-1", className)}>
      {!hideLabel && (
        <div className={cn("flex justify-between", text)}>
          {label && <span className="text-muted-foreground">{label}</span>}
          <span
            className={cn(
              "font-semibold",
              percent >= 90 && "text-success",
              percent >= 70 && percent < 90 && "text-warning",
              percent < 70 && "text-destructive"
            )}
          >
            {percent}%
          </span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-secondary overflow-hidden", bar)}>
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", getColor())}
          style={{ width: `${Math.max(percent, 3)}%` }}
        />
      </div>
    </div>
  );
}
