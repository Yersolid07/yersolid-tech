# Yersolid Tech landing page — brief

## Product
**Yersolid Tech** sells **Wawi Kadio** — an all-in-one restaurant/cafe management
system — as a monthly SaaS. Wawi Kadio itself is live and in production at
wawikadio.com (Laravel 11 + React 18 + Inertia + MySQL + Redis).

Positioning from `Yersolid_Tech_SaaS_Plan.md` + `README.md`:
- Indonesian SMB restaurants, warungs, cafes; multi-outlet
- Pain points validated in the plan: stock runs out unnoticed (≈Rp 300k/day
  sales loss), 2 hours/night manual reporting, no real-time per-item sales

## Pricing (verbatim from the plan, Article 3.1)
| Tier | Price | Scope |
|---|---|---|
| Starter | Rp 150.000/bulan | 1 outlet, basic POS + daily reports |
| Professional | Rp 300.000/bulan | 3 outlets, weekly reports + low-stock alerts |
| Enterprise | Rp 500.000/bulan | unlimited outlets + API + 24/7 support |

Also stated in the plan: annual billing gets 10% off; payment via Midtrans;
past_due → 3-day grace → report-only access.

## Features (from README, all shipped in the real app)
- POS / kasir dine-in
- KDS — real-time kitchen display
- Online reservation — kolam & gazebo
- Smart inventory tracking + low-stock alerts
- Multi-role access (admin / staff / kitchen / cashier)
- Executive finance reporting
- Ticket sales at a separate counter (not the food POS)

## Audience
Restaurant/warung/cafe owners in Indonesia. Decision drivers from the interview
template: save weekly admin hours, stop ingredient waste, see sales from a phone.

## Tone
Indonesian, direct, confident — no startup buzzwords. Show the product working
rather than adjectives. Prices are public, so state them plainly.

## Delivery
- Host: `saas.yersolid.web.id` (root `yersolid.web.id` reserved for a Yersolid
  Tech company profile later)
- VPS: 3.8GB RAM / 2 vCPU / no GPU → the site must be **static** (no Node
  process serving traffic). Animations run in the browser.
- Must be responsive (phone-first: owners check on phones), accessible, and must
  not depend on any external CDN at runtime.

## Verified facts only
Every number on the page traces to either the SaaS plan or the README. No
invented stats, no fake logos, no made-up testimonials.
