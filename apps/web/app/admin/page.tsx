"use client";

import Link from "next/link";
import React from "react";
import { AdminShell } from "../../components/admin-shell";
import { Icon } from "../../components/icons";
import {
  formatEventDate,
  formatEventTime,
  formatInr,
} from "../../src/lib/mock-data";
import { useCampusPass } from "../../src/lib/store";

export default function AdminDashboardPage() {
  const {
    events,
    tiers,
    bookings,
    tickets,
    profiles,
    resolveManualRefund,
    showToast,
  } = useCampusPass();

  const refundQueue = bookings.filter(
    (b) => b.status === "MANUAL_REFUND_NEEDED",
  );
  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED");
  const totalSold = confirmedBookings.reduce((s, b) => s + b.quantity, 0);
  const totalCheckedIn = tickets.filter(
    (t) => t.status === "CHECKED_IN",
  ).length;
  const grossRevenue = confirmedBookings.reduce(
    (s, b) => s + b.total_amount_inr,
    0,
  );
  const activeHolds = bookings.filter(
    (b) =>
      b.status === "PENDING" &&
      b.expires_at &&
      new Date(b.expires_at).getTime() > Date.now(),
  ).length;

  const copyPaymentId = async (paymentId: string | null) => {
    if (!paymentId) return;
    try {
      await navigator.clipboard.writeText(paymentId);
      showToast(`Copied ${paymentId}`, "success");
    } catch {
      showToast("Could not copy payment ID", "warning");
    }
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs font-semibold tracking-wider text-[#1D4ED8] uppercase">
            Organizer Overview
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
        </div>

        <Link
          href="/admin/events/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 text-sm font-semibold text-white hover:bg-[#1E40AF]"
        >
          <Icon name="plus" className="h-4 w-4" />
          <span>Create Event</span>
        </Link>
      </div>

      {/* Priority Alert Queue: MANUAL_REFUND_NEEDED */}
      {refundQueue.length > 0 && (
        <section
          aria-label="Manual refund alert queue"
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[#B45309]">
            <Icon name="alertTriangle" className="h-4 w-4" />
            <span>
              {refundQueue.length} Booking
              {refundQueue.length > 1 ? "s" : ""} Need Manual Refund on Razorpay
            </span>
          </div>
          <p className="mt-1 text-xs text-[#78716C]">
            Late UPI payments cleared after a tier sold out. Issue the refund in
            Razorpay Dashboard, then mark resolved here.
          </p>

          <div className="mt-3 space-y-2">
            {refundQueue.map((bk) => {
              const evt = events.find((e) => e.id === bk.event_id);
              const buyer = profiles.find((p) => p.id === bk.buyer_id);
              return (
                <div
                  key={bk.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-amber-200 bg-white p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111318]">
                      {buyer?.full_name ?? "Student"} ·{" "}
                      <span className="font-mono">
                        {formatInr(bk.total_amount_inr)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-[#57534E]">
                      {evt?.title} · Payment ID:{" "}
                      <span className="font-mono font-semibold text-[#111318]">
                        {bk.razorpay_payment_id}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyPaymentId(bk.razorpay_payment_id)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#E7E5E0] px-3 text-xs font-semibold text-[#111318] hover:bg-[#F3F1EC]"
                    >
                      <Icon name="copy" className="h-3.5 w-3.5" />
                      <span>Copy ID</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveManualRefund(bk.id)}
                      className="min-h-10 rounded-lg bg-[#111318] px-3 text-xs font-semibold text-white hover:bg-[#27272A]"
                    >
                      Mark Refunded
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* KPI Strip */}
      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#E7E5E0] bg-white p-4">
          <p className="text-xs font-medium text-[#57534E]">Tickets Sold</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#111318]">
            {totalSold}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E7E5E0] bg-white p-4">
          <p className="text-xs font-medium text-[#57534E]">
            Verified Check-Ins
          </p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#059669]">
            {totalCheckedIn}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E7E5E0] bg-white p-4">
          <p className="text-xs font-medium text-[#57534E]">Gross Revenue</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#111318]">
            {formatInr(grossRevenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E7E5E0] bg-white p-4">
          <p className="text-xs font-medium text-[#57534E]">Active Holds</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#1D4ED8]">
            {activeHolds}
          </p>
        </div>
      </section>

      {/* Events List */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-[#57534E] uppercase">
          Your Campus Events ({events.length})
        </h2>

        {events.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-[#D6D3CB] bg-white p-10 text-center">
            <p className="text-base font-semibold">No events created yet</p>
            <Link
              href="/admin/events/new"
              className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#1D4ED8] px-4 text-sm font-semibold text-white"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {events.map((event) => {
              const eventTiers = tiers.filter((t) => t.event_id === event.id);
              const capacity = eventTiers.reduce(
                (s, t) => s + t.total_capacity,
                0,
              );
              const sold = bookings
                .filter(
                  (b) => b.event_id === event.id && b.status === "CONFIRMED",
                )
                .reduce((s, b) => s + b.quantity, 0);
              const checked = tickets.filter(
                (t) => t.event_id === event.id && t.status === "CHECKED_IN",
              ).length;

              return (
                <div
                  key={event.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E7E5E0] bg-white p-5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          event.is_published
                            ? "bg-emerald-50 text-[#059669]"
                            : "bg-[#F3F1EC] text-[#57534E]"
                        }`}
                      >
                        {event.is_published ? "Published" : "Draft"}
                      </span>
                      <span className="font-mono text-xs text-[#57534E]">
                        {formatEventDate(event.starts_at)} ·{" "}
                        {formatEventTime(event.starts_at)}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-base font-semibold text-[#111318]">
                      {event.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#57534E]">
                      {event.venue_name} ·{" "}
                      <span className="font-mono">
                        {sold}/{capacity} sold · {checked} checked in
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/scanner/${event.id}`}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#E7E5E0] px-3 text-xs font-semibold text-[#111318] hover:bg-[#F3F1EC]"
                    >
                      <Icon name="qr" className="h-3.5 w-3.5" />
                      <span>Gate</span>
                    </Link>
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#111318] px-3.5 text-xs font-semibold text-white hover:bg-[#27272A]"
                    >
                      <span>Manage & Exports</span>
                      <Icon name="arrowRight" className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
