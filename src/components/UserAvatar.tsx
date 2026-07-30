// ============================================================
// TrafficWatch AI — UserAvatar Component
// ============================================================
// Domain-specific avatar wrapper with role badge, badge number,
// and status indicator. Uses the generic Avatar UI primitive.
// ============================================================

import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Shield, User, ShieldCheck, Search } from "lucide-react";

interface UserAvatarProps {
  /** User's full name for initials fallback */
  fullName: string;
  /** Avatar image URL */
  avatarUrl?: string | null;
  /** Badge number (e.g. OFC-001) */
  badgeNumber?: string;
  /** User role (e.g. traffic_officer, system_administrator) */
  role?: string;
  /** Online status indicator */
  online?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Optional click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
  /** Show tooltip with full details on hover */
  showTooltip?: boolean;
  /** Show role badge */
  showBadge?: boolean;
}

const SIZE_MAP = {
  sm: { avatar: "w-7 h-7", text: "text-[10px]", icon: "w-3 h-3", dot: "w-2 h-2" },
  md: { avatar: "w-9 h-9", text: "text-xs", icon: "w-4 h-4", dot: "w-2.5 h-2.5" },
  lg: { avatar: "w-11 h-11", text: "text-sm", icon: "w-5 h-5", dot: "w-3 h-3" },
  xl: { avatar: "w-14 h-14", text: "text-base", icon: "w-6 h-6", dot: "w-3.5 h-3.5" },
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  system_administrator: ShieldCheck,
  national_commissioner: Shield,
  regional_commander: Shield,
  traffic_commander: Shield,
  police_supervisor: Shield,
  traffic_officer: User,
  investigator: Search,
  evidence_officer: Search,
  system_auditor: ShieldCheck,
  citizen: User,
};

const ROLE_COLORS: Record<string, string> = {
  system_administrator: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  national_commissioner: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  regional_commander: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  traffic_commander: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  police_supervisor: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  traffic_officer: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  investigator: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  evidence_officer: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  system_auditor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  citizen: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getRoleLabel(role?: string): string {
  if (!role) return "";
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getFallbackColor(name: string): string {
  const colors = [
    "bg-blue-500/10 text-blue-600",
    "bg-emerald-500/10 text-emerald-600",
    "bg-violet-500/10 text-violet-600",
    "bg-amber-500/10 text-amber-600",
    "bg-rose-500/10 text-rose-600",
    "bg-cyan-500/10 text-cyan-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function UserAvatar({
  fullName,
  avatarUrl,
  badgeNumber,
  role,
  online,
  size = "md",
  onClick,
  className,
  showTooltip = true,
  showBadge = true,
}: UserAvatarProps) {
  const sizeClass = SIZE_MAP[size];
  const initials = getInitials(fullName);
  const RoleIcon = role ? ROLE_ICONS[role] || User : User;
  const fallbackColor = getFallbackColor(fullName);

  const avatarContent = (
    <div
      className={cn("relative inline-flex shrink-0", onClick && "cursor-pointer", className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <Avatar className={cn(sizeClass.avatar, "ring-2 ring-background")}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={fullName} />
        ) : null}
        <AvatarFallback className={cn(sizeClass.text, "font-semibold", fallbackColor)}>
          {initials || <RoleIcon className={sizeClass.icon} />}
        </AvatarFallback>
      </Avatar>

      {/* Online dot */}
      {online !== undefined && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background",
            sizeClass.dot,
            online ? "bg-emerald-500" : "bg-muted-foreground/40"
          )}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </div>
  );

  if (!showTooltip) return avatarContent;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={400}>
        <TooltipTrigger asChild>{avatarContent}</TooltipTrigger>
        <TooltipContent side="bottom" className="p-3 max-w-[220px]">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">{fullName}</p>
            {badgeNumber && (
              <p className="text-[11px] font-mono text-muted-foreground">
                #{badgeNumber}
              </p>
            )}
            {role && (
              <div className="flex items-center gap-1.5">
                <RoleIcon className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {getRoleLabel(role)}
                </span>
              </div>
            )}
            {showBadge && role && (
              <Badge
                variant="outline"
                className={cn("text-[9px] px-1.5 py-0 h-4", ROLE_COLORS[role] || "bg-secondary text-muted-foreground")}
              >
                {getRoleLabel(role)}
              </Badge>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Role badge variant for standalone use */
export function UserRoleBadge({ role, className }: { role: string; className?: string }) {
  const RoleIcon = ROLE_ICONS[role] || User;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 px-2 py-0.5 text-[10px] font-medium h-5",
        ROLE_COLORS[role] || "bg-secondary text-muted-foreground",
        className
      )}
    >
      <RoleIcon className="w-3 h-3" />
      {getRoleLabel(role)}
    </Badge>
  );
}
