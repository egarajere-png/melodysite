"use client";

import { FormEvent, useState } from "react";
import { MagneticButton } from "@/components/motion/MagneticButton";

const inputClasses =
  "w-full border-b border-aurum-obsidian/25 bg-transparent py-3 text-sm placeholder:text-aurum-obsidian/40 focus-visible:border-aurum-obsidian focus-visible:outline-none";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const name = String(formData.get("name") ?? "");
    const message = String(formData.get("message") ?? "");

    if (!name.trim() || !message.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please fill in your name, a valid email, and a message.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError(null);

    // TODO: wire to real inquiry endpoint / email service once backend is connected.
    // Simulated latency only — no data is sent anywhere yet.
    await new Promise((resolve) => setTimeout(resolve, 600));

    setStatus("success");
    e.currentTarget.reset();
  }

  if (status === "success") {
    return (
      <div className="border border-aurum-obsidian/15 px-6 py-10 text-center">
        <p className="font-display text-2xl">Thank you.</p>
        <p className="mt-2 text-sm text-aurum-obsidian/60">
          Your message has been received — we&apos;ll reply within 1–2 working days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1 block text-xs uppercase tracking-widest text-aurum-obsidian/50">
            Name
          </label>
          <input id="contact-name" name="name" type="text" required className={inputClasses} />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1 block text-xs uppercase tracking-widest text-aurum-obsidian/50">
            Email
          </label>
          <input id="contact-email" name="email" type="email" required className={inputClasses} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-phone" className="mb-1 block text-xs uppercase tracking-widest text-aurum-obsidian/50">
            Phone (optional)
          </label>
          <input id="contact-phone" name="phone" type="tel" className={inputClasses} />
        </div>
        <div>
          <label htmlFor="contact-subject" className="mb-1 block text-xs uppercase tracking-widest text-aurum-obsidian/50">
            Subject
          </label>
          <input id="contact-subject" name="subject" type="text" required className={inputClasses} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1 block text-xs uppercase tracking-widest text-aurum-obsidian/50">
          Message
        </label>
        <textarea id="contact-message" name="message" required rows={5} className={inputClasses} />
      </div>

      <p aria-live="polite" className="min-h-5 text-sm text-aurum-earth">
        {status === "error" && error}
      </p>

      <MagneticButton className="self-start">
        <button
          type="submit"
          disabled={status === "submitting"}
          data-cursor="expand"
          className="bg-aurum-deep px-10 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-60"
        >
          {status === "submitting" ? "Sending…" : "Send Message"}
        </button>
      </MagneticButton>
    </form>
  );
}
