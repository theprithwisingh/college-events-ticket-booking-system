"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Icon } from "../../../components/icons";
import { ToastBanner } from "../../../components/student-shell";
import {
  formatEventDate,
  formatEventTime,
  formatInr,
} from "../../../src/lib/mock-data";
import { useCampusPass } from "../../../src/lib/store";

export default function CheckoutPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const {
    bookings,
    events,
    tiers,
    confirmBookingPayment,
    expireBooking,
    flagBookingManualRefund,
    showToast,
  } = useCampusPass();

  const booking = bookings.find((b) => b.id === params.bookingId);
  const event = booking
    ? events.find((e) => e.id === booking.event_id)
    : undefined;
  const tier = booking
    ? tiers.find((t) => t.id === booking.tier_id)
    : undefined;

  const [secondsLeft, setSecondsLeft] = useState<number>(420); // 7:00 UI timer (10m DB hold)
  const [phase, setPhase] = useState<
    "ready" | "verifying" | "expired" | "refund"
  >(() => {
    if (!booking) return "ready";
    if (booking.status === "EXPIRED") return "expired";
    if (booking.status === "MANUAL_REFUND_NEEDED") return "refund";
    return "ready";
  });

  useEffect(() => {
    if (phase !== "ready" || !booking || booking.status !== "PENDING") return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          expireBooking(booking.id);
          setPhase("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase, booking, expireBooking]);

  if (!booking || !event || !tier) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] px-4">
        <div className="max-w-sm rounded-2xl border border-[#E7E5E0] bg-white p-6 text-center">
          <h1 className="text-lg font-semibold">Booking not found</h1>
          <p className="mt-1 text-sm text-[#57534E]">
            This reservation may have expired or does not belong to your
            account.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#111318] px-4 text-sm font-semibold text-white"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  // Progressive urgency timer (Research: avoid panic red at 07:00 during UPI switching)
  const timerTone =
    secondsLeft <= 30
      ? "border-red-200 bg-red-50 text-[#DC2626]"
      : secondsLeft <= 120
        ? "border-amber-200 bg-amber-50 text-[#D97706]"
        : "border-[#1D4ED8]/20 bg-[#EFF6FF] text-[#1D4ED8]";

  const handlePayNow = () => {
    setPhase("verifying");
    window.setTimeout(() => {
      confirmBookingPayment(booking.id);
      router.push(`/my-tickets?booking=${booking.id}`);
    }, 1200);
  };

  const handleSimulateLateRefund = () => {
    flagBookingManualRefund(booking.id);
    setPhase("refund");
  };

  const handleCancelHold = () => {
    expireBooking(booking.id);
    showToast("Reservation released back to live capacity", "info");
    router.push(`/events/${event.slug}`);
  };

  const copyPaymentId = async () => {
    if (!booking.razorpay_payment_id) return;
    try {
      await navigator.clipboard.writeText(booking.razorpay_payment_id);
      showToast("Copied Razorpay Payment ID", "success");
    } catch {
      showToast("Unable to access clipboard", "warning");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-16 text-[#111318]">
      <ToastBanner />

      {/* Distraction-free Checkout Header */}
      <header className="sticky top-0 z-30 border-b border-[#E7E5E0] bg-white">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <button
            type="button"
            onClick={handleCancelHold}
            className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#57534E] hover:text-[#111318]"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            <span>Cancel Hold</span>
          </button>
          <span className="text-sm font-semibold">Complete Booking</span>
          <span className="font-mono text-xs text-[#78716C]">
            #{booking.id.slice(-5)}
          </span>
        </div>

        {phase === "ready" && (
          <div
            role="status"
            aria-live="polite"
            className={`border-t px-4 py-2 text-center font-mono text-xs font-semibold ${timerTone}`}
          >
            Holding {booking.quantity} ticket{booking.quantity > 1 ? "s" : ""}{" "}
            for {mm}:{ss}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        {phase === "verifying" ? (
          <div className="rounded-2xl border border-[#E7E5E0] bg-white p-8 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-[#E7E5E0] border-t-[#1D4ED8]" />
            <h1 className="mt-4 text-lg font-semibold">
              Payment received — generating QR passes
            </h1>
            <p className="mt-1.5 text-sm text-[#57534E]">
              Verifying Razorpay signature and minting individual passes. Do not
              close this tab.
            </p>
          </div>
        ) : phase === "expired" ? (
          <div className="rounded-2xl border border-[#E7E5E0] bg-white p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[#DC2626]">
              <Icon name="clock" className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-lg font-semibold">
              Your 7-minute hold expired
            </h1>
            <p className="mt-1.5 text-sm text-[#57534E]">
              Unpaid seats were automatically released back to live availability
              so other students can book.
            </p>
            <Link
              href={`/events/${event.slug}`}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#111318] px-4 text-sm font-semibold text-white hover:bg-[#27272A]"
            >
              Back to {event.title}
            </Link>
          </div>
        ) : phase === "refund" ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[#D97706]">
                <Icon name="alertTriangle" className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-base font-semibold text-[#111318]">
                  Tickets sold out before your payment cleared
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-[#57534E]">
                  Do not worry — your payment has been automatically flagged for
                  a full refund by the organizers (3–5 working days to your
                  original UPI / card).
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-white px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold text-[#78716C] uppercase">
                  Razorpay Payment ID
                </p>
                <p className="font-mono text-sm font-semibold text-[#111318]">
                  {booking.razorpay_payment_id ?? "pay_Late99182x"}
                </p>
              </div>
              <button
                type="button"
                onClick={copyPaymentId}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#E7E5E0] px-3 text-xs font-semibold text-[#111318] hover:bg-[#F3F1EC]"
              >
                <Icon name="copy" className="h-3.5 w-3.5" />
                <span>Copy ID</span>
              </button>
            </div>

            <Link
              href="/"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#111318] text-sm font-semibold text-white"
            >
              Return to Events
            </Link>
          </div>
        ) : (
          <>
            {/* Order Summary */}
            <section className="rounded-2xl border border-[#E7E5E0] bg-white p-5">
              <p className="font-mono text-xs font-semibold tracking-wider text-[#78716C] uppercase">
                Order Summary
              </p>
              <h1 className="mt-1.5 text-lg font-semibold text-[#111318]">
                {event.title}
              </h1>
              <p className="mt-0.5 text-xs text-[#57534E]">
                {formatEventDate(event.starts_at)} ·{" "}
                {formatEventTime(event.starts_at)} · {event.venue_name}
              </p>

              <div className="mt-4 rounded-xl bg-[#FAF9F6] p-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[#111318]">
                    {tier.name} × {booking.quantity}
                  </span>
                  <span className="font-mono font-semibold">
                    {formatInr(booking.total_amount_inr)}
                  </span>
                </div>

                <ul className="mt-3 space-y-1.5 border-t border-[#E7E5E0] pt-3">
                  {booking.attendees_json.map((att, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between text-xs text-[#57534E]"
                    >
                      <span className="font-medium text-[#111318]">
                        {idx + 1}. {att.attendee_name}
                      </span>
                      <span className="font-mono">
                        {att.attendee_roll_no
                          ? `${att.attendee_roll_no} (${att.attendee_dept})`
                          : "External Guest"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#F3F1EC] pt-4">
                <div>
                  <p className="text-sm font-semibold text-[#111318]">
                    Total Payable
                  </p>
                  <p className="text-xs text-[#059669]">
                    ₹0 convenience or platform fee
                  </p>
                </div>
                <span className="font-mono text-2xl font-semibold text-[#111318]">
                  {formatInr(booking.total_amount_inr)}
                </span>
              </div>
            </section>

            {/* Primary Razorpay Payment Action */}
            <section className="mt-4 rounded-2xl border border-[#E7E5E0] bg-white p-5">
              <button
                type="button"
                onClick={handlePayNow}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-5 text-sm font-semibold text-white hover:bg-[#1E40AF]"
              >
                <Icon name="shield" className="h-4 w-4" />
                <span>
                  Pay {formatInr(booking.total_amount_inr)} via UPI / Card
                </span>
              </button>

              <p className="mt-3 text-center text-xs text-[#57534E]">
                Secured by Razorpay · GPay, PhonePe, Paytm, UPI ID & Cards
              </p>
            </section>

            {/* UI-First Preview Controls for testing edge states */}
            <section className="mt-6 rounded-xl border border-dashed border-[#D6D3CB] bg-white/70 p-3.5">
              <p className="font-mono text-[11px] font-semibold text-[#78716C] uppercase">
                UI State Preview (Demo Mode)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    expireBooking(booking.id);
                    setPhase("expired");
                  }}
                  className="min-h-9 rounded-lg border border-[#E7E5E0] bg-white px-3 text-xs font-medium text-[#57534E] hover:text-[#111318]"
                >
                  Simulate Timer Expired
                </button>
                <button
                  type="button"
                  onClick={handleSimulateLateRefund}
                  className="min-h-9 rounded-lg border border-[#E7E5E0] bg-white px-3 text-xs font-medium text-[#D97706] hover:bg-amber-50"
                >
                  Simulate Late Payment Refund
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
