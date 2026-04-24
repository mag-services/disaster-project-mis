import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { LuUser } from "react-icons/lu";
import { colors } from "@/tokens";
import { useUiStore } from "@/store/ui-store";
import { useLockStore } from "@/store/lock-store";
import { toast } from "@/utils/toast";
import { canAccessDataEntry, getUserRole } from "@/lib/rbac";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LuClipboardList,
  LuLock,
  LuLockKeyhole,
  LuLogOut,
  LuShare2,
} from "react-icons/lu";

const API_HOST = import.meta.env.VITE_API_HOST ?? "";

function avatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return `${API_HOST.replace(/\/$/, "")}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
}

export interface UserAvatarProps {
  className?: string;
}

/**
 * Circular user avatar — image from auth store or fallback glyph.
 */
export function UserAvatar({ className }: UserAvatarProps) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setDataEntryPageOpen = useUiStore((s) => s.setDataEntryPageOpen);
  const { pinHash, lock, resetLockOnLogout } = useLockStore();
  const role = getUserRole(user);
  const url = avatarUrl(user?.avatar);
  const initial = user?.username?.charAt(0)?.toUpperCase();

  const content = url ? (
    <img src={url} alt="" className="size-full object-cover" />
  ) : initial ? (
    <span
      className="flex size-full items-center justify-center text-xs font-semibold"
      style={{
        color: colors.accent.blue,
        fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
      }}
    >
      {initial}
    </span>
  ) : (
    <span className="flex size-full items-center justify-center">
      <LuUser className="size-4" style={{ color: colors.text.muted }} />
    </span>
  );

  const handleLogout = () => {
    resetLockOnLogout();
    clearAuth();
  };

  const handleShare = async () => {
    const urlToShare = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(urlToShare);
      toast.success("Link copied", "Current page link copied to clipboard.");
    } catch {
      toast.error("Share failed", "Could not copy link to clipboard.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          "flex size-8 shrink-0 overflow-hidden rounded-full border transition-opacity hover:opacity-90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D90FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--drmis-bg-surface)]",
          className,
        )}
        style={{
          backgroundColor: colors.bg.elevated,
          borderColor: colors.border.strong,
        }}
        aria-label={user?.username ? `Account: ${user.username}` : "Account"}
      >
        {content}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          {user?.username}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canAccessDataEntry(role) && (
          <DropdownMenuItem onSelect={() => setDataEntryPageOpen(true)}>
            <LuClipboardList className="size-4" />
            Data Entry
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => void handleShare()}>
          <LuShare2 className="size-4" />
          Share
        </DropdownMenuItem>
        {pinHash && (
          <DropdownMenuItem onSelect={() => lock()}>
            <LuLock className="size-4" />
            Lock screen
          </DropdownMenuItem>
        )}
        {user?.is_staff && (
          <DropdownMenuItem asChild>
            <a
              href={`${import.meta.env.VITE_API_HOST ?? ""}/admin/`}
              className="flex items-center gap-2 text-inherit no-underline"
            >
              <LuLockKeyhole className="size-4" />
              Admin
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LuLogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
