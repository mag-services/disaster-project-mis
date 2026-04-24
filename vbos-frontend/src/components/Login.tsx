import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import { login, verify2fa, resendEmailOtp } from "@/api/auth";
import { toast } from "@/utils/toast";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (step === "otp") otpInputRef.current?.focus();
  }, [step]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if ("token" in result) {
        const { getCurrentUser: fetchUser } = await import("@/api/auth");
        setAuth(result.token, null);
        const user = await fetchUser();
        setAuth(result.token, user);
        toast.success("Signed in successfully");
      } else if (result.requires_2fa && result.mfa_method === "email") {
        setTempToken(result.temp_token);
        setStep("otp");
        toast.success("Verification code sent to your email");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error("Sign in failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken || !otp.trim()) return;
    setError("");
    setIsLoading(true);

    try {
      const { token } = await verify2fa(tempToken, otp.trim());
      const { getCurrentUser: fetchUser } = await import("@/api/auth");
      setAuth(token, null);
      const user = await fetchUser();
      setAuth(token, user);
      toast.success("Signed in successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid or expired code";
      setError(message);
      toast.error("Verification failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!tempToken) return;
    setResending(true);
    setError("");
    try {
      await resendEmailOtp(tempToken);
      toast.success("Verification code sent to your email");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend code";
      setError(message);
      toast.error("Resend failed", message);
    } finally {
      setResending(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep("credentials");
    setTempToken(null);
    setOtp("");
    setError("");
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4"
      role="main"
      aria-label="Sign in"
    >
      <Card className="w-full max-w-[400px] rounded-xl border border-border/80 bg-card shadow-lg">
        {step === "credentials" ? (
          <form onSubmit={handleCredentialsSubmit}>
            <CardHeader className="space-y-6 text-center">
              <img
                src="/DRMISLogo.svg"
                alt="DRMIS Logo"
                className="mx-auto mb-4 size-16"
              />
              <h1 className="text-lg font-semibold text-foreground">
                Disaster Risk Management Information System
              </h1>
              <p className="text-sm text-muted-foreground">
                Secure access to vital information for disaster
                preparedness and response.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <FloatingLabelInput
                id="username"
                ref={usernameInputRef}
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                aria-invalid={!!error}
              />

              <div className="space-y-2">
                <FloatingLabelInput
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-invalid={!!error}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Signing in…" : "Sign in"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Contact your administrator if you need access.
              </p>
            </CardContent>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <CardHeader className="space-y-6 text-center">
              <img
                src="/DRMISLogo.svg"
                alt="DRMIS Logo"
                className="mx-auto mb-4 size-16"
              />
              <h1 className="text-lg font-semibold text-foreground">
                Enter verification code
              </h1>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to your email. Enter it below.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  autoComplete="one-time-code"
                  aria-invalid={!!error}
                  className="text-center text-lg tracking-[0.5em] font-mono"
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? "Verifying…" : "Verify"}
              </Button>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={handleResendOtp}
                  disabled={resending}
                >
                  {resending ? "Sending…" : "Resend code"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={handleBackToCredentials}
                >
                  ← Back to sign in
                </Button>
              </div>
            </CardContent>
          </form>
        )}
      </Card>
    </div>
  );
}
