"use server";

import { cookies } from "next/headers";
import { constantTimeCompare } from "@/lib/security";

export async function verifyDevPassword(password: string) {
  const configuredPassword = process.env.DEV_GATE_PASSWORD || "attomatti";
  
  // Use constant-time comparison to prevent timing attacks
  if (constantTimeCompare(password.trim(), configuredPassword)) {
    // We set the cookie. Note: in Next.js 16 app router, setting a cookie requires await cookies() if it's dynamic
    const cookieStore = await cookies();
    cookieStore.set("attomatti_dev_access", "1", {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
      httpOnly: false, // The client component might check document.cookie directly on mount
    });
    return { success: true };
  }
  
  return { success: false, error: "Password errata. Riprova." };
}
