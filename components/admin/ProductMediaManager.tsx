"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeftToLine, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_MEDIA_BUCKET } from "@/lib/product-media";
import { addProductMediaAction, deleteProductMediaAction, moveProductMediaFirstAction, type ProductMediaActionResult } from "@/app/actions/admin-product-media";
import { useToast } from "@/components/admin/Toast";
import type { AdminMediaItem, AdminProductMedia, MediaSlot } from "@/lib/supabase/product-media-admin";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

export function ProductMediaManager({ productId, productName, initialMedia }: { productId: string; productName: string; initialMedia: AdminProductMedia }) {
  const toast = useToast();
  const [media, setMedia] = useState(initialMedia);
  // Which upload target is busy, e.g. "main", "hover", "gallery", "colour:Gold".
  const [busy, setBusy] = useState<string | null>(null);

  function apply(result: ProductMediaActionResult, success: string) {
    if (result.ok) {
      setMedia(result.media);
      toast.success(success);
    } else {
      toast.error(result.error);
    }
  }

  async function upload(files: File[], slot: MediaSlot, busyKey: string, label: string, variantId?: string) {
    const valid = files.filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.error(`${f.name} isn't a supported image (use JPG, PNG, WebP or AVIF).`);
        return false;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} is larger than 8 MB.`);
        return false;
      }
      return true;
    });
    if (!valid.length) return;

    setBusy(busyKey);
    const supabase = createClient();
    let saved = 0;
    let latest: ProductMediaActionResult | null = null;

    for (const file of valid) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const storagePath = `products/${productId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(PRODUCT_MEDIA_BUCKET).upload(storagePath, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (error) {
        toast.error(`Could not upload ${file.name}. ${error.message}`);
        continue;
      }
      const result = await addProductMediaAction({ productId, slot, storagePath, alt: `${productName}${label ? ` — ${label}` : ""}`, variantId });
      latest = result;
      if (result.ok) {
        saved += 1;
        setMedia(result.media);
      } else {
        toast.error(result.error);
      }
    }
    setBusy(null);

    if (saved > 0 && latest) {
      const what = slot === "main" ? "Main image" : slot === "hover" ? "Hover image" : saved === 1 ? "Image" : `${saved} images`;
      toast.success(`${what} ${slot === "main" || slot === "hover" ? "has been updated" : saved === 1 ? "has been added" : "have been added"}${label && slot === "colour" ? ` to ${label}` : ""}.`);
    }
  }

  async function remove(item: AdminMediaItem, what: string) {
    setBusy(`delete:${item.id}`);
    apply(await deleteProductMediaAction(productId, item.id), `${what} has been removed.`);
    setBusy(null);
  }

  async function moveFirst(item: AdminMediaItem) {
    setBusy(`move:${item.id}`);
    apply(await moveProductMediaFirstAction(productId, item.id), "Image order has been updated.");
    setBusy(null);
  }

  return (
    <div className="border border-aurum-obsidian/10 bg-white p-6">
      <div className="mb-6">
        <h2 className="font-display text-xl">Images</h2>
        <p className="mt-1 text-sm text-aurum-obsidian/50">Images save as soon as they upload — no need to press Save Changes. JPG, PNG, WebP or AVIF, up to 8 MB. Portrait (4:5) photos look best.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <SingleSlot
          title="Main image"
          help="The first image customers see — on the shop grid and product page."
          item={media.main}
          busy={busy === "main" || busy === `delete:${media.main?.id}`}
          onUpload={(files) => upload(files, "main", "main", "")}
          onRemove={() => media.main && remove(media.main, "Main image")}
        />
        <SingleSlot
          title="Hover image"
          help="Swapped in when a customer hovers over the product card (e.g. the piece being worn)."
          item={media.hover}
          busy={busy === "hover" || busy === `delete:${media.hover?.id}`}
          onUpload={(files) => upload(files, "hover", "hover", "worn")}
          onRemove={() => media.hover && remove(media.hover, "Hover image")}
        />
      </div>

      <div className="mt-8 border-t border-aurum-obsidian/10 pt-6">
        <h3 className="text-xs uppercase tracking-widest text-aurum-obsidian/50">Colour images</h3>
        <p className="mt-1 text-sm text-aurum-obsidian/50">
          When a customer picks a colour on the product page, the gallery switches to that colour&apos;s images. The first one is also shown in their bag.
        </p>

        {media.colours.length === 0 ? (
          <p className="mt-4 bg-aurum-ivory px-4 py-3 text-sm text-aurum-obsidian/60">
            This product has no colours yet. Give your variants a Colour below and press Save Changes — a gallery for each colour will then appear here.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-6">
            {media.colours.map((group) => {
              const key = `colour:${group.colour}`;
              return (
                <div key={group.colour}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium">
                      {group.colour}
                      <span className="ml-2 text-xs font-normal text-aurum-obsidian/40">
                        {group.images.length} image{group.images.length === 1 ? "" : "s"}
                        {!group.variantId && " · no active variant has this colour any more"}
                      </span>
                    </p>
                    {group.variantId && (
                      <UploadButton
                        label="Add images"
                        multiple
                        busy={busy === key}
                        onFiles={(files) => upload(files, "colour", key, group.colour, group.variantId!)}
                      />
                    )}
                  </div>
                  <Thumbs items={group.images} busy={busy} onRemove={(i) => remove(i, "Image")} onMoveFirst={moveFirst} emptyText={`No ${group.colour} images yet — the main image is shown for this colour.`} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-aurum-obsidian/10 pt-6">
        <div className="mb-2 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-aurum-obsidian/50">Additional images</h3>
            <p className="mt-1 text-sm text-aurum-obsidian/50">Optional extra views that apply to every colour, shown after the main image.</p>
          </div>
          <UploadButton label="Add images" multiple busy={busy === "gallery"} onFiles={(files) => upload(files, "gallery", "gallery", "")} />
        </div>
        <Thumbs items={media.gallery} busy={busy} onRemove={(i) => remove(i, "Image")} onMoveFirst={moveFirst} emptyText="No additional images." />
      </div>
    </div>
  );
}

function SingleSlot({
  title,
  help,
  item,
  busy,
  onUpload,
  onRemove,
}: {
  title: string;
  help: string;
  item: AdminMediaItem | null;
  busy: boolean;
  onUpload: (files: File[]) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-aurum-obsidian/50">{title}</p>
      <p className="mb-3 mt-1 text-sm text-aurum-obsidian/50">{help}</p>
      <div className="flex items-end gap-4">
        <div className="relative aspect-[4/5] w-36 shrink-0 overflow-hidden border border-aurum-obsidian/10 bg-aurum-ivory">
          {item ? (
            <Image src={item.url} alt={item.alt} fill sizes="144px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-aurum-obsidian/30">
              <ImagePlus size={22} strokeWidth={1.25} />
              <span className="text-[10px] uppercase tracking-widest">None yet</span>
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 size={20} className="animate-spin text-aurum-obsidian/60" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <UploadButton label={item ? "Replace" : "Upload"} busy={busy} onFiles={onUpload} />
          {item && (
            <button type="button" onClick={onRemove} disabled={busy} className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-aurum-earth disabled:opacity-40">
              <Trash2 size={13} strokeWidth={1.5} />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Thumbs({
  items,
  busy,
  onRemove,
  onMoveFirst,
  emptyText,
}: {
  items: AdminMediaItem[];
  busy: string | null;
  onRemove: (item: AdminMediaItem) => void;
  onMoveFirst: (item: AdminMediaItem) => void;
  emptyText: string;
}) {
  if (!items.length) return <p className="text-sm text-aurum-obsidian/40">{emptyText}</p>;
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item, i) => {
        const working = busy === `delete:${item.id}` || busy === `move:${item.id}`;
        return (
          <div key={item.id} className="group relative aspect-[4/5] w-24 overflow-hidden border border-aurum-obsidian/10 bg-aurum-ivory">
            <Image src={item.url} alt={item.alt} fill sizes="96px" className="object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 bg-aurum-obsidian/80 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-aurum-ivory">First</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/90 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              {i > 0 ? (
                <button type="button" onClick={() => onMoveFirst(item)} disabled={Boolean(busy)} aria-label="Move to first" title="Move to first" className="p-1.5 text-aurum-obsidian/70 hover:text-aurum-obsidian disabled:opacity-40">
                  <ArrowLeftToLine size={14} strokeWidth={1.5} />
                </button>
              ) : (
                <span />
              )}
              <button type="button" onClick={() => onRemove(item)} disabled={Boolean(busy)} aria-label="Remove image" title="Remove" className="p-1.5 text-aurum-earth hover:opacity-70 disabled:opacity-40">
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
            {working && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 size={18} className="animate-spin text-aurum-obsidian/60" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UploadButton({ label, busy, multiple = false, onFiles }: { label: string; busy: boolean; multiple?: boolean; onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = ""; // allow re-selecting the same file later
          if (files.length) onFiles(files);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex items-center gap-1.5 border border-aurum-obsidian/20 px-3 py-2 text-xs uppercase tracking-widest transition-colors hover:border-aurum-obsidian hover:bg-aurum-obsidian hover:text-aurum-ivory disabled:opacity-40"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} strokeWidth={1.5} />}
        {busy ? "Uploading…" : label}
      </button>
    </>
  );
}
