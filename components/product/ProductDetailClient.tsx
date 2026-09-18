"use client";

import { useMemo, useState } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import { effectivePrice } from "@/data/products";
import { formatKES } from "@/lib/format";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { AccordionItem } from "@/components/motion/SmoothAccordion";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

function matchVariant(product: Product, colour: string | undefined, size: string | undefined) {
  return product.variants.find(
    (v) => (colour === undefined || v.colour === colour) && (size === undefined || v.size === size)
  );
}

export function ProductDetailClient({ product }: { product: Product }) {
  const { addLine, openCart } = useCart();
  const router = useRouter();

  const colours = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.colour).filter(Boolean))) as string[],
    [product]
  );
  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))) as string[],
    [product]
  );

  const [selectedColour, setSelectedColour] = useState<string | undefined>(colours[0]);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showWorn, setShowWorn] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const galleryImages = product.images;
  const currentVariant: ProductVariant | undefined = matchVariant(
    product,
    colours.length ? selectedColour : undefined,
    sizes.length ? selectedSize : undefined
  );
  const inStock = (currentVariant?.stock ?? 0) > 0;
  const price = effectivePrice(product);

  function isSizeAvailableForColour(size: string) {
    return product.variants.some(
      (v) => (colours.length === 0 || v.colour === selectedColour) && v.size === size && v.stock > 0
    );
  }
  function isColourAvailableForSize(colour: string) {
    return product.variants.some(
      (v) => (sizes.length === 0 || v.size === selectedSize) && v.colour === colour && v.stock > 0
    );
  }

  function handleAddToBag() {
    if (!currentVariant || !inStock) return;
    addLine(
      {
        productId: product.id,
        productSlug: product.slug,
        variantId: currentVariant.id,
        name: product.name,
        variantLabel: [currentVariant.colour, currentVariant.size].filter(Boolean).join(" / ") || "One Size",
        unitPrice: price,
        image: product.images[0],
        maxStock: currentVariant.stock,
      },
      quantity
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  function handleBuyNow() {
    if (!currentVariant || !inStock) return;
    handleAddToBag();
    openCart();
    router.push("/checkout");
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <div
          className="relative aspect-[4/5] w-full overflow-hidden"
          onMouseEnter={() => product.wornImage && setShowWorn(true)}
          onMouseLeave={() => setShowWorn(false)}
        >
          <EditorialImage
            image={showWorn && product.wornImage ? product.wornImage : galleryImages[activeImageIndex]}
            className="h-full w-full"
          />
        </div>
        {(galleryImages.length > 1 || product.wornImage) && (
          <div className="mt-4 flex gap-3">
            {galleryImages.map((img, i) => (
              <button
                key={img.id}
                onClick={() => {
                  setActiveImageIndex(i);
                  setShowWorn(false);
                }}
                aria-label={`View image ${i + 1}`}
                className={`h-20 w-16 shrink-0 overflow-hidden border ${
                  !showWorn && activeImageIndex === i ? "border-aurum-obsidian" : "border-transparent"
                }`}
              >
                <EditorialImage image={img} className="h-full w-full" />
              </button>
            ))}
            {product.wornImage && (
              <button
                onClick={() => setShowWorn(true)}
                aria-label="View worn image"
                className={`h-20 w-16 shrink-0 overflow-hidden border ${showWorn ? "border-aurum-obsidian" : "border-transparent"}`}
              >
                <EditorialImage image={product.wornImage} className="h-full w-full" />
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <h1 className="font-display text-3xl sm:text-4xl">{product.name}</h1>
        <div className="mt-3 flex items-center gap-3 text-lg">
          {product.salePrice ? (
            <>
              <span className="text-aurum-obsidian/40 line-through">{formatKES(product.price)}</span>
              <span className="text-aurum-earth">{formatKES(product.salePrice)}</span>
            </>
          ) : (
            <span>{formatKES(product.price)}</span>
          )}
        </div>

        <p className="mt-6 max-w-md text-sm leading-relaxed text-aurum-obsidian/70">{product.description}</p>

        {colours.length > 1 && (
          <div className="mt-8">
            <p className="mb-2 text-xs uppercase tracking-widest text-aurum-obsidian/50">
              Colour {selectedColour ? `— ${selectedColour}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {colours.map((c) => {
                const available = isColourAvailableForSize(c);
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedColour(c)}
                    disabled={!available}
                    className={`border px-4 py-2 text-xs uppercase tracking-wide transition-colors ${
                      selectedColour === c ? "border-aurum-obsidian bg-aurum-obsidian text-aurum-ivory" : "border-aurum-obsidian/25"
                    } disabled:cursor-not-allowed disabled:opacity-30`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {sizes.length > 1 && (
          <div className="mt-6">
            <p className="mb-2 text-xs uppercase tracking-widest text-aurum-obsidian/50">
              Size {selectedSize ? `— ${selectedSize}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const available = isSizeAvailableForColour(s);
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    disabled={!available}
                    className={`border px-4 py-2 text-xs uppercase tracking-wide transition-colors ${
                      selectedSize === s ? "border-aurum-obsidian bg-aurum-obsidian text-aurum-ivory" : "border-aurum-obsidian/25"
                    } disabled:cursor-not-allowed disabled:opacity-30`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-4 text-xs uppercase tracking-wide text-aurum-obsidian/50">
          {currentVariant ? (inStock ? `${currentVariant.stock} available` : "Out of stock") : "Select options"}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center border border-aurum-obsidian/25">
            <button
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-3 text-sm"
            >
              −
            </button>
            <span className="w-8 text-center text-sm" aria-live="polite">
              {quantity}
            </span>
            <button
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(currentVariant?.stock ?? 1, q + 1))}
              disabled={!inStock || quantity >= (currentVariant?.stock ?? 0)}
              className="px-3 py-3 text-sm disabled:opacity-30"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToBag}
            disabled={!inStock}
            className="flex-1 min-w-[160px] bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:cursor-not-allowed disabled:opacity-40"
          >
            {!inStock ? "Out of Stock" : justAdded ? "Added to Bag" : "Add to Bag"}
          </button>
        </div>

        <button
          onClick={handleBuyNow}
          disabled={!inStock}
          className="mt-3 w-full border border-aurum-obsidian px-8 py-4 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-aurum-obsidian hover:text-aurum-ivory disabled:cursor-not-allowed disabled:opacity-40"
        >
          Buy Now
        </button>

        <div className="mt-10">
          <AccordionItem title="Description" defaultOpen>
            {product.description}
          </AccordionItem>
          <AccordionItem title="Materials">
            <ul className="list-disc pl-4">
              {product.materials.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </AccordionItem>
          <AccordionItem title="Jewellery Care">{product.careInstructions}</AccordionItem>
          <AccordionItem title="Shipping">{product.shippingInfo}</AccordionItem>
          <AccordionItem title="Returns">{product.returnsInfo}</AccordionItem>
        </div>
      </div>
    </div>
  );
}
