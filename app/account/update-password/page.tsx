import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/account/UpdatePasswordForm";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default function UpdatePasswordPage() {
  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum max-w-md">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-aurum-obsidian/50">Account</p>
        <h1 className="mb-8 font-display text-4xl">Choose a new password.</h1>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
