import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendContactNotification } from "@/lib/email/brevo";
import { rateLimit } from "@/lib/security/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please provide a valid email address"),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(150),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(3000),
  hp: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Sliding window rate limit: max 5 contact submissions per hour per IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rl = rateLimit(`contact:${clientIp}`, { limit: 5, windowMs: 3_600_000 });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: "Too many contact submissions. Please wait before submitting again." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await req.json();

    // 2. Honeypot check: reject bot submissions silently
    if (body.hp || body.website_url) {
      return NextResponse.json({ success: true, message: "Your message has been sent successfully via Brevo!" });
    }

    const result = contactSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Invalid form data";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const { name, email, subject, message } = result.data;

    const emailResult = await sendContactNotification({
      senderName: name,
      senderEmail: email,
      subject,
      message,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error,
          ipBlocked: emailResult.ipBlocked,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully via Brevo!",
      messageId: emailResult.messageId,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error processing contact request.",
      },
      { status: 500 }
    );
  }
}
