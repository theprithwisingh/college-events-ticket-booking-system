# UI/UX Research & Complete Website Specification — CampusPass v0.1 (Pilot MVP)

**Scope:** Research-backed, frontend-first UI/UX architecture for CampusPass v0.1 (`Next.js 16 App Router` + `React 19` + `Tailwind CSS v4` + `TypeScript`).  
**Alignment:** Strictly matches `docs/PRD.md` (v0.1 Pilot MVP) and the 5-table PostgreSQL 17 schema in `supabase/migrations/20261122173940_initial_schema.sql`.  
**Target Viewports:** Student & Volunteer flows are **Mobile-First (375px primary, one-handed thumb ergonomics)**; Admin Portal is **Responsive Desktop-First (1280px primary, clean mobile fallback)**.

---

## 1. UX Research Foundation (Why Every Decision Exists)

This specification replaces generic SaaS styling and surface-level templates with empirical usability findings tailored to **high-burst Indian college event ticketing**, **UPI checkout**, and **dark-auditorium gate verification**:

| Research Source                                                    | Empirical Finding                                                                                                                                                                                                        | Concrete CampusPass UI/UX Decision                                                                                                                                                                                                                                                                                                                                                                                                                         |
| :----------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Baymard Institute — Mobile Checkout & Form Usability**           | Perceived checkout effort correlates far more strongly with **number of visible form fields** (optimal ≤ 8; average 11.3) than number of steps. 33% of mobile checkouts hide final cost until late, driving abandonment. | **Progressive Attendee Accordion:** Ticket 1 auto-fills from `profiles` and collapses to a verified 1-line summary chip (`Edit` on tap). Only the active friend card expands. A **1-tap "Same Dept & Sem as me"** shortcut eliminates 2 dropdowns per friend (since college friends booking together usually share branch/semester). Sticky bottom bar always shows exact `Qty × ₹Price = ₹Total` + `₹0 platform fee`.                                     |
| **BookMyShow — Live Entertainment Funnel Study (+38% conversion)** | Flat, one-size-fits-all booking forms cause choice paralysis; **context rules over consistency**, and explicit step perception increases commitment completion.                                                          | **Context-Adaptive Booking:** Paid events show a compact 3-step indicator (`1. Tier → 2. Attendees → 3. Pay`); ₹0 free events collapse to 2 steps (`1. Tier → 2. Attendees`) with an emerald **"Confirm Free Pass (₹0)"** CTA — zero payment framing. Internal tiers surface `"College ID required at gate"` inline; External tiers hide Roll No/Dept/Sem completely.                                                                                      |
| **DICE & Luma — Event Discovery Critique**                         | Showing a sold-out tier's price on discovery cards ("From ₹199" when only ₹500 is left) breaks user trust at checkout. Time-sensitive metadata must anchor the card hierarchy.                                           | **Lowest _Available_ Price Rule:** Discovery cards compute `min(price_inr)` strictly across tiers with `remaining > 0`. Date, time, and venue lead the typographic hierarchy above the fold. Every utility button pairs an icon with an explicit text label.                                                                                                                                                                                               |
| **MijnEvent, Gatepost & EQ Access Scan — Gate Scanner Ergonomics** | At a crowded venue door, staff make **one binary/ternary decision per second**. Showing dense attendee tables slows throughput; relying on color alone fails under glare or color-vision deficiency (WCAG 1.4.1).        | **Forced Dark Utility Scanner (`#09090B`):** Strips the viewfinder to camera reticle, live checked-in counter, and bottom thumb-zone controls (`Torch`, `Manual Search`). **3-Modal Verdict Overlays** combine full-screen color + distinct icon shape + Web Audio synth chime/buzz + `navigator.vibrate` haptic pattern + `aria-live="polite"` status. Duplicate scans immediately display the **exact prior check-in timestamp** to stop gate arguments. |
| **Behavioral Psychology — Checkout Timers**                        | Aggressive red flashing timers at `07:00` induce panic and payment errors on UPI apps (GPay/PhonePe switching).                                                                                                          | **Progressive Urgency Timer:** The 7-minute UI countdown (backed by a 10-minute PostgreSQL hold for 3-minute UPI webhook buffer) stays calm neutral/cobalt above `02:00`, shifts to warm amber between `02:00–00:30`, and turns crimson only below `00:30`.                                                                                                                                                                                                |
| **Outdoor Campus Daylight vs. Auditorium Lighting**                | Pure `#FFFFFF` backgrounds cause harsh glare in Indian campus sunlight; pure white scanner UIs cause night-blindness at dark auditorium doors.                                                                           | **Dual-Context Palette:** Student & Admin use **Warm Alabaster (`#FAF9F6`)** canvas with crisp white (`#FFFFFF`) ticket cards and high-contrast ink (`#111318`, 17.5:1 AAA). The QR box inside `/my-tickets` forces a pure `#FFFFFF` surface with a guaranteed `16px` quiet zone regardless of OS dark mode. Scanner forces `#09090B`.                                                                                                                     |

