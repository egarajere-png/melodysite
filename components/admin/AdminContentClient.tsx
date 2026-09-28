"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { saveContentBlockAction } from "@/app/actions/admin-content";
import { formatDate } from "@/lib/format";
import type { ContentBlock } from "@/lib/supabase/content-admin";

export function AdminContentClient({ blocks: initial }: { blocks: ContentBlock[] }) {
  const [blocks, setBlocks] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [key, setKey] = useState("");
  const [json, setJson] = useState("{\n  \n}");
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  function startEdit(block: ContentBlock) {
    setEditingKey(block.key);
    setKey(block.key);
    setJson(JSON.stringify(block.content, null, 2));
    setShowForm(true);
  }

  function startNew() {
    setEditingKey(null);
    setKey("");
    setJson("{\n  \n}");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const result = await saveContentBlockAction(key, json);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const parsed = JSON.parse(json);
    setBlocks((prev) => {
      const others = prev.filter((b) => b.key !== key.trim());
      return [...others, { key: key.trim(), content: parsed, isActive: true, updatedAt: new Date().toISOString() }].sort((a, b) => a.key.localeCompare(b.key));
    });
    setShowForm(false);
    setError(null);
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Content Blocks</h1>
          <p className="mt-1 max-w-xl text-sm text-aurum-obsidian/50">
            A staging area for editorial/promotional content, stored as JSON. The homepage and other pages don&apos;t read from these yet — they&apos;re still built from fixed copy.
          </p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 bg-aurum-deep px-5 py-3 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum"
        >
          <Plus size={15} strokeWidth={1.5} />
          New Block
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-8 flex flex-col gap-4 border border-aurum-obsidian/10 bg-white p-6">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Block key (e.g. homepage.hero)"
            required
            disabled={Boolean(editingKey)}
            className="border border-aurum-obsidian/15 px-3 py-2.5 text-sm disabled:bg-aurum-ivory disabled:text-aurum-obsidian/50"
          />
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={8}
            required
            className="border border-aurum-obsidian/15 px-3 py-2.5 font-mono text-sm"
          />
          <button type="submit" className="w-fit bg-aurum-deep px-6 py-2.5 text-xs uppercase tracking-widest text-aurum-ivory">
            Save Block
          </button>
          {error && <p className="text-sm text-aurum-earth">{error}</p>}
        </form>
      )}

      <div className="flex flex-col gap-4">
        {blocks.length === 0 ? (
          <p className="text-sm text-aurum-obsidian/50">No content blocks yet.</p>
        ) : (
          blocks.map((block) => (
            <button
              key={block.key}
              onClick={() => startEdit(block)}
              className="flex items-center justify-between border border-aurum-obsidian/10 bg-white p-5 text-left transition-colors hover:bg-aurum-ivory/60"
            >
              <div>
                <p className="font-display text-lg">{block.key}</p>
                <p className="mt-1 text-xs text-aurum-obsidian/40">Updated {formatDate(block.updatedAt)}</p>
              </div>
              <span className="text-xs uppercase tracking-widest text-aurum-obsidian/50">Edit</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
