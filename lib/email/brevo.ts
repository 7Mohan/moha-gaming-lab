/**
 * lib/email/brevo.ts
 * ────────────────────────────────────────────────────────────────
 * Production-ready Brevo (formerly Sendinblue) Transactional Email Client.
 * Uses Brevo v3 REST API (POST https://api.brevo.com/v3/smtp/email).
 * 
 * Supports:
 * - Transactional email dispatch (contact forms, notifications, alerts)
 * - Auto-detection of Brevo IP whitelisting errors with actionable instructions
 * - Clean HTML email templating with Moha Gaming Lab branding
 */

import { z } from "zod";

const emailRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export interface SendEmailOptions {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: { email: string; name?: string };
  sender?: { email: string; name?: string };
  tags?: string[];
}

export interface BrevoResult {
  success: boolean;
  messageId?: string;
  error?: string;
  ipBlocked?: boolean;
}

/**
 * Sends a transactional email using the Brevo REST v3 API.
 */
export async function sendEmailWithBrevo(options: SendEmailOptions): Promise<BrevoResult> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "BREVO_API_KEY is not configured in environment variables.",
    };
  }

  // Validate recipients
  for (const r of options.to) {
    const valid = emailRecipientSchema.safeParse(r);
    if (!valid.success) {
      return { success: false, error: `Invalid recipient email: ${r.email}` };
    }
  }

  const defaultSenderEmail = process.env.BREVO_SENDER_EMAIL || "4mohabashir@gmail.com";
  const defaultSenderName = process.env.BREVO_SENDER_NAME || "Moha Gaming Lab";

  const payload = {
    sender: options.sender || {
      email: defaultSenderEmail,
      name: defaultSenderName,
    },
    to: options.to,
    subject: options.subject,
    htmlContent: options.htmlContent,
    textContent: options.textContent,
    replyTo: options.replyTo,
    tags: options.tags,
  };

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg: string = data?.message || `Brevo HTTP error ${res.status}`;
      const isIpBlocked =
        errMsg.toLowerCase().includes("unrecognised ip") ||
        errMsg.toLowerCase().includes("authorised_ips");

      if (isIpBlocked) {
        return {
          success: false,
          ipBlocked: true,
          error:
            "Brevo IP Security Restriction: Brevo blocked this request because Authorized IPs are active. Please visit https://app.brevo.com/security/authorised_ips and disable IP restrictions or authorize current server IP.",
        };
      }

      return {
        success: false,
        error: errMsg,
      };
    }

    return {
      success: true,
      messageId: data?.messageId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error contacting Brevo API",
    };
  }
}

/**
 * Dispatches a contact form submission notification to the site administrator.
 */
export async function sendContactNotification(params: {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}): Promise<BrevoResult> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.BREVO_SENDER_EMAIL || "4mohabashir@gmail.com";

  const safeSubject = params.subject.trim() || "New Message from Moha Gaming Lab";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1117; color: #e6edf3; margin: 0; padding: 24px; }
          .card { background-color: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 28px; max-width: 600px; margin: 0 auto; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
          .badge { display: inline-block; background-color: rgba(0, 229, 160, 0.15); color: #00E5A0; border: 1px solid rgba(0, 229, 160, 0.3); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 3px 10px; border-radius: 6px; margin-bottom: 16px; }
          h2 { color: #ffffff; margin-top: 0; font-size: 20px; }
          .field { margin-bottom: 14px; }
          .label { font-size: 11px; text-transform: uppercase; color: #8b949e; letter-spacing: 0.08em; margin-bottom: 4px; }
          .val { font-size: 15px; color: #f0f6fc; }
          .msg-box { background-color: #0d1117; border: 1px solid #21262d; border-radius: 8px; padding: 16px; margin-top: 16px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #c9d1d9; }
          .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #6e7681; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Moha Gaming Lab · Contact</div>
          <h2>${escapeHtml(safeSubject)}</h2>
          <div class="field">
            <div class="label">Sender Name</div>
            <div class="val">${escapeHtml(params.senderName)}</div>
          </div>
          <div class="field">
            <div class="label">Sender Email</div>
            <div class="val"><a href="mailto:${escapeHtml(params.senderEmail)}" style="color: #00E5A0; text-decoration: none;">${escapeHtml(params.senderEmail)}</a></div>
          </div>
          <div class="label">Message</div>
          <div class="msg-box">${escapeHtml(params.message)}</div>
        </div>
        <div class="footer">
          Delivered securely via Brevo Transactional Email Engine · Moha Gaming Lab
        </div>
      </body>
    </html>
  `;

  return sendEmailWithBrevo({
    to: [{ email: adminEmail, name: "Moha Lab Admin" }],
    replyTo: { email: params.senderEmail, name: params.senderName },
    subject: `[Moha Gaming Lab] ${safeSubject}`,
    htmlContent: html,
    textContent: `From: ${params.senderName} (${params.senderEmail})\nSubject: ${safeSubject}\n\n${params.message}`,
    tags: ["contact-form", "website-notification"],
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
