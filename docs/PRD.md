# Product Requirements Document (PRD) — CampusPass v0.1 (Pilot MVP)

**Document Version:** 0.1

**Target Scale:** 1 Pilot College Event (200–500 Attendees)

**Tech Stack:** Next.js (App Router, TypeScript), Supabase (Auth + PostgreSQL 17 + RLS), Razorpay Standard Checkout

## 1. Goal & Core Value Proposition

Replace chaotic Google Forms, fake UPI screenshots, and manual Excel OD sheets for one live college event with a clean, crash-proof loop:

1. **Zero Overselling:** Atomic PostgreSQL capacity locking for both paid and ₹0 free events.
2. **Instant Gate Verification:** Mobile web QR scanner that blocks duplicate/screenshot entries in under 1.5 seconds.
3. **1-Click Faculty & Finance Exports:** Clean CSV downloads of physically verified On-Duty (OD) attendees and Razorpay payment IDs.

---

## 2. Simplified Roles (3 Roles Only)

| Role                                  | Access Routes                      | Capabilities                                                                                                                                         |
| ------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ADMIN`** _(Club Head / Organizer)_ | `/admin/**`                        | Create/publish events, configure ticket tiers, assign volunteer emails, view live stats, export OD & Finance CSVs, view `MANUAL_REFUND_NEEDED` flags |
| **`VOLUNTEER`** _(Gate Staff)_        | `/scanner/**`                      | Scan QR tickets via phone camera, run manual Roll Number check-in fallback, see Green/Red entry status                                               |
| **`STUDENT`** _(Internal / Guest)_    | `/`, `/events/[id]`, `/my-tickets` | Sign in, book 1–6 tickets per order, pay via Razorpay (or confirm ₹0), view & WhatsApp-share individual QR passes                                    |

_Role management in v0.1 is stored directly in `profiles.role` and enforced via Supabase Row-Level Security (RLS) + server-side checks. No Redis permission cache needed._

---

## 3. Core Feature Scope & Acceptance Criteria

### M1. Zero-Friction Auth & Self-Declared Student Profile

- **Flow:** Supabase Auth with **Google Sign-In** (plus Email OTP fallback).
- **Onboarding Modal:** On first login, users enter `full_name`, `roll_number`, `department`, and `semester` once.
- **Pilot Trade-off:** No College SSO or Admin CSV Roster upload in v0.1. Students self-declare their Roll Number; gate volunteers visually verify physical College ID cards for internal-tier passes.

### M2. Event & Tier-Based Capacity Management (Admin)

- **Event Creation:** Admin sets Title, Description, Venue Name, Date/Time, and publishes/unpublishes the event.
- **Ticket Tiers (Replaces Visual Seat Map for v0.1):** Admin defines 1 to 4 tiers per event (e.g., `Internal Student — ₹300`, `External Guest — ₹500`, `Free Workshop Pass — ₹0`), each with an exact `total_capacity` and `max_per_order` (default: 6).
- **Live Availability:** Displayed on the event page via standard fetch + a manual `"Refresh Availability"` button (or lightweight 10-second polling while active).

### M3. Atomic Booking, Lazy Lock Expiry & Razorpay Checkout

- **Step 1 — Attendee Details First:** On `/events/[id]`, the student picks a tier, selects quantity (1–6), and fills each friend's Name, Roll Number, Department, and Semester _before_ locking inventory. (No Roll Number directory lookup API = zero PII scraping risk.)
- **Step 2 — Atomic Reservation (`POST /api/bookings/initiate`):**
- Calls a single Supabase PostgreSQL RPC (`reserve_tier_capacity`) that runs `SELECT ... FROM ticket_tiers WHERE id = $1 FOR UPDATE NOWAIT`.
- **Lazy Expiry (Zero Cron Jobs):** Inside the same transaction, the RPC first counts active `PENDING` holds where `expires_at` is in the future, ignoring expired holds automatically.
- If remaining capacity is sufficient, inserts a `PENDING` booking with `expires_at = NOW() + INTERVAL '10 minutes'` (UI displays a **7-minute** timer, creating an automatic 3-minute buffer for slow UPI bank webhooks).

- **Step 3A — Free Event Bypass (`total_amount_inr == 0`):** Skips Razorpay completely, marks booking `CONFIRMED`, and generates individual HMAC-SHA256 signed QR tickets immediately.
- **Step 3B — Paid Checkout (`total_amount_inr` greater than 0):** Creates a Razorpay Order for the exact immutable amount and opens **Razorpay Standard Checkout** (natively handles UPI Intent, UPI ID/VPA, QR fallback, cards, and Instagram/WhatsApp WebViews without custom deep-link code).
- **Step 4 — Idempotent Webhook (`POST /api/webhooks/razorpay`):**
- Verifies Razorpay HMAC signature and checks `bookings.razorpay_payment_id` uniqueness.
- Locks the tier row, confirms the booking if it is still within capacity, and mints individual `tickets` rows.
- **Manual Refund Escape Hatch:** If a very late webhook arrives after the 10-minute window _and_ the tier is now 100% sold out, marks the booking `MANUAL_REFUND_NEEDED` and highlights it in the Admin dashboard. The organizer issues the refund in 30 seconds from the Razorpay Dashboard.

- **Step 5 — Ticket Vault (`/my-tickets`):** Displays swipeable QR cards (`Ticket 1 of 3`) with a **"Share on WhatsApp"** link/image button for each friend.

### M4. Online Mobile Web QR Scanner & 1-Click CSV Exports

- **Scanner (`/scanner`):** Mobile-first web page using `html5-qrcode` (camera viewfinder + torch toggle). Requires a standard 4G/hotspot connection at the auditorium entrance.
- **Atomic Check-In (`POST /api/scanner/checkin`):**
- Verifies the QR's HMAC-SHA256 signature and runs a single atomic SQL update:

```sql
UPDATE tickets
SET status = 'CHECKED_IN', checked_in_at = NOW(), scanned_by = $1
WHERE id = $2 AND event_id = $3 AND status = 'VALID'
RETURNING *;

```

- **Instant Full-Screen Feedback (1.2s flash + audio beep + vibration):**
- **Green (`#10B981`):** `ALLOW ENTRY` • Tier Badge (`INTERNAL — CHECK ID` / `EXTERNAL`) • Name & Roll No.
- **Red (`#EF4444`):** `ALREADY SCANNED` (shows exact check-in time) OR `INVALID / WRONG EVENT`.

- **Cracked Screen Fallback:** Manual search box on `/scanner` to look up an attendee by Roll Number or 6-character Booking Code and tap `"Mark Checked In"`.

- **Admin CSV Exports (`/admin/events/[id]`):**
- **OD Attendance CSV:** Exports only tickets where `status = 'CHECKED_IN'` (Columns: `Roll Number, Name, Department, Semester, Tier, Check-In Time`). No-shows are automatically excluded.
- **Finance Reconciliation CSV:** Exports all `CONFIRMED` and `MANUAL_REFUND_NEEDED` bookings (Columns: `Booking ID, Buyer Name, Email, Tier, Qty, Amount (INR), Status, Razorpay Payment ID, Timestamp`).

---

## 4. Minimal Supabase PostgreSQL 17 Schema (5 Tables)

| Table              | Key Columns                                                                                                                                                                                                                                  | Purpose                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **`profiles`**     | `id (FK auth.users)`, `email`, `full_name`, `roll_number`, `department`, `semester`, `role` (`STUDENT` / `VOLUNTEER` / `ADMIN`)                                                                                                              | User identity and simple role checks          |
| **`events`**       | `id`, `slug`, `title`, `venue_name`, `starts_at`, `is_published`, `created_by`                                                                                                                                                               | Core event metadata                           |
| **`ticket_tiers`** | `id`, `event_id`, `name`, `is_internal`, `price_inr`, `total_capacity`, `max_per_order`                                                                                                                                                      | Capacity buckets (supports ₹0 and paid tiers) |
| **`bookings`**     | `id`, `event_id`, `tier_id`, `buyer_id`, `quantity`, `total_amount_inr`, `status` (`PENDING` / `CONFIRMED` / `EXPIRED` / `MANUAL_REFUND_NEEDED`), `attendees_json`, `razorpay_order_id`, `razorpay_payment_id (UNIQUE)`, `expires_at`        | Atomic reservation & payment audit trail      |
| **`tickets`**      | `id`, `booking_id`, `event_id`, `tier_id`, `ticket_code (6-char)`, `attendee_name`, `attendee_roll_no`, `attendee_dept`, `attendee_semester`, `qr_signature`, `status` (`VALID` / `CHECKED_IN` / `CANCELLED`), `checked_in_at`, `scanned_by` | Individual QR passes & OD source of truth     |

_Note on Inventory Math:_ Available capacity is computed atomically inside `reserve_tier_capacity()` as:
`total_capacity - SUM(confirmed quantities) - SUM(active pending quantities where expires_at > NOW())`.
Because expired pending bookings naturally drop out of the sum, you never need a background cron worker to release abandoned carts.

---

## 5. Strict Non-Goals (Explicitly Cut from v0.1)

Do **not** write code for any of the following during the 7–10 day pilot sprint:

- Visual 2D auditorium seat-picking (HTML5 Canvas / SVG editor)
- Redis caching, Redis Pub/Sub, BullMQ workers, or SSE live streams
- Offline IndexedDB PWA, Ed25519 asymmetric manifests, or local LAN sync relays
- College SAML/OIDC SSO or Admin CSV Student Roster imports
- Automated Razorpay Refund API integration
- Split group payments, P2P ticket transfers, or PDF certificates
- Multi-tenant college onboarding or subscription billing

## 6. Pilot Launch Success Criteria

- **Zero Overselling:** 0 confirmed tickets above `total_capacity` during peak registration bursts.
- **Gate Speed:** Average camera scan-to-green confirmation under 1.5 seconds on mobile 4G/hotspot.
- **Clean Handoff:** Faculty Coordinator receives a ready-to-submit OD CSV within 60 seconds of event start with zero manual spreadsheet cleanup.