### Prototype Anti-Patterns Explicitly Removed

The initial placeholder `apps/web/app/page.tsx` contained features that directly contradicted `docs/PRD.md` Section 5 (Strict Non-Goals) and degraded mobile UX:

- Removed 2D auditorium seat-picking grid (explicit v0.1 non-goal; replaced by capacity-backed ticket tiers).
- Removed split group payment links and offline Ed25519 QR claims (explicit v0.1 non-goals; replaced by single-buyer 1–6 ticket checkout + online HMAC-verified QR + WhatsApp PNG pass sharing).
- Removed decorative full-bleed crimson hero banner that pushed actual events below the fold on 375px mobile screens.

---

## 2. Visual Design System & UI Tokens (Campus Editorial Utility)

A tactile, high-contrast **Editorial Ticket** aesthetic grounded in Swiss typographic clarity and physical pass anatomy — zero generic AI indigo templates, zero decorative clutter.

| Token                         | Value                                          | Contrast / Rule                                 | Usage                                                                                            |
| :---------------------------- | :--------------------------------------------- | :---------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| **Canvas (Student & Admin)**  | `#FAF9F6` (Warm Alabaster)                     | Low outdoor glare                               | Primary page background                                                                          |
| **Surface (Card / Ticket)**   | `#FFFFFF` (Pure White)                         | `1px solid #E7E5E0` border                      | Event cards, tier selectors, perforated QR passes, admin panels                                  |
| **Surface Subtle**            | `#F3F1EC` (Warm Stone)                         | Soft container separation                       | Metadata pills, collapsed attendee chips, table headers                                          |
| **Ink Primary**               | `#111318` (Deep Charcoal)                      | 17.5:1 on `#FAF9F6` (AAA)                       | Headings, event titles, primary values                                                           |
| **Ink Secondary**             | `#57534E` (Warm Slate)                         | 6.8:1 on `#FFFFFF` (AA+)                        | Dates, venues, form hints, secondary captions                                                    |
| **Primary Brand Accent**      | `#1D4ED8` (Electric Cobalt)                    | 6.7:1 white text (AA+)                          | Primary CTAs, selected tier ring, active links, UPI trust cues                                   |
| **Primary Hover / Tint**      | `#1E40AF` / `#EFF6FF`                          | High legibility                                 | Button hover, selected card tint                                                                 |
| **Confirmed / Free / Allow**  | `#059669` (Signal Emerald)                     | + Checkmark icon                                | Free ₹0 CTAs, `VALID` / `CONFIRMED` badges, Green gate flash                                     |
| **Scarcity / Warning / Hold** | `#D97706` (Warm Amber) / `#EA580C` (Vermilion) | + Clock/Alert icon                              | `Selling Fast` (<20% left), <2m hold timer, `MANUAL_REFUND_NEEDED`, `INTERNAL — CHECK ID`        |
| **Denied / Error / Sold Out** | `#DC2626` (Signal Crimson)                     | + X-Octagon icon                                | Duplicate/invalid gate flash, form validation errors, `SOLD OUT`                                 |
| **Scanner Canvas**            | `#09090B` (True Obsidian)                      | Forced Dark Mode                                | `/scanner` & `/scanner/[eventId]` background (`#FAFAFA` ink)                                     |
| **Typography — UI**           | `Roboto Sans` (`--font-roboto-sans`)           | Bundled local variable TTF (0ms campus 4G load) | All UI copy, headings, buttons, and data (prices, codes, countdowns, KPIs)                       |
| **Typography — Data**         | `Roboto Sans` (`font-mono` maps to same font)  | `font-variant-numeric: tabular-nums`            | Prices (`₹300`), Roll Numbers (`23BCE1042`), 6-char codes (`A9X2K1`), countdowns (`06:48`), KPIs |
| **Touch Targets**             | Minimum `44px × 44px` (`48px` primary CTAs)    | WCAG 2.2 Target Size (AA)                       | Every button, stepper (`-`/`+`), tab, and bottom-sheet action                                    |

