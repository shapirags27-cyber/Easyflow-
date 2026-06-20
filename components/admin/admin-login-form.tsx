"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/layout/logo";

type Step = "credentials" | "2fa" | "setup2fa";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin/dashboard";

  const [step, setStep] = React.useState<Step>("credentials");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[] | null>(null);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = (await res.json()) as {
        error?: string;
        requires2FA?: boolean;
        requires2FASetup?: boolean;
      };
      if (!res.ok) throw new Error(data.error ?? "Login failed");

      if (data.requires2FASetup) {
        const setupRes = await fetch("/api/admin/auth/setup-2fa", { method: "POST" });
        const setupData = (await setupRes.json()) as { qrDataUrl?: string; error?: string };
        if (!setupRes.ok) throw new Error(setupData.error ?? "2FA setup failed");
        setQrDataUrl(setupData.qrDataUrl ?? null);
        setStep("setup2fa");
        return;
      }

      setStep("2fa");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2FA(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.replace(/\s/g, "") })
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSetup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/confirm-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.replace(/\s/g, "") })
      });
      const data = (await res.json()) as {
        error?: string;
        recoveryCodes?: string[];
        ok?: boolean;
      };
      if (!res.ok) throw new Error(data.error ?? "2FA confirmation failed");
      if (data.recoveryCodes) {
        setRecoveryCodes(data.recoveryCodes);
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(216_100%_50%/0.12),transparent_55%)]" />

      <div className="mb-8 flex items-center gap-3">
        <Logo size={40} priority />
        <div>
          <h1 className="text-xl font-bold">EasyFlow</h1>
          <p className="text-sm text-muted-foreground">Admin Portal</p>
        </div>
      </div>

      <Card className="glass w-full max-w-md border-white/10 glow-primary">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>
            {step === "credentials"
              ? "Admin Sign In"
              : step === "setup2fa"
                ? "Set Up Two-Factor Auth"
                : "Two-Factor Verification"}
          </CardTitle>
          <CardDescription>
            {step === "credentials"
              ? "Email and password required for admin access."
              : step === "setup2fa"
                ? "Scan the QR code with your authenticator app."
                : "Enter the 6-digit code from your authenticator app."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {recoveryCodes ? (
            <div className="space-y-4">
              <p className="text-sm text-amber-400">
                Save these recovery codes securely. Each can be used once if you lose your device.
              </p>
              <div className="rounded-lg border border-border bg-secondary/50 p-3 font-mono text-xs">
                {recoveryCodes.map((c) => (
                  <div key={c}>{c}</div>
                ))}
              </div>
              <Button className="w-full" onClick={() => router.push(next)}>
                Continue to dashboard
              </Button>
            </div>
          ) : step === "credentials" ? (
            <form onSubmit={handleCredentials} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@easyflow.io"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Continue"}
              </Button>
            </form>
          ) : step === "setup2fa" ? (
            <form onSubmit={handleConfirmSetup} className="space-y-4">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="2FA QR code" className="mx-auto rounded-lg border" />
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying…" : "Enable 2FA & Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">2FA Code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying…" : "Verify & Sign In"}
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep("credentials");
                  setCode("");
                  setError("");
                }}
              >
                Back to sign in
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Platform administrators only.{" "}
            <Link href="/admin" className="text-primary hover:underline">
              Back to admin portal
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
