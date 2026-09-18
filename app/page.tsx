import { Hero } from "@/components/home/Hero";
import { BrandStatement } from "@/components/home/BrandStatement";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { HotArrivals } from "@/components/home/HotArrivals";
import { EditorialStory } from "@/components/home/EditorialStory";
import { Bestsellers } from "@/components/home/Bestsellers";
import { DealOfTheWeek } from "@/components/home/DealOfTheWeek";
import { AfricanStorytelling } from "@/components/home/AfricanStorytelling";
import { Newsletter } from "@/components/home/Newsletter";

export default function Home() {
  return (
    <>
      <Hero />
      <BrandStatement />
      <ShopByCategory />
      <HotArrivals />
      <EditorialStory />
      <Bestsellers />
      <DealOfTheWeek />
      <AfricanStorytelling />
      <Newsletter />
    </>
  );
}
