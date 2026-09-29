// Who can open which admin section. The single source of truth for the sidebar, the
// middleware route guard and the permissions table on the Customers & Access page.
// (Database RLS independently enforces the same split for the data underneath.)

export type UserRole = "CUSTOMER" | "ASSISTANT" | "ADMIN";

export interface AdminSection {
  href: string;
  label: string;
  /** Only ADMIN may open it; ASSISTANT can open every other section. */
  adminOnly: boolean;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  { href: "/admin", label: "Dashboard", adminOnly: false },
  { href: "/admin/products", label: "Products", adminOnly: false },
  { href: "/admin/orders", label: "Orders", adminOnly: false },
  { href: "/admin/delivery", label: "Delivery", adminOnly: false },
  { href: "/admin/categories", label: "Categories", adminOnly: false },
  { href: "/admin/collections", label: "Collections", adminOnly: false },
  { href: "/admin/deals", label: "Deals", adminOnly: false },
  { href: "/admin/analytics", label: "Analytics", adminOnly: false },
  { href: "/admin/customers", label: "Customers & Access", adminOnly: true },
  { href: "/admin/inquiries", label: "Inquiries", adminOnly: false },
  { href: "/admin/expenses", label: "Expenses", adminOnly: true },
  { href: "/admin/content", label: "Content", adminOnly: true },
  { href: "/admin/audit-logs", label: "Audit Log", adminOnly: true },
];

/** "a Customer", "an Assistant", "an Administrator". */
export function withArticle(role: UserRole): string {
  const label = ROLE_LABELS[role];
  return `${/^[AEIOU]/i.test(label) ? "an" : "a"} ${label}`;
}

export const ROLE_LABELS: Record<UserRole, string> = { CUSTOMER: "Customer", ASSISTANT: "Assistant", ADMIN: "Administrator" };

export const ROLE_SUMMARIES: Record<UserRole, string> = {
  CUSTOMER: "Shops on the website only — no admin panel access. Everyone starts here.",
  ASSISTANT: "Runs day-to-day operations: products, orders, delivery, catalogue, deals, analytics and inquiries.",
  ADMIN: "Full access, including customers & access, expenses, site content and the audit log.",
};

/** True when a path under /admin is restricted to ADMIN. */
export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_SECTIONS.some((s) => s.adminOnly && (pathname === s.href || pathname.startsWith(`${s.href}/`)));
}

/** The account that can never be demoted, suspended or edited by other admins. */
export const OWNER_EMAIL = (process.env.OWNER_EMAIL ?? "pambiegara@gmail.com").toLowerCase();
