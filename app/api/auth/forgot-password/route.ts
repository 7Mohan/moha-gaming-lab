/**
 * app/api/auth/forgot-password/route.ts
 * ──────────────────────────────────────────────────────────────────────
 * Custom forgot-password endpoint.
 * 1. Uses Supabase Admin API to generate a secure password-reset link.
 * 2. Delivers that link via Brevo transactional email (not Supabase SMTP).
 *
 * This bypasses the need to configure Supabase's SMTP settings —
 * Brevo (already integrated) handles delivery.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { sendEmailWithBrevo } from "@/lib/email/brevo";

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role is not configured.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid email." },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      `${req.headers.get("x-forwarded-proto") ?? "http"}://${req.headers.get("host")}`;

    const redirectTo = `${siteUrl}/auth/callback?redirect=/reset-password`;

    // Generate the reset link via Supabase Admin (token is managed by Supabase)
    const supabase = getAdminClient();
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error) {
      // If user not found, still return 200 (security: don't reveal if email exists)
      console.error("[forgot-password] Supabase generateLink error:", error.message);
      return NextResponse.json({ success: true }); // Silent — don't expose user-existence
    }

    const resetLink = data?.properties?.action_link || data?.properties?.email_otp;
    if (!resetLink) {
      return NextResponse.json({ success: true }); // Safe fallback
    }

    // Build a branded Brevo email
    const senderName = process.env.BREVO_SENDER_NAME || "Moha Gaming Lab";
    const senderEmail = process.env.BREVO_SENDER_EMAIL || "4mohabashir@gmail.com";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                   background-color: #0d1117; color: #e6edf3; margin: 0; padding: 24px; }
            .card { background-color: #161b22; border: 1px solid #30363d; border-radius: 12px;
                    padding: 32px; max-width: 560px; margin: 0 auto; box-shadow: 0 8px 32px rgba(0,0,0,0.6); }
            .logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 24px; text-decoration: none; }
            .logo-icon { width: 44px; height: 44px; border-radius: 10px;
                         background: linear-gradient(135deg, rgba(0,229,160,0.25), rgba(0,229,160,0.08));
                         border: 1px solid rgba(0,229,160,0.35); display: flex; align-items: center; justify-content: center;
                         font-family: monospace; font-weight: 900; font-size: 20px; color: #00E5A0; }
            .logo-text { font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: 0.05em; }
            .logo-text span { color: #00E5A0; }
            h1 { color: #ffffff; font-size: 22px; margin: 0 0 8px; }
            p { color: #8b949e; font-size: 14px; line-height: 1.6; margin: 0 0 20px; }
            .btn { display: inline-block; padding: 13px 28px; background: linear-gradient(135deg, #059669, #0d9488);
                   color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700;
                   font-size: 14px; letter-spacing: 0.03em; box-shadow: 0 4px 16px rgba(5,150,105,0.35); }
            .divider { border: none; border-top: 1px solid #21262d; margin: 24px 0; }
            .link-fallback { font-size: 12px; color: #6e7681; word-break: break-all; }
            .link-fallback a { color: #00E5A0; }
            .warning { background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.25);
                       border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #ca8a04; margin-top: 20px; }
            .footer { text-align: center; font-size: 11px; color: #484f58; margin-top: 28px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">
              <div class="logo-icon">M</div>
              <div class="logo-text">MOHA<span>.LAB</span></div>
            </div>
            <h1>Reset Your Password</h1>
            <p>We received a request to reset the password for your Moha Gaming Lab account associated with <strong style="color:#f0f6fc">${email}</strong>.</p>
            <p>Click the button below to choose a new password. This link is valid for <strong style="color:#f0f6fc">1 hour</strong>.</p>
            <a href="${resetLink}" class="btn">🔑 Reset My Password</a>
            <hr class="divider">
            <p class="link-fallback">
              Button not working? Copy and paste this link into your browser:<br>
              <a href="${resetLink}">${resetLink}</a>
            </p>
            <div class="warning">
              ⚠️ If you did not request a password reset, you can safely ignore this email. Your account remains secure.
            </div>
          </div>
          <div class="footer">
            Moha Gaming Lab · Sent securely via Brevo · This link expires in 1 hour
          </div>
        </body>
      </html>
    `;

    const result = await sendEmailWithBrevo({
      to: [{ email, name: email.split("@")[0] }],
      sender: { email: senderEmail, name: senderName },
      subject: `Reset your Moha Gaming Lab password`,
      htmlContent,
      textContent: `Reset your Moha Gaming Lab password\n\nClick this link to reset your password:\n${resetLink}\n\nThis link expires in 1 hour. If you didn't request a reset, ignore this email.`,
      tags: ["password-reset", "auth"],
    });

    if (!result.success) {
      console.error("[forgot-password] Brevo delivery error:", result.error);
      if (result.ipBlocked) {
        return NextResponse.json(
          {
            success: false,
            error:
              result.error ||
              "Brevo IP Security Restriction: Please visit https://app.brevo.com/security/authorised_ips to authorize your IP or disable IP restrictions.",
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send reset email. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[forgot-password] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}