---

## 3. Website Sitemap & Route Guard Architecture (Next.js App Router)

Every route maps strictly to one of the 3 `profile_role` values (`STUDENT`, `VOLUNTEER`, `ADMIN`) or public discovery.

| Route                   | Allowed Roles                           | Layout Shell                     | Purpose                                                                                              |
| :---------------------- | :-------------------------------------- | :------------------------------- | :--------------------------------------------------------------------------------------------------- |
| `/`                     | Public (anon, all)                      | Student Top Nav                  | Compact editorial hero + filterable upcoming events feed (lowest _available_ price)                  |
| `/login`                | Public (anon)                           | Minimal Centered                 | Google Sign-In primary + Email 6-digit OTP fallback                                                  |
| `/onboarding`           | Authenticated (incomplete profile)      | Minimal Centered                 | One-time capture of Name, Roll Number, Department, Semester (+ External Guest toggle)                |
| `/events/[slug]`        | Public view; Auth to book               | Student Nav + Sticky Summary Bar | Event details, live tier capacity cards + Refresh, progressive attendee accordion                    |
| `/checkout/[bookingId]` | Owner (`STUDENT`, `VOLUNTEER`, `ADMIN`) | Distraction-Free Checkout Header | Progressive 7-min countdown, order summary, Razorpay checkout trigger & post-payment states          |
| `/my-tickets`           | Authenticated                           | Student Top Nav                  | Swipeable perforated QR passes (forced white QR quiet zone), WhatsApp Web Share & PNG export         |
| `/scanner`              | `VOLUNTEER`, `ADMIN`                    | Forced Dark Scanner Shell        | Select today's active event to launch camera gate scanner                                            |
| `/scanner/[eventId]`    | `VOLUNTEER`, `ADMIN`                    | Forced Dark Full-Screen          | Camera viewfinder, bottom thumb-zone Torch + Manual Roll No/Code sheet, 3-modal flash overlays       |
| `/admin`                | `ADMIN`                                 | Responsive Admin Sidebar         | Overview KPIs, `MANUAL_REFUND_NEEDED` priority alert queue, published/draft event list               |
| `/admin/events/new`     | `ADMIN`                                 | Responsive Admin Sidebar         | Create event + dynamic 1–4 tier builder (Paid or ₹0, `is_internal`, `max_per_order` 1–6)             |
| `/admin/events/[id]`    | `ADMIN`                                 | Responsive Admin Sidebar         | Live KPI strip, shareable link copy, 1-click OD Attendance CSV & Finance CSV exports, bookings table |
| `/admin/team`           | `ADMIN`                                 | Responsive Admin Sidebar         | Search registered users by email and switch role (`STUDENT` / `VOLUNTEER` / `ADMIN`)                 |

### Route Guard Redirect Rules

1. **Unauthenticated user** hitting `/checkout/*`, `/my-tickets`, `/scanner/*`, or `/admin/*` → redirect to `/login?next=<original_path>`.
2. **Authenticated `STUDENT` missing `roll_number` or `department`** (and not external) → redirect to `/onboarding?next=<original_path>`.
3. **Unauthorized role** (e.g., `STUDENT` visiting `/admin` or `/scanner`) → redirect to `/` with non-blocking toast: _"You don't have access to that workspace."_

---

## 4. End-to-End Workflows

### Workflow A: Student Booking Journey (Paid & ₹0 Free)

