"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import { updateInquiryStatusAction } from "@/app/actions/admin-inquiries";
import type { Inquiry, InquiryStatus } from "@/lib/supabase/inquiries";

const STATUSES: InquiryStatus[] = ["NEW", "READ", "IN_PROGRESS", "RESOLVED"];
const STATUS_LABELS: Record<InquiryStatus, string> = { NEW: "New", READ: "Read", IN_PROGRESS: "In Progress", RESOLVED: "Resolved" };
const STATUS_STYLES: Record<InquiryStatus, string> = {
  NEW: "bg-aurum-deep/10 text-aurum-deep",
  READ: "bg-aurum-obsidian/10 text-aurum-obsidian/70",
  IN_PROGRESS: "bg-aurum-earth/10 text-aurum-earth",
  RESOLVED: "bg-green-700/10 text-green-800",
};

export function AdminInquiriesList({ inquiries: initial }: { inquiries: Inquiry[] }) {
  const [inquiries, setInquiries] = useState(initial);

  async function updateStatus(id: string, status: InquiryStatus) {
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    const result = await updateInquiryStatusAction(id, status);
    if (!result.ok) {
      setInquiries(initial); // revert on failure
    }
  }

  if (inquiries.length === 0) {
    return <p className="text-sm text-aurum-obsidian/50">No inquiries yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {inquiries.map((inquiry) => (
        <div key={inquiry.id} className="border border-aurum-obsidian/10 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg">{inquiry.subject}</p>
              <p className="text-sm text-aurum-obsidian/60">
                {inquiry.name} · {inquiry.email}
                {inquiry.phone ? ` · ${inquiry.phone}` : ""}
              </p>
              <p className="mt-1 text-xs text-aurum-obsidian/40">{formatDate(inquiry.createdAt)}</p>
            </div>
            <select
              value={inquiry.status}
              onChange={(e) => updateStatus(inquiry.id, e.target.value as InquiryStatus)}
              className={`border-0 px-3 py-1.5 text-xs uppercase tracking-widest ${STATUS_STYLES[inquiry.status]}`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-sm text-aurum-obsidian/70">{inquiry.message}</p>
        </div>
      ))}
    </div>
  );
}
