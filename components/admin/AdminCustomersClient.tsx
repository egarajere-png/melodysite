"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Minus, Search, ShieldCheck } from "lucide-react";
import { setUserActiveAction, setUserRoleAction, type AccessActionResult } from "@/app/actions/admin-customers";
import type { AdminUser } from "@/lib/supabase/customers-admin";
import { ADMIN_SECTIONS, ROLE_LABELS, ROLE_SUMMARIES, withArticle, type UserRole } from "@/lib/staff-permissions";
import { formatDate, formatKES } from "@/lib/format";
import { useToast } from "@/components/admin/Toast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

const ROLES: UserRole[] = ["CUSTOMER", "ASSISTANT", "ADMIN"];

const ROLE_BADGE: Record<UserRole, string> = {
  CUSTOMER: "bg-aurum-obsidian/5 text-aurum-obsidian/70",
  ASSISTANT: "bg-aurum-gold/15 text-aurum-earth",
  ADMIN: "bg-aurum-deep/10 text-aurum-deep",
};

type Pending = { kind: "role"; user: AdminUser; role: UserRole } | { kind: "status"; user: AdminUser; active: boolean };

function canAccess(role: UserRole, adminOnly: boolean) {
  if (role === "CUSTOMER") return false;
  return role === "ADMIN" || !adminOnly;
}

