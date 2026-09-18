import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClass =
    tone === "warning" ? "text-aurum-earth" : tone === "danger" ? "text-red-700" : "text-aurum-obsidian";

  return (
    <div className="border border-aurum-obsidian/10 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-aurum-obsidian/50">{label}</p>
        {Icon && <Icon size={16} strokeWidth={1.5} className="text-aurum-obsidian/30" />}
      </div>
      <p className={`font-display text-2xl ${toneClass}`}>{value}</p>
    </div>
  );
}
