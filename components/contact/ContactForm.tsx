"use client";

import * as React from "react";

export function ContactForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [ipBlocked, setIpBlocked] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIpBlocked(false);

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg("Please fill out all fields before submitting.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Failed to send email message.");
        if (data.ipBlocked) {
          setIpBlocked(true);
        }
      } else {
        setSuccessMsg(data.message || "Message sent successfully!");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }
    } catch {
      setErrorMsg("Network error connecting to the contact API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface rounded-xl p-6 sm:p-8 flex flex-col gap-5 border border-border-default shadow-xl">
      {successMsg && (
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm flex items-start gap-3">
          <span className="text-lg">✓</span>
          <div>
            <p className="font-semibold">{successMsg}</p>
            <p className="text-xs text-text-secondary mt-1">We will respond to your email as soon as possible.</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <span className="font-bold text-base">⚠</span>
            <div className="flex-1">
              <p className="font-semibold text-red-300">Message Dispatch Failed</p>
              <p className="text-xs mt-1 leading-relaxed text-red-200/90">{errorMsg}</p>
            </div>
          </div>
          {ipBlocked && (
            <div className="mt-2 pt-2 border-t border-red-500/20 text-xs text-red-200">
              <p className="font-semibold">How to fix in Brevo Dashboard:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1 text-red-200/80">
                <li>Log in to your <a href="https://app.brevo.com/security/authorised_ips" target="_blank" rel="noopener noreferrer" className="underline font-bold text-white hover:text-accent">Brevo Security Settings</a>.</li>
                <li>Disable &quot;Authorized IPs&quot; or add your server / current IP address.</li>
                <li>Save changes and try again.</li>
              </ol>
            </div>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
            Your Name <span className="text-accent">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-3.5 py-2.5 rounded-lg bg-bg-elevated border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
            Your Email <span className="text-accent">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="w-full px-3.5 py-2.5 rounded-lg bg-bg-elevated border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
          Subject <span className="text-accent">*</span>
        </label>
        <input
          id="contact-subject"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Question about PUBG Optimization Guide"
          className="w-full px-3.5 py-2.5 rounded-lg bg-bg-elevated border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
          Message <span className="text-accent">*</span>
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your feedback, inquiry, or partnership proposal..."
          className="w-full px-3.5 py-2.5 rounded-lg bg-bg-elevated border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-accent text-bg-base font-semibold text-sm hover:bg-accent-dim transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-accent/20"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-bg-base" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Dispatching via Brevo...</span>
          </>
        ) : (
          <>
            <span>Send Message</span>
            <span aria-hidden="true">→</span>
          </>
        )}
      </button>
    </form>
  );
}
