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

- **M-Pesa:** checkout sends a Daraja STK Push prompt (`lib/payments/mpesa.ts`) and the order is marked paid only
  when Safaricom confirms it — through the callback at `/api/payments/daraja/<MPESA_CALLBACK_SECRET>` or, if that
  never arrives, a status query (`lib/supabase/payments.ts`). Unpaid orders can be paid later from the order page.
  Set the `MPESA_*` variables from `.env.example`, run `supabase/migrations/202610010001_mpesa_payments.sql`, and
  check the credentials with `npm run check:mpesa -- [phone]`.
- **Card (Visa/Mastercard):** shown at checkout as "coming soon"; not implemented.
- **Order notifications:** every order status has one message (`lib/notifications/messages.ts`) sent to the
  customer by email (a Gmail mailbox over SMTP) and WhatsApp (Meta Cloud API) — when the order is placed, when payment confirms it,
  and each time staff change its status. Admins get a "new paid order" alert on both channels. Each send is
  recorded in `email_messages` and listed on the admin order page. WhatsApp needs the templates in
  `docs/whatsapp-templates.md` approved first; a channel with no keys set is simply skipped. Check the setup with
  `npm run check:email -- you@example.com` and `npm run setup:whatsapp`. Everything still needed to go live is in
  `docs/go-live-checklist.md`.

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
