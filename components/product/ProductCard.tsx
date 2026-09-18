"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { effectivePrice, totalStock } from "@/data/products";
import { formatKES } from "@/lib/format";
import { HoverImageSwap } from "@/components/motion/HoverImageSwap";
import { useCart } from "@/context/CartContext";

export function ProductCard({ product, className = "" }: { product: Product; className?: string }) {
  const { addLine } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const inStock = totalStock(product) > 0;
  const onSale = typeof product.salePrice === "number";

  function quickAdd() {
    const variant = product.variants.find((v) => v.stock > 0);
    if (!variant) return;
    addLine(
      {
        productId: product.id,
        productSlug: product.slug,
        variantId: variant.id,
        name: product.name,
        variantLabel: [variant.colour, variant.size].filter(Boolean).join(" / ") || "One Size",
        unitPrice: effectivePrice(product),
        image: product.images[0],
        maxStock: variant.stock,
      },
      1
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <div className={`group flex flex-col ${className}`}>
      <Link href={`/shop/${product.slug}`} data-cursor="view" className="block">
        <HoverImageSwap
          primary={product.images[0]}
          secondary={product.wornImage ?? product.images[1]}
          className="aspect-[4/5] w-full"
        />
      </Link>
      <div className="mt-4 flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
        <div className="min-w-0">
          <Link href={`/shop/${product.slug}`} className="font-display text-base leading-snug sm:text-lg">
            {product.name}
          </Link>
          <div className="mt-1 flex items-center gap-2 text-sm">
            {onSale ? (
              <>
                <span className="text-aurum-obsidian/40 line-through">{formatKES(product.price)}</span>
                <span className="text-aurum-earth">{formatKES(product.salePrice!)}</span>
              </>
            ) : (
              <span>{formatKES(product.price)}</span>
            )}
          </div>
          {!inStock && (
            <p className="mt-1 text-xs uppercase tracking-wide text-aurum-obsidian/50">Out of stock</p>
          )}
        </div>
        <button
          onClick={quickAdd}
          disabled={!inStock}
          data-cursor="expand"
          className="mt-1 w-full shrink-0 whitespace-nowrap border border-aurum-obsidian/20 px-3 py-2 text-[10px] uppercase tracking-widest transition-colors hover:border-aurum-obsidian hover:bg-aurum-obsidian hover:text-aurum-ivory disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current min-[420px]:w-auto"
        >
          {justAdded ? "Added" : "Quick Add"}
        </button>
      </div>
    </div>
  );
}
