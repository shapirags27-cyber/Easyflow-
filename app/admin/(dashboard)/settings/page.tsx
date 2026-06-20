"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAdminCsrf } from "@/lib/hooks/useAdminCsrf";

export default function AdminSettingsPage() {
  const { adminFetch } = useAdminCsrf();
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [disablePassword, setDisablePassword] = React.useState("");
  const [disableCode, setDisableCode] = React.useState("");
  const [confirmCode, setConfirmCode] = React.useState("");
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[] | null>(null);
  const [status, setStatus] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/auth/session");
        const data = (await res.json()) as {
          admin?: { twoFactorEnabled?: boolean };
        };
        if (res.ok) {
          setTwoFactorEnabled(Boolean(data.admin?.twoFactorEnabled));
        }
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  async function changePassword() {
    setBusy(true);
    setStatus("");
    const res = await adminFetch("/api/admin/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    setStatus(res.ok ? "Password updated." : data.error ?? "Failed");
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
    }
    setBusy(false);
  }

  async function start2FASetup() {
    setBusy(true);
    setStatus("");
    setRecoveryCodes(null);
    try {
      const res = await adminFetch("/api/admin/auth/setup-2fa", { method: "POST" });
      const data = (await res.json()) as { qrDataUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not start 2FA setup");
      setQrDataUrl(data.qrDataUrl ?? null);
      setConfirmCode("");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirm2FA() {
    setBusy(true);
    setStatus("");
    try {
      const res = await adminFetch("/api/admin/auth/confirm-2fa", {
        method: "POST",
        body: JSON.stringify({ code: confirmCode.replace(/\s/g, "") })
      });
      const data = (await res.json()) as {
        error?: string;
        recoveryCodes?: string[];
      };
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      setTwoFactorEnabled(true);
      setQrDataUrl(null);
      setConfirmCode("");
      if (data.recoveryCodes) setRecoveryCodes(data.recoveryCodes);
      setStatus("Two-factor authentication enabled.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Confirmation failed");
    } finally {
      setBusy(false);
    }
  }

  async function disable2FA() {
    setBusy(true);
    setStatus("");
    const res = await adminFetch("/api/admin/auth/disable-2fa", {
      method: "POST",
      body: JSON.stringify({ password: disablePassword, code: disableCode.replace(/\s/g, "") })
    });
    const data = await res.json();
    if (res.ok) {
      setTwoFactorEnabled(false);
      setDisablePassword("");
      setDisableCode("");
      setRecoveryCodes(null);
      setStatus("Two-factor authentication disabled.");
    } else {
      setStatus(data.error ?? "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account & Security</h1>
        <p className="text-sm text-muted-foreground">
          Manage your password and optional two-factor authentication.
        </p>
      </div>

      <Card className="glass max-w-lg border-white/5">
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Minimum 8 characters with upper, lower, number, and symbol.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label>Current password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>New password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <Button disabled={busy} onClick={() => void changePassword()}>
            Update password
          </Button>
        </CardContent>
      </Card>

      <Card className="glass max-w-lg border-white/5">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Two-factor authentication</CardTitle>
            {!loadingProfile ? (
              <Badge variant={twoFactorEnabled ? "success" : "outline"}>
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
            ) : null}
          </div>
          <CardDescription>
            Optional. Set up Google Authenticator, Authy, or Microsoft Authenticator from here.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {recoveryCodes ? (
            <div className="space-y-3">
              <p className="text-sm text-amber-400">
                Save these recovery codes. Each can be used once if you lose your device.
              </p>
              <div className="rounded-lg border border-border bg-secondary/50 p-3 font-mono text-xs">
                {recoveryCodes.map((c) => (
                  <div key={c}>{c}</div>
                ))}
              </div>
              <Button variant="secondary" onClick={() => setRecoveryCodes(null)}>
                Done
              </Button>
            </div>
          ) : twoFactorEnabled ? (
            <>
              <p className="text-sm text-muted-foreground">
                2FA is active on your account. To turn it off, confirm your password and a current code.
              </p>
              <div className="grid gap-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Authenticator code</Label>
                <Input
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  maxLength={6}
                  placeholder="000000"
                />
              </div>
              <Button variant="destructive" disabled={busy} onClick={() => void disable2FA()}>
                Disable 2FA
              </Button>
            </>
          ) : qrDataUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="2FA QR code" className="mx-auto rounded-lg border" />
              <div className="grid gap-2">
                <Label>Verification code</Label>
                <Input
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  maxLength={6}
                  placeholder="000000"
                  inputMode="numeric"
                />
              </div>
              <div className="flex gap-2">
                <Button disabled={busy || !confirmCode} onClick={() => void confirm2FA()}>
                  Confirm & enable
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => setQrDataUrl(null)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your admin account. Not required to sign in.
              </p>
              <Button disabled={busy || loadingProfile} onClick={() => void start2FASetup()}>
                Set up 2FA
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
