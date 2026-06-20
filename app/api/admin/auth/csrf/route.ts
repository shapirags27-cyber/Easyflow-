import { NextResponse } from "next/server";
import { createCsrfToken } from "@/lib/server/admin/csrf";

export async function GET() {
  const csrfToken = await createCsrfToken();
  return NextResponse.json({ csrfToken });
}
