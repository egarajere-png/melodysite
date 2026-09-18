# Aurum Entonet

**A Handmade Story in Kenya.**

A production-quality, art-directed e-commerce experience for Aurum Entonet, a Kenyan jewellery house working at
the meeting point of African heritage and contemporary design. Built with Next.js (App Router), TypeScript,
Tailwind CSS v4 and Framer Motion.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS v4 (CSS-first `@theme` tokens in `app/globals.css`)
- **Motion:** Framer Motion, via a small reusable primitives library in `components/motion/`
- **Charts (admin):** Recharts
- **Icons:** lucide-react
- **Fonts:** Fraunces (display serif) + Archivo (functional sans), loaded via `next/font/google`

## Getting Started

```bash
npm install
npm run dev       # start the dev server on http://localhost:3000
npm run build     # production build
npm run lint      # ESLint
```

## Project Structure

```
app/                    App Router routes
  admin/                Admin dashboard (separate layout/shell — no storefront chrome)
  shop/, shop/[slug]/    Shop grid + product detail pages
  about/, contact/, checkout/, orders/, account/, policies/
components/
  layout/                Navbar, footer, preloader, custom cursor, mobile/full-screen menu
  motion/                Reusable animation primitives (FadeIn, RevealText, ParallaxImage, …)
  home/                  Homepage sections
  product/, shop/, cart/, checkout/, orders/, contact/, admin/
  ui/                    EditorialImage placeholder system, countdown timer, etc.
data/                    Mock/demo data (products, categories, collections, deals, orders, customers, inquiries)
lib/                     Types, formatting, motion tokens, analytics helpers, fonts
context/                 Cart context (localStorage-persisted)
```

## Demo / Mock Data

**Everything under `/data` is placeholder demo content** — products, prices, stock, orders, customers and
inquiries are all fictional, structured to mirror what a real backend/API would return. Swapping in a real
backend means replacing the functions in `data/*.ts` with real fetches; component code doesn't need to change.

The admin dashboard (`/admin`) visibly notes "Showing demo data" wherever analytics are derived from this mock
order history, and product/order edits in the admin UI are local-only (not persisted) until a real backend is
connected.

## Image Strategy

No real Aurum photography exists yet. Rather than use stock photos of real people (a licensing and honesty
problem), every image slot renders through `<EditorialImage>` — an abstract, tone-matched placeholder driven by
the same `ImageRef` data shape a real photo would use (`kind: "product" | "worn" | "editorial"`, plus a colour
`tone`). Replacing placeholder imagery with real photography is a data change, not a component rewrite.

## Payments & Notifications

- **M-Pesa:** `lib/payments/mpesa.ts` is an intentionally unimplemented boundary — there's no backend or Daraja
  credentials configured. Checkout never fakes a successful payment; instead it offers a WhatsApp fallback so
  orders can be completed manually until Daraja is wired up.
- **Email notifications:** not implemented — see Phase 19 of the original brief for the intended event list
  (order placed, payment received, dispatched, etc.) once a backend/email provider is connected.

## Tooling Notes

- The 21st.dev MCP server and the UI/UX Pro Max CLI/plugin requested for this project could not be installed in
  this environment (`API_KEY_21ST` isn't set, and installing a new GitHub plugin marketplace or MCP server
  requires an interactive local CLI session/restart). Their design principles were applied directly instead.
- Framer Motion is the animation layer throughout; see `lib/motion.ts` for shared easing/duration tokens and
  `components/motion/` for the primitives built on top of it.

## What's Not Built Yet

This is a frontend, integration-ready by design, but the following still need real infrastructure:

- A persistence layer (database) — admin edits and checkout currently don't write anywhere permanent.
- Real authentication for customer accounts and admin users.
- M-Pesa (Daraja) integration and transactional email sending.
- Real product photography to replace the placeholder image system.
