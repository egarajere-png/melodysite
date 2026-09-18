"use client";

import { FormEvent, useState } from "react";
import { RevealText } from "@/components/motion/RevealText";
import { MagneticButton } from "@/components/motion/MagneticButton";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }
    // TODO: wire to real newsletter provider once backend/API is connected.
    setStatus("success");
    setEmail("");
  }

  return (
    <section className="bg-aurum-plum py-section text-aurum-ivory">
      <div className="container-aurum flex flex-col items-center text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-aurum-ivory/50">09 — Join Us</p>
        <RevealText as="h2" text="Stay in the story." className="font-display text-4xl sm:text-5xl" />
        <p className="mt-4 max-w-md text-sm text-aurum-ivory/75">
          Get new arrivals, collections and Aurum news — no spam, unsubscribe any time.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="w-full border border-aurum-ivory/30 bg-transparent px-5 py-4 text-sm text-aurum-ivory placeholder:text-aurum-ivory/50 focus-visible:outline-2 focus-visible:outline-aurum-gold"
          />
          <MagneticButton>
            <button
              type="submit"
              data-cursor="expand"
              className="w-full whitespace-nowrap bg-aurum-ivory px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-obsidian transition-colors hover:bg-aurum-gold sm:w-auto"
            >
              Subscribe
            </button>
          </MagneticButton>
        </form>

        <p aria-live="polite" className="mt-3 h-5 text-xs">
          {status === "success" && "Thank you — you're on the list."}
          {status === "error" && "Please enter a valid email address."}
        </p>
      </div>
    </section>
  );
}
