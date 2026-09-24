import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : null;
  if (!name || !subject || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please provide a name, valid email, subject, and message." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("contact_inquiries").insert({ name, email, subject, message, phone });
    if (error) throw error;
    const apiKey = process.env.RESEND_API_KEY;
    const recipient = process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL;
    if (apiKey && recipient && process.env.EMAIL_FROM) await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [recipient], reply_to: email, subject: `[Contact] ${subject}`, text: `${name} (${email}${phone ? `, ${phone}` : ""})\n\n${message}` }) });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "We could not send your message right now. Please try again shortly." }, { status: 503 });
  }
}
