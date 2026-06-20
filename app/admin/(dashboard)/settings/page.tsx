"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminCsrf } from "@/lib/hooks/useAdminCsrf";

export default function AdminSettingsPage() {
  const { adminFetch } = useAdminCsrf();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [disablePassword, setDisablePassword] = React.useState("");
  const [status, setStatus] = React.useState("");

  async function changePassword() {
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
  }

  async function disable2FA() {
    const res = await adminFetch("/api/admin/auth/disable-2fa", {
      method: "POST",
      body: JSON.stringify({ password: disablePassword, code })
    });
    const data = await res.json();
    setStatus(res.ok ? "2FA disabled." : data.error ?? "Failed");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Security and account settings.</p>
      </div>

      <Card className="glass border-white/5 max-w-lg">
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Minimum 8 characters with upper, lower, number, and symbol.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label>Current password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>New password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <Button onClick={() => void changePassword()}>Update password</Button>
        </CardContent>
      </Card>

      <Card className="glass border-white/5 max-w-lg">
        <CardHeader>
          <CardTitle>Disable 2FA</CardTitle>
          <CardDescription>Requires password and current authenticator code.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label>Password</Label>
            <Input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>2FA code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
          </div>
          <Button variant="destructive" onClick={() => void disable2FA()}>
            Disable 2FA
          </Button>
        </CardContent>
      </Card>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