export function AdminCustomersClient({ users: initial, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const toast = useToast();
  const [users, setUsers] = useState(initial);
  const [filter, setFilter] = useState<UserRole | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [showPermissions, setShowPermissions] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => Object.fromEntries(ROLES.map((r) => [r, users.filter((u) => u.role === r).length])) as Record<UserRole, number>, [users]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) => (filter === "ALL" || u.role === filter) && (!q || u.name.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q) || (u.phone ?? "").includes(q))
    );
  }, [users, filter, query]);

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    const result: AccessActionResult =
      pending.kind === "role" ? await setUserRoleAction(pending.user.id, pending.role) : await setUserActiveAction(pending.user.id, pending.active);
    setBusy(false);
    setPending(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setUsers(result.users);
    toast.success(result.message);
  }

  function dialogCopy(p: Pending): { title: string; message: string; label: string } {
    if (p.kind === "status") {
      return p.active
        ? { title: "Reactivate account?", message: `${p.user.name} will be able to sign in again${p.user.role !== "CUSTOMER" ? ` with their ${ROLE_LABELS[p.user.role]} access` : ""}.`, label: "Reactivate" }
        : {
            title: "Suspend account?",
            message: `${p.user.name} will be signed out within the hour and won't be able to sign in${p.user.role !== "CUSTOMER" ? " or open the admin panel" : ""}. Their orders stay on record. You can reactivate them any time.`,
            label: "Suspend",
          };
    }
    const to = p.role;
    return {
      title: `Make ${p.user.name} ${withArticle(to)}?`,
      message: `${ROLE_SUMMARIES[to]}${to !== "CUSTOMER" ? " They'll see the admin panel the next time they open /admin." : " They'll lose access to the admin panel straight away."}`,
      label: `Make ${ROLE_LABELS[to]}`,
    };
  }

  const copy = pending ? dialogCopy(pending) : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl">Customers &amp; Access</h1>
        <p className="mt-1 max-w-2xl text-sm text-aurum-obsidian/50">
          Everyone who signs up starts as a Customer. Promote trusted people to Assistant or Administrator, or suspend an account to block it from signing in.
        </p>
      </div>

      {/* Role summary / filters */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setFilter(filter === r ? "ALL" : r)}
            aria-pressed={filter === r}
            className={`border bg-white p-4 text-left transition-colors ${filter === r ? "border-aurum-obsidian" : "border-aurum-obsidian/10 hover:border-aurum-obsidian/40"}`}
          >
            <div className="flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-widest text-aurum-obsidian/50">{ROLE_LABELS[r]}s</p>
              <p className="font-display text-2xl">{counts[r]}</p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-aurum-obsidian/55">{ROLE_SUMMARIES[r]}</p>
          </button>
        ))}
      </div>

      {/* Permissions reference */}
      <div className="mb-8 border border-aurum-obsidian/10 bg-white">
        <button type="button" onClick={() => setShowPermissions((v) => !v)} aria-expanded={showPermissions} className="flex w-full items-center justify-between px-5 py-3.5 text-left">
          <span className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck size={16} strokeWidth={1.5} className="text-aurum-obsidian/50" />
            What each role can access
          </span>
          <ChevronDown size={16} strokeWidth={1.5} className={`transition-transform ${showPermissions ? "rotate-180" : ""}`} />
        </button>
        {showPermissions && (
          <div className="overflow-x-auto border-t border-aurum-obsidian/10">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-widest text-aurum-obsidian/45">
                  <th className="px-5 py-2.5 font-normal">Area</th>
                  {ROLES.map((r) => (
                    <th key={r} className="px-3 py-2.5 text-center font-normal">
                      {ROLE_LABELS[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-aurum-obsidian/5">
                  <td className="px-5 py-2">Shop, bag, wishlist &amp; own orders</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-3 py-2 text-center">
                      <Check size={15} className="inline text-green-700" aria-label="Yes" />
                    </td>
                  ))}
                </tr>
                {ADMIN_SECTIONS.map((s) => (
                  <tr key={s.href} className="border-t border-aurum-obsidian/5">
                    <td className="px-5 py-2">Admin · {s.label}</td>
                    {ROLES.map((r) => (
                      <td key={r} className="px-3 py-2 text-center">
                        {canAccess(r, s.adminOnly) ? <Check size={15} className="inline text-green-700" aria-label="Yes" /> : <Minus size={15} className="inline text-aurum-obsidian/25" aria-label="No" />}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-aurum-obsidian/5">
                  <td className="px-5 py-2">Change roles &amp; suspend accounts</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-3 py-2 text-center">
                      {r === "ADMIN" ? <Check size={15} className="inline text-green-700" aria-label="Yes" /> : <Minus size={15} className="inline text-aurum-obsidian/25" aria-label="No" />}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full items-center gap-2 border border-aurum-obsidian/15 bg-white px-4 py-2.5 text-sm sm:max-w-sm">
          <Search size={16} strokeWidth={1.5} className="text-aurum-obsidian/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or phone…" className="w-full bg-transparent focus-visible:outline-none" />
        </div>
        <p className="text-xs uppercase tracking-widest text-aurum-obsidian/45">
          {filter === "ALL" ? "Everyone" : `${ROLE_LABELS[filter]}s`} · {visible.length}
        </p>
      </div>

      <div className="overflow-x-auto border border-aurum-obsidian/10 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-aurum-obsidian/10 text-xs uppercase tracking-widest text-aurum-obsidian/50">
              <th className="px-4 py-3">Person</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-aurum-obsidian/50">
                  Nobody matches.
                </td>
              </tr>
            ) : (
              visible.map((u) => {
                const isSelf = u.id === currentUserId;
                const locked = isSelf || u.isOwner;
                return (
                  <tr key={u.id} className={`border-b border-aurum-obsidian/5 last:border-0 ${u.isActive ? "" : "bg-aurum-obsidian/[0.03]"}`}>
                    <td className="px-4 py-3">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {u.name}
                        {u.isOwner && <span className="bg-aurum-gold/20 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-aurum-earth">Owner</span>}
                        {isSelf && <span className="bg-aurum-obsidian/10 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-aurum-obsidian/60">You</span>}
                      </p>
                      <p className="text-xs text-aurum-obsidian/60">{u.email ?? "—"}</p>
                      <p className="text-xs text-aurum-obsidian/40">
                        {u.phone ? `${u.phone} · ` : ""}Signs in with {u.signInMethod}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {locked ? (
                        <span className={`px-2 py-1 text-xs uppercase tracking-wide ${ROLE_BADGE[u.role]}`} title={u.isOwner ? "The owner's access can't be changed" : "You can't change your own access"}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => setPending({ kind: "role", user: u, role: e.target.value as UserRole })}
                          aria-label={`Role for ${u.name}`}
                          disabled={busy}
                          className={`border-0 px-2 py-1 text-xs uppercase tracking-wide ${ROLE_BADGE[u.role]}`}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs uppercase tracking-wide ${u.isActive ? "bg-green-700/10 text-green-800" : "bg-aurum-earth/10 text-aurum-earth"}`}>{u.isActive ? "Active" : "Suspended"}</span>
                        {!locked && (
                          <button
                            type="button"
                            onClick={() => setPending({ kind: "status", user: u, active: !u.isActive })}
                            disabled={busy}
                            className="text-xs uppercase tracking-widest text-aurum-obsidian/60 underline-offset-4 hover:text-aurum-obsidian hover:underline disabled:opacity-40"
                          >
                            {u.isActive ? "Suspend" : "Reactivate"}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p>{u.totalOrders}</p>
                      <p className="text-xs text-aurum-obsidian/50">{formatKES(u.totalSpend)}</p>
                    </td>
                    <td className="px-4 py-3 text-aurum-obsidian/60">
                      <p>{formatDate(u.joinedAt)}</p>
                      <p className="text-xs text-aurum-obsidian/40">{u.lastSignInAt ? `Last seen ${formatDate(u.lastSignInAt)}` : "Never signed in"}</p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-aurum-obsidian/40">Orders count paid orders only. Guest orders (placed without an account) appear under Orders.</p>

      <ConfirmDialog
        open={pending !== null}
        title={copy?.title ?? ""}
        message={copy?.message ?? ""}
        confirmLabel={copy?.label ?? "Confirm"}
        busy={busy}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
