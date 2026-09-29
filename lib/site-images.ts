import type { ImageRef } from "@/lib/types";

/**
 * Every non-product photo on the site, served from /public/images. The files there
 * are labelled sample images — to use real photography, replace a file with one of
 * the same name (or point the `url` here at a new file). Product photos are not here:
 * they're uploaded per product in the admin and stored in Supabase Storage.
 *
 * Category tiles are resolved by slug instead (see categoryImage() in
 * lib/supabase/catalogue.ts): /images/categories/<slug>.jpg, falling back to
 * /images/categories/default.jpg.
 */
function img(id: string, url: string, alt: string): ImageRef {
  return { id, url, alt };
}

export const SITE_IMAGES = {
  homeHero: img("home-hero", "/images/hero/home-hero.jpg", "Aurum Entonet editorial hero"),
  homeStorytelling: img("home-storytelling", "/images/editorial/home-storytelling.jpg", "Natural materials and texture, Aurum Entonet"),
  homeEditorialStory: img("home-editorial-story", "/images/editorial/home-editorial-story.jpg", "Aurum Entonet editorial story"),

  aboutHero: img("about-hero", "/images/about/about-hero.jpg", "Aurum Entonet studio"),
  aboutStory: img("about-story", "/images/about/about-story.jpg", "Aurum Entonet studio practice"),
  aboutRoots1: img("about-roots-1", "/images/about/about-roots-1.jpg", "Materials and texture"),
  aboutRoots2: img("about-roots-2", "/images/about/about-roots-2.jpg", "Studio detail"),
  aboutRoots3: img("about-roots-3", "/images/about/about-roots-3.jpg", "Aurum Entonet piece detail"),
  aboutRoots4: img("about-roots-4", "/images/about/about-roots-4.jpg", "Worn Aurum Entonet piece"),
  aboutCraft: img("about-craft", "/images/about/about-craft.jpg", "Hand-finishing a piece of jewellery"),
  aboutCommunity: img("about-community", "/images/about/about-community.jpg", "Aurum Entonet community"),
  aboutFinalCta: img("about-final-cta", "/images/about/about-final-cta.jpg", ""),

  menuShop: img("menu-shop", "/images/editorial/menu-shop.jpg", "Shop all"),
  menuAbout: img("menu-about", "/images/editorial/menu-about.jpg", "About Aurum Entonet"),
  menuContact: img("menu-contact", "/images/editorial/menu-contact.jpg", "Contact Aurum Entonet"),
  menuNew: img("menu-new", "/images/editorial/menu-new.jpg", "New arrivals"),
  menuBestsellers: img("menu-bestsellers", "/images/editorial/menu-bestsellers.jpg", "Bestsellers"),
  menuDeals: img("menu-deals", "/images/editorial/menu-deals.jpg", "The Aurum Edit"),

  account: img("account", "/images/editorial/account.jpg", ""),
  notFound: img("not-found", "/images/editorial/not-found.jpg", ""),
} satisfies Record<string, ImageRef>;
