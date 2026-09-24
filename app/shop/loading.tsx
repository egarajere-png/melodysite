import { ProductGridSkeleton } from "@/components/ui/ProductGridSkeleton";

export default function ShopLoading() {
  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum">
        <div className="mb-10 h-10 w-48 animate-pulse bg-aurum-obsidian/[0.06]" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
