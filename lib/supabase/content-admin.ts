import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export interface ContentBlock {
  key: string;
  content: unknown;
  isActive: boolean;
  updatedAt: string;
}

/** RLS ("admin content") restricts this to is_admin(). */
export async function getContentBlocks(): Promise<ContentBlock[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("content_blocks").select("key, content, is_active, updated_at").order("key");
  if (error) throw error;
  return (data ?? []).map((b) => ({ key: b.key, content: b.content, isActive: b.is_active, updatedAt: b.updated_at }));
}

export async function upsertContentBlock(adminId: string, key: string, content: unknown): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("content_blocks").upsert({ key, content: content as Json, updated_by: adminId, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}
