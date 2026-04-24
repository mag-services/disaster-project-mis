/**
 * Settings — shell-level page (replaces the ProfilePage full-screen overlay).
 * Three tabs: Profile, Security, Appearance.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import {
  LuUser,
  LuMail,
  LuCamera,
  LuKeyRound,
  LuLock,
  LuShield,
  LuSun,
  LuMoon,
  LuMonitor,
  LuSave,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { useLockStore, AUTO_LOCK_OPTIONS, type AutoLockMinutes } from "@/store/lock-store";
import { useColorMode } from "@/components/ui/color-mode";
import * as profileApi from "@/api/profile";
import { setupEmailOtp, disable2fa, getCurrentUser } from "@/api/auth";
import { toast } from "@/utils/toast";
import { colors } from "@/tokens";
import { cn } from "@/lib/utils";

const API_HOST = import.meta.env.VITE_API_HOST ?? "";

function avatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return `${API_HOST.replace(/\/$/, "")}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: colors.border.default, backgroundColor: colors.bg.surface }}
    >
      <div
        className="border-b px-5 py-4"
        style={{ borderColor: colors.border.default, backgroundColor: colors.bg.elevated }}
      >
        <h2
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: colors.text.primary }}
        >
          {icon}
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs" style={{ color: colors.text.muted }}>
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4 p-5">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Profile
// ─────────────────────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    setFirstName(user?.first_name ?? "");
    setLastName(user?.last_name ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => {});
  }, [setUser]);

  const profileDirty =
    firstName !== (user?.first_name ?? "") ||
    lastName !== (user?.last_name ?? "") ||
    email !== (user?.email ?? "");

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const updated = await profileApi.updateProfile({
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
      });
      setUser(updated);
      toast.success("Profile updated", "Your changes have been saved.");
    } catch (e) {
      toast.error("Failed to update profile", String(e instanceof Error ? e.message : e));
    } finally {
      setIsSaving(false);
    }
  }, [firstName, lastName, email, setUser]);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Invalid format", "Use JPEG, PNG, GIF or WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", "Maximum size is 5 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(typeof reader.result === "string" ? reader.result : null);
      setPendingAvatarFile(file);
    };
    reader.onerror = () => {
      toast.error("Preview failed", "Could not read selected image.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleAvatarUpload = useCallback(async () => {
    if (!pendingAvatarFile) return;
    setIsUploadingAvatar(true);
    try {
      const updated = await profileApi.uploadAvatar(pendingAvatarFile);
      setUser(updated);
      setPendingAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Photo saved", "Your profile picture has been updated.");
    } catch (e) {
      toast.error("Failed to save photo", String(e instanceof Error ? e.message : e));
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [pendingAvatarFile, setUser]);

  const avatarSrc = avatarPreview || avatarUrl(user?.avatar ?? null);

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar */}
      <SectionCard
        title="Profile picture"
        description="Upload a photo to personalize your account."
        icon={<LuCamera className="size-4" style={{ color: colors.accent.blue }} />}
      >
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors hover:border-blue-500/50"
            style={{ borderColor: colors.border.strong, backgroundColor: colors.bg.elevated }}
            aria-label="Change profile picture"
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="size-full object-cover" />
            ) : (
              <LuCamera className="size-7" style={{ color: colors.text.muted }} />
            )}
          </button>
          <div className="flex flex-col gap-1.5">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Change photo
            </Button>
            <p className="text-xs" style={{ color: colors.text.muted }}>
              JPEG, PNG, GIF or WebP · Max 5 MB
            </p>
            {pendingAvatarFile && (
              <p className="text-xs" style={{ color: colors.text.secondary }}>
                Selected: {pendingAvatarFile.name}
              </p>
            )}
            {pendingAvatarFile && (
              <div className="mt-1 flex gap-2">
                <Button size="sm" onClick={handleAvatarUpload} disabled={isUploadingAvatar}>
                  <LuSave className="size-3.5" />
                  {isUploadingAvatar ? "Saving…" : "Save photo"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPendingAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  disabled={isUploadingAvatar}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </SectionCard>

      {/* Personal info */}
      <SectionCard
        title="Personal information"
        description="Update your display name and email address."
        icon={<LuUser className="size-4" style={{ color: colors.accent.blue }} />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="first-name">First name</Label>
            <Input
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="last-name">Last name</Label>
            <Input
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <LuMail className="size-3.5" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <p className="text-xs" style={{ color: colors.text.muted }}>
          Username:{" "}
          <span className="font-mono font-medium" style={{ color: colors.text.secondary }}>
            {user?.username}
          </span>
        </p>
        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} disabled={!profileDirty || isSaving} size="sm">
            <LuSave className="size-3.5" />
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Security
// ─────────────────────────────────────────────────────────────────────────────

function SecurityTab() {
  const { user, setUser } = useAuthStore();
  const { autoLockTimeoutMinutes, setAutoLockTimeout, setPin, pinHash } = useLockStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

  const [disable2faPassword, setDisable2faPassword] = useState("");
  const [isDisabling2fa, setIsDisabling2fa] = useState(false);
  const [isEnabling2fa, setIsEnabling2fa] = useState(false);

  const handleChangePassword = useCallback(async () => {
    if (newPassword.length < 8) {
      toast.error("Password too short", "Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match", "Please enter the same password in both fields.");
      return;
    }
    setIsChangingPassword(true);
    try {
      await profileApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed", "Your password has been updated.");
    } catch (e) {
      toast.error("Failed to change password", String(e instanceof Error ? e.message : e));
    } finally {
      setIsChangingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const handleSavePin = useCallback(async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error("Invalid PIN", "PIN must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs don't match", "Please enter the same PIN in both fields.");
      return;
    }
    setIsSavingPin(true);
    try {
      await setPin(newPin);
      setNewPin("");
      setConfirmPin("");
      toast.success("PIN saved", "Your unlock PIN has been set.");
    } catch {
      toast.error("Failed to save PIN", "Please try again.");
    } finally {
      setIsSavingPin(false);
    }
  }, [newPin, confirmPin, setPin]);

  const handleEnableEmailOtp = useCallback(async () => {
    if (!user?.email) {
      toast.error("Email required", "Add an email address in the Profile tab before enabling 2FA.");
      return;
    }
    setIsEnabling2fa(true);
    try {
      const result = await setupEmailOtp();
      setUser?.({ ...user!, mfa_enabled: result.mfa_enabled, mfa_method: (result.mfa_method as "" | "email" | "totp") || undefined });
      toast.success("2FA enabled", "A verification code will be sent to your email on each login.");
    } catch (e) {
      toast.error("Failed to enable 2FA", String(e instanceof Error ? e.message : e));
    } finally {
      setIsEnabling2fa(false);
    }
  }, [user, setUser]);

  const handleDisable2fa = useCallback(async () => {
    if (!disable2faPassword) {
      toast.error("Password required", "Enter your password to disable 2FA.");
      return;
    }
    setIsDisabling2fa(true);
    try {
      await disable2fa(disable2faPassword);
      setUser?.({ ...user!, mfa_enabled: false, mfa_method: "" });
      setDisable2faPassword("");
      toast.success("2FA disabled", "You can now sign in with password only.");
    } catch (e) {
      toast.error("Failed to disable 2FA", String(e instanceof Error ? e.message : e));
    } finally {
      setIsDisabling2fa(false);
    }
  }, [user, setUser, disable2faPassword]);

  const handleTimeoutChange = useCallback(
    (value: string) => {
      const minutes = Number(value) as AutoLockMinutes;
      setAutoLockTimeout(minutes);
      if (minutes > 0 && !pinHash) {
        toast.warning("Set a PIN first", "Enable auto-lock by setting a 4-digit PIN below.");
      } else if (minutes > 0) {
        toast.success("Auto-lock enabled", `Screen will lock after ${minutes} minute${minutes === 1 ? "" : "s"} of inactivity.`);
      } else {
        toast.success("Auto-lock disabled", "Screen will not lock automatically.");
      }
    },
    [setAutoLockTimeout, pinHash],
  );

  const canSavePin = newPin.length === 4 && confirmPin.length === 4 && newPin === confirmPin;

  return (
    <div className="flex flex-col gap-5">
      {/* Password */}
      <SectionCard
        title="Change password"
        description="Update your password to keep your account secure."
        icon={<LuKeyRound className="size-4" style={{ color: colors.accent.amber }} />}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword || isChangingPassword}
          >
            {isChangingPassword ? "Updating…" : "Update password"}
          </Button>
        </div>
      </SectionCard>

      {/* Two-factor auth */}
      <SectionCard
        title="Two-factor authentication"
        description={
          user?.otp_required_for_all_logins
            ? "Login verification is required for all users by your administrator."
            : "Add an extra layer of security by requiring a code sent to your email on sign-in."
        }
        icon={<LuShield className="size-4" style={{ color: colors.accent.green }} />}
      >
        {user?.otp_required_for_all_logins ? (
          <p className="text-sm" style={{ color: colors.text.muted }}>
            OTP is enforced globally. Contact your administrator to change this setting.
          </p>
        ) : user?.mfa_enabled ? (
          <div className="flex flex-col gap-3">
            <div
              className="flex items-center gap-2 rounded-lg border px-3 py-2.5"
              style={{ borderColor: colors.accent.green + "40", backgroundColor: colors.accent.green + "10" }}
            >
              <LuShield className="size-4 shrink-0" style={{ color: colors.accent.green }} />
              <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                2FA is active
                {user.mfa_method === "email" && " (email code)"}
                {user.mfa_method === "totp" && " (authenticator app)"}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="disable-2fa-password">Enter your password to disable</Label>
              <Input
                id="disable-2fa-password"
                type="password"
                value={disable2faPassword}
                onChange={(e) => setDisable2faPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisable2fa}
                disabled={!disable2faPassword || isDisabling2fa}
              >
                {isDisabling2fa ? "Disabling…" : "Disable 2FA"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableEmailOtp}
              disabled={!user?.email || isEnabling2fa}
            >
              {isEnabling2fa ? "Enabling…" : "Enable email verification"}
            </Button>
            {!user?.email && (
              <p className="text-xs" style={{ color: colors.text.muted }}>
                Add an email address in the Profile tab before enabling 2FA.
              </p>
            )}
          </div>
        )}
      </SectionCard>

      {/* Auto-lock & PIN */}
      <SectionCard
        title="Session security"
        description="Configure auto-lock and unlock PIN for your session."
        icon={<LuLock className="size-4" style={{ color: colors.accent.blue }} />}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="auto-lock">Auto-lock after inactivity</Label>
          <Select value={String(autoLockTimeoutMinutes)} onValueChange={handleTimeoutChange}>
            <SelectTrigger id="auto-lock" className="w-full max-w-xs">
              <SelectValue placeholder="Select timeout" />
            </SelectTrigger>
            <SelectContent>
              {AUTO_LOCK_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs" style={{ color: colors.text.muted }}>
            When idle, the screen locks instead of logging out. Enter your PIN to resume.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Unlock PIN {pinHash ? "(change)" : "(required for auto-lock)"}</Label>
          <div className="flex gap-2">
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="••••"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-24 text-center font-mono"
              aria-label="New 4-digit PIN"
            />
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="••••"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-24 text-center font-mono"
              aria-label="Confirm 4-digit PIN"
            />
          </div>
          <p className="text-xs" style={{ color: colors.text.muted }}>
            4 digits. Used to unlock the screen after auto-lock. Not sent to the server.
          </p>
          {(newPin || confirmPin) && (
            <div className="flex justify-start pt-1">
              <Button size="sm" onClick={handleSavePin} disabled={!canSavePin || isSavingPin}>
                <LuSave className="size-3.5" />
                {isSavingPin ? "Saving…" : "Save PIN"}
              </Button>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Appearance
// ─────────────────────────────────────────────────────────────────────────────

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: <LuSun className="size-5" /> },
  { value: "dark", label: "Dark", icon: <LuMoon className="size-5" /> },
  { value: "system", label: "System", icon: <LuMonitor className="size-5" /> },
] as const;

function AppearanceTab() {
  const { colorMode, setColorMode } = useColorMode();

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="Theme"
        description="Choose how DRMIS looks. System follows your OS preference."
        icon={<LuSun className="size-4" style={{ color: colors.accent.amber }} />}
      >
        <div className="flex flex-wrap gap-3">
          {THEME_OPTIONS.map(({ value, label, icon }) => {
            const active = colorMode === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setColorMode(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border px-6 py-4 transition-all",
                  active
                    ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40"
                    : "hover:bg-muted/40",
                )}
                style={
                  active
                    ? undefined
                    : { borderColor: colors.border.default }
                }
                aria-pressed={active}
              >
                <span
                  style={{
                    color: active ? colors.accent.blue : colors.text.muted,
                  }}
                >
                  {icon}
                </span>
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{
                    fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
                    color: active ? colors.accent.blue : colors.text.secondary,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

type TabId = "profile" | "security" | "appearance";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <LuUser className="size-3.5" /> },
  { id: "security", label: "Security", icon: <LuShield className="size-3.5" /> },
  { id: "appearance", label: "Appearance", icon: <LuSun className="size-3.5" /> },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div
      className="grid min-h-0 min-w-0 gap-6"
      style={{ gridTemplateRows: "auto auto minmax(0,1fr)" }}
    >
      {/* Header */}
      <header className="min-w-0">
        <h1
          className="text-[22px] font-bold leading-tight tracking-tight"
          style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif", fontWeight: 700, color: colors.text.primary }}
        >
          Settings
        </h1>
        <p
          className="mt-1 text-xs"
          style={{ color: colors.text.muted, fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace" }}
        >
          Manage your profile, security, and appearance preferences
        </p>
      </header>

      {/* Tab nav */}
      <div
        className="flex items-center gap-1 rounded-xl border p-1"
        style={{ borderColor: colors.border.default, backgroundColor: colors.bg.surface }}
        role="tablist"
        aria-label="Settings sections"
      >
        {TABS.map(({ id, label, icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(id)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              style={
                active
                  ? { backgroundColor: colors.bg.elevated, color: colors.text.primary }
                  : { color: colors.text.muted }
              }
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content — max-width for readability */}
      <div className="min-h-0 min-w-0">
        <div className="max-w-2xl">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "appearance" && <AppearanceTab />}
        </div>
      </div>
    </div>
  );
}
