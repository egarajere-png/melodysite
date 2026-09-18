import type { Inquiry } from "@/lib/types";

export const inquiries: Inquiry[] = [
  {
    id: "inq-1",
    name: "Fatuma Ali",
    email: "fatuma.ali@example.com",
    subject: "Custom engraving on the Imara Signet",
    message: "Is it possible to have initials engraved inside the band? Interested in the Medium size.",
    status: "New",
    createdAt: "2026-09-14T10:20:00Z",
  },
  {
    id: "inq-2",
    name: "David Mwangi",
    email: "david.mwangi@example.com",
    subject: "Wholesale enquiry",
    message: "I run a concept store in Kisumu and would like to discuss stocking a small selection of pieces.",
    status: "In Progress",
    createdAt: "2026-09-12T08:00:00Z",
  },
  {
    id: "inq-3",
    name: "Grace Njeri",
    email: "grace.njeri@example.com",
    subject: "Order collection hours",
    message: "What are your studio collection hours for orders marked Ready for Collection?",
    status: "Resolved",
    createdAt: "2026-09-09T16:45:00Z",
  },
];