1. **Discover (`/`)**: Student sees upcoming published events immediately above the fold, filtered by status (`All`, `Free`, `Paid`). Each card displays Date/Time, Venue, Title, **lowest available tier price**, and availability indicator (`Selling Fast` when `< 20%` left, `Sold Out` when `0` left).
2. **Select Tier & Quantity (`/events/[slug]`)**:
   - Student picks an available tier (sold-out tiers remain visible at 60% opacity with `SOLD OUT` badge and disabled selection).
   - Quantity stepper (`1` to `tier.max_per_order`, max `6`) preserves already-entered attendee data when incremented/decremented.
   - `"Refresh counts"` button re-fetches live availability without clearing form state.
3. **Progressive Attendee Form**:
   - Ticket 1 auto-fills from the signed-in student's profile and renders as a compact verified summary card (`Rahul Sharma • 23BCE1042 • CSE • Sem 5` + `Edit`).
   - Friends `2..N` appear as collapsible cards; when `tier.is_internal === true`, a **1-tap "Same Dept & Sem as me"** button fills Department and Semester instantly.
   - When `tier.is_internal === false` (External Guest), Roll Number, Department, and Semester are hidden — only Full Name is required.
4. **Atomic Hold & Branching**:
   - Sticky bottom bar shows live total (`2 × ₹300 = ₹600 • ₹0 fee`) and adapts CTA: **"Confirm Free Tickets (₹0)"** vs **"Reserve & Continue to Pay"**.
   - If `total_amount_inr === 0`: instant `CONFIRMED` booking → redirect to `/my-tickets?booking=<id>`.
   - If `total_amount_inr > 0`: `PENDING` hold (`10m` DB expiry, `7m` UI timer) → redirect to `/checkout/[bookingId]`.
5. **Checkout (`/checkout/[bookingId]`)**:
   - Sticky countdown banner (calm cobalt `> 2:00`, amber `2:00–0:30`, crimson `< 0:30`).
   - Razorpay Standard Checkout CTA (`Pay ₹600 via UPI / Card`) + explicit UPI app trust row (`GPay • PhonePe • Paytm • UPI ID • Cards`).
   - Handles all 3 post-payment states cleanly: **Verifying (1–5s polling)**, **Timer Expired (`00:00`)**, and **Late Payment Sold Out (`MANUAL_REFUND_NEEDED`)** with Payment ID copy button and 3–5 day refund reassurance.

### Workflow B: Gate Volunteer Scanning Journey

1. **Event Picker (`/scanner`)**: Dark-mode list of today's published events showing live `Checked In / Sold` progress bar.
2. **Active Scanner (`/scanner/[eventId]`)**:
   - Top compact bar: Back to events, Event Title, live `Checked In: 184 / 450` counter (`tabular-nums`), Online status dot.
   - Center: Square camera viewfinder with animated corner reticle and subtle scan beam (respects `prefers-reduced-motion`).
   - Bottom thumb-zone dock (48px+ targets): **Torch Toggle** + **Manual Search (Roll No / 6-Char Code)** button.
   - Expandable **Recent Scans** drawer (last 5 scans on this device with time and status).
3. **3-Modal Full-Screen Flash Overlays**:
   - **ALLOW ENTRY** (`1.2s` auto-resume or tap): Full-screen `#059669` Emerald, large checkmark icon, rising Web Audio chime, `60ms` vibrate, high-contrast **INTERNAL — CHECK COLLEGE ID** amber pill (or **EXTERNAL GUEST** pill), Name + Roll No.
   - **ALREADY SCANNED** (`1.8s` or tap): Full-screen `#D97706` / `#DC2626` alert with duplicate-warning icon, double error buzz, `[150, 80, 150]` vibrate, **exact prior check-in time** (`Entered at 5:42 PM`), Name + Roll No.
   - **INVALID / WRONG EVENT** (`1.8s` or tap): Full-screen `#DC2626` Crimson, X-octagon icon, low error tone, `250ms` vibrate, clear reason.
   - **Dev Simulation Strip** (UI-first verification): Compact collapsible bar (`Sim: Valid Internal`, `Sim: Valid External`, `Sim: Duplicate`, `Sim: Invalid`) so volunteers/devs can test audio, vibration, and overlays without a live camera.

