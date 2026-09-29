"use client";

import { useMemo, useState } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import { effectivePrice, galleryFor, leadImage } from "@/lib/product";
import { formatKES } from "@/lib/format";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { AccordionItem } from "@/components/motion/SmoothAccordion";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useRouter } from "next/navigation";

function matchVariant(product: Product, colour: string | undefined, size: string | undefined) {
  return product.variants.find(
    (v) => (colour === undefined || v.colour === colour) && (size === undefined || v.size === size)
  );
}

export function ProductDetailClient({ product }: { product: Product }) {
  const { addLine, openCart, isAuthenticated } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const router = useRouter();

  const colours = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.colour).filter(Boolean))) as string[],
    [product]
  );
  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))) as string[],
    [product]
  );

  // Open on something the customer can actually buy, rather than whichever variant
  // happens to be listed first.
  const firstInStock = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const productSoldOut = !product.variants.some((v) => v.stock > 0);

  const [selectedColour, setSelectedColour] = useState<string | undefined>(firstInStock?.colour ?? colours[0]);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(firstInStock?.size ?? sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showWorn, setShowWorn] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const galleryImages = galleryFor(product, selectedColour);
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
  function isColourInStock(colour: string) {
    return product.variants.some((v) => v.colour === colour && v.stock > 0);
  }

  function selectColour(colour: string) {
    setSelectedColour(colour);
    setActiveImageIndex(0);
    setShowWorn(false);
    setQuantity(1);
    // Keep the chosen size if this colour has it in stock; otherwise move to one it does.
    const sizeStillAvailable = product.variants.some((v) => v.colour === colour && v.size === selectedSize && v.stock > 0);
    if (!sizeStillAvailable) {
      const alternative = product.variants.find((v) => v.colour === colour && v.stock > 0);
      if (alternative?.size) setSelectedSize(alternative.size);
    }
  }

  function selectSize(size: string) {
    setSelectedSize(size);
    setQuantity(1);
  }

  function handleAddToBag() {
    if (!currentVariant || !inStock) return;
    addLine(
      {
        productId: product.id,
        productSlug: product.slug,
        variantId: currentVariant.id,
        sku: currentVariant.sku,
        name: product.name,
        variantLabel: [currentVariant.colour, currentVariant.size].filter(Boolean).join(" / ") || "One Size",
        unitPrice: price,
        image: leadImage(product, currentVariant.colour),
        maxStock: currentVariant.stock,
      },
      quantity
    );
    // Signed-out visitors get the sign-in panel instead; nothing was added.
    if (!isAuthenticated) return;
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  function handleBuyNow() {
    if (!currentVariant || !inStock) return;
    handleAddToBag();
    if (!isAuthenticated) return;
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
            image={showWorn && product.wornImage ? product.wornImage : (galleryImages[activeImageIndex] ?? galleryImages[0])}
            className="h-full w-full"
            priority
          />
          {productSoldOut && (
            <span className="absolute left-4 top-4 bg-aurum-obsidian px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-aurum-ivory">
              Sold out
            </span>
          )}
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
                // Sold-out colours stay selectable so customers can still see them,
                // but they're marked and can't be added to the bag.
                const available = isColourInStock(c);
                return (
                  <button
                    key={c}
                    onClick={() => selectColour(c)}
                    aria-pressed={selectedColour === c}
                    aria-label={available ? c : `${c} (sold out)`}
                    className={`border px-4 py-2 text-xs uppercase tracking-wide transition-colors ${
                      selectedColour === c
                        ? `border-aurum-obsidian bg-aurum-obsidian ${available ? "text-aurum-ivory" : "text-aurum-ivory/60"}`
                        : `border-aurum-obsidian/25 ${available ? "" : "text-aurum-obsidian/40"}`
                    } ${available ? "" : "line-through decoration-1"}`}
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
                    onClick={() => selectSize(s)}
                    disabled={!available}
                    aria-label={available ? s : `${s} (sold out)`}
                    className={`border px-4 py-2 text-xs uppercase tracking-wide transition-colors ${
                      selectedSize === s && available ? "border-aurum-obsidian bg-aurum-obsidian text-aurum-ivory" : "border-aurum-obsidian/25"
                    } disabled:cursor-not-allowed disabled:line-through disabled:opacity-35`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className={`mt-4 text-xs uppercase tracking-wide ${inStock ? "text-aurum-obsidian/50" : "text-aurum-earth"}`} aria-live="polite">
          {productSoldOut
            ? "Sold out — this piece is currently unavailable"
            : !currentVariant
              ? "This combination isn't available — choose another option"
              : inStock
                ? currentVariant.stock <= 3
                  ? `Only ${currentVariant.stock} left`
                  : "In stock"
                : `${[currentVariant.colour, currentVariant.size].filter(Boolean).join(" / ") || "This option"} is out of stock — choose another option`}
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

        <button
          onClick={() => toggle(product.id)}
          aria-pressed={wishlisted}
          className="mt-4 w-full text-center text-xs uppercase tracking-widest text-aurum-obsidian/60 underline-offset-4 transition-colors hover:text-aurum-obsidian hover:underline"
        >
          {wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
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
