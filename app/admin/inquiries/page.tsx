"use client";

import { useState } from "react";
import { inquiries as initialInquiries } from "@/data/inquiries";
import type { Inquiry, InquiryStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

const STATUSES: InquiryStatus[] = ["New", "Read", "In Progress", "Resolved"];

const STATUS_STYLES: Record<InquiryStatus, string> = {
  New: "bg-aurum-deep/10 text-aurum-deep",
  Read: "bg-aurum-obsidian/10 text-aurum-obsidian/70",
  "In Progress": "bg-aurum-earth/10 text-aurum-earth",
  Resolved: "bg-green-700/10 text-green-800",
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);

  function updateStatus(id: string, status: InquiryStatus) {
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Inquiries</h1>

      <div className="flex flex-col gap-4">
        {inquiries.map((inquiry) => (
          <div key={inquiry.id} className="border border-aurum-obsidian/10 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg">{inquiry.subject}</p>
                <p className="text-sm text-aurum-obsidian/60">
                  {inquiry.name} · {inquiry.email}
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
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-3 text-sm text-aurum-obsidian/70">{inquiry.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