### Workflow C: Admin / Club Head Journey

1. **Overview (`/admin`)**:
   - Priority **Manual Refund Alert Banner** pinned at top whenever `MANUAL_REFUND_NEEDED > 0` with 1-click Copy Razorpay Payment ID and `"Mark Refunded"` action.
   - 4-card KPI strip: `Tickets Sold`, `Checked In (%)`, `Gross Revenue (₹)`, `Active Holds`.
   - Event table/cards with Publish status toggle, quick links to Event Detail and Gate Scanner.
2. **Create Event (`/admin/events/new`)**:
   - Event Details card (Title, auto-slugified editable `/events/[slug]`, Venue, Date/Time, Publish toggle).
   - Dynamic Tier Builder (1–4 tiers): Name, Price in ₹ (`0` = Free), Capacity, Max per order (`1–6`), `Requires College ID (Internal)` toggle.
3. **Event Operations (`/admin/events/[id]`)**:
   - Live KPI strip + **Copy Shareable Link** (Instagram Bio / WhatsApp ready).
   - **1-Click Exports**:
     - `Download OD Attendance CSV` — strictly `CHECKED_IN` internal tickets (`Roll Number, Name, Department, Semester, Tier, Check-In Time`).
     - `Download Finance Reconciliation CSV` — `CONFIRMED` + `MANUAL_REFUND_NEEDED` bookings (`Booking ID, Buyer Name, Email, Tier, Qty, Amount (INR), Status, Razorpay Payment ID, Timestamp`).
   - Tier capacity breakdown bars + filterable Bookings table (`All`, `Confirmed`, `Pending`, `Manual Refund`).
4. **Team & Roles (`/admin/team`)**:
   - Email search input + user list with inline `STUDENT` / `VOLUNTEER` / `ADMIN` role selector and instant saved toast.

---

## 5. Required UI States & Accessibility Checklist

Every screen implements all 4 core states plus WCAG 2.2 AA baselines:

| State / Standard              | Expected Behavior                                                                                                                                        |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Loading**                   | Layout-matched skeleton blocks (never a blank white screen or layout shift).                                                                             |
| **Empty**                     | Clear message + single primary action (`/my-tickets` → **Browse Events**; `/admin` → **Create First Event**).                                            |
| **Error**                     | Inline crimson error alert right beside the failing field/tier + top-center non-blocking toast with Retry. Never wipe typed form fields on error.        |
| **Sold Out**                  | Tier stays visible at 60% opacity with `SOLD OUT` badge and disabled selection; never advertised as the card's "From ₹X" price.                          |
| **Keyboard & Screen Readers** | Visible `2px` `#1D4ED8` focus rings, semantic `<main>`/`<nav>`/`<header>` landmarks, `aria-live="polite"` for live timers, toasts, and scanner verdicts. |
| **Motion & Contrast**         | `prefers-reduced-motion` disables scan-beam and flash transitions; all text meets WCAG AA (4.5:1 body, 3:1 large); no state communicated by color alone. |

---

## 6. UI-First Architecture (1-to-1 PostgreSQL 17 Mock Layer)

All screens run end-to-end on `apps/web/src/lib/mock-data.ts` + a client-side `CampusPassProvider` (`apps/web/src/lib/store.tsx`) whose TypeScript interfaces mirror `supabase/migrations/20261122173940_initial_schema.sql` 1-to-1:

- `Profile`, `EventRecord`, `TicketTier`, `Booking`, `Ticket`
- Full interactive state across routes (booking a ticket actually decrements live tier remaining capacity, creates a booking, transitions through `/checkout/[bookingId]` to `/my-tickets`, generates a scannable 6-char code that `/scanner/[eventId]` can check in, and immediately appears in `/admin/events/[id]` OD & Finance CSV exports!).
- Includes a subtle **Demo Role Switcher** in the header avatar dropdown (`Student` / `Volunteer` / `Admin`) so anyone reviewing the UI can click through every role's workflow seamlessly before Supabase Auth is wired.
