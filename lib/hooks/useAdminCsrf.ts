"use client";

import * as React from "react";

let cachedCsrf: string | null = null;

export function useAdminCsrf() {
  const [csrfToken, setCsrfToken] = React.useState<string | null>(cachedCsrf);

  React.useEffect(() => {
    if (cachedCsrf) return;
    void fetch("/api/admin/auth/csrf")
      .then((r) => r.json())
      .then((d: { csrfToken?: string }) => {
        if (d.csrfToken) {
          cachedCsrf = d.csrfToken;
          setCsrfToken(d.csrfToken);
        }
      })
      .catch(() => null);
  }, []);

  const refreshCsrf = React.useCallback(async () => {
    const res = await fetch("/api/admin/auth/csrf");
    const data = (await res.json()) as { csrfToken?: string };
    if (data.csrfToken) {
      cachedCsrf = data.csrfToken;
      setCsrfToken(data.csrfToken);
    }
    return data.csrfToken ?? null;
  }, []);

  const adminFetch = React.useCallback(
    async (input: string, init: RequestInit = {}) => {
      let token = csrfToken ?? cachedCsrf;
      if (!token) token = await refreshCsrf();
      const headers = new Headers(init.headers);
      if (token) headers.set("x-csrf-token", token);
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      return fetch(input, { ...init, headers, credentials: "same-origin" });
    },
    [csrfToken, refreshCsrf]
  );

  return { csrfToken, refreshCsrf, adminFetch };
}
