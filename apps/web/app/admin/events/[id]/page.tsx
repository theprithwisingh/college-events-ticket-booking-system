"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { AdminShell } from "../../../../components/admin-shell";
import { Icon } from "../../../../components/icons";
import {
  type BookingStatus,
  formatEventDate,
  formatEventTime,
  formatInr,
} from "../../../../src/lib/mock-data";
import { useCampusPass } from "../../../../src/lib/store";

function downloadCsv(filename: string, rows: string[][]) {
  const escapeCell = (value: string) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(escapeCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminEventDetailPage() {
  const params = useParams<{ id: string }>();
  const {
    events,
    tiers,
    bookings,
    tickets,
    profiles,
    getTierRemaining,
    togglePublishEvent,
    resolveManualRefund,
    showToast,
  } = useCampusPass();

  const [bookingFilter, setBookingFilter] = useState<"ALL" | BookingStatus>(
    "ALL",
  );

  const event = events.find((e) => e.id === params.id);
  const eventTiers = useMemo(
    () => tiers.filter((t) => t.event_id === params.id),
    [tiers, params.id],
  );
  const eventBookings = useMemo(
    () => bookings.filter((b) => b.event_id === params.id),
    [bookings, params.id],
  );
  const eventTickets = useMemo(
    () => tickets.filter((t) => t.event_id === params.id),
    [tickets, params.id],
  );

  if (!event) {
    return (
      <AdminShell>
        <div className="rounded-2xl border border-[#E7E5E0] bg-white p-8 text-center">
          <h1 className="text-lg font-semibold">Event not found</h1>
          <Link
            href="/admin"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#111318] px-4 text-sm font-semibold text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </AdminShell>
    );
  }

  const totalCapacity = eventTiers.reduce((s, t) => s + t.total_capacity, 0);
  const confirmedBookings = eventBookings.filter(
    (b) => b.status === "CONFIRMED",
  );
  const soldCount = confirmedBookings.reduce((s, b) => s + b.quantity, 0);
  const checkedInTickets = eventTickets.filter(
    (t) => t.status === "CHECKED_IN",
  );
  const checkedInInternal = checkedInTickets.filter((t) => {
    const tier = eventTiers.find((tr) => tr.id === t.tier_id);
    return tier?.is_internal;
  });
  const checkedInPct =
    soldCount > 0 ? Math.round((checkedInTickets.length / soldCount) * 100) : 0;
  const revenue = confirmedBookings.reduce((s, b) => s + b.total_amount_inr, 0);
  const pendingHolds = eventBookings
    .filter(
      (b) =>
        b.status === "PENDING" &&
        b.expires_at &&
        new Date(b.expires_at).getTime() > Date.now(),
    )
    .reduce((s, b) => s + b.quantity, 0);
  const refundNeeded = eventBookings.filter(
    (b) => b.status === "MANUAL_REFUND_NEEDED",
  );

  const visibleBookings =
    bookingFilter === "ALL"
      ? eventBookings
      : eventBookings.filter((b) => b.status === bookingFilter);

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}/events/${event.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(`Copied ${shareUrl}`, "success");
    } catch {
      showToast(shareUrl, "info");
    }
  };

  // Exact PRD columns: Roll Number, Name, Department, Semester, Tier, Check-In Time
  const handleExportOdCsv = () => {
    const rows: string[][] = [
      [
        "Roll Number",
        "Name",
        "Department",
        "Semester",
        "Tier",
        "Check-In Time",
      ],
      ...checkedInInternal.map((t) => {
        const tier = eventTiers.find((tr) => tr.id === t.tier_id);
        return [
          t.attendee_roll_no ?? "",
          t.attendee_name,
          t.attendee_dept ?? "",
          t.attendee_semester ?? "",
          tier?.name ?? "",
          t.checked_in_at
            ? new Date(t.checked_in_at).toLocaleString("en-IN")
            : "",
        ];
      }),
    ];
    downloadCsv(`${event.slug}-od-attendance.csv`, rows);
    showToast(
      `Exported ${checkedInInternal.length} verified OD rows`,
      "success",
    );
  };

  // Exact PRD columns: Booking ID, Buyer Name, Email, Tier, Qty, Amount (INR), Status, Razorpay Payment ID, Timestamp
  const handleExportFinanceCsv = () => {
    const financeRows = eventBookings.filter(
      (b) => b.status === "CONFIRMED" || b.status === "MANUAL_REFUND_NEEDED",
    );
    const rows: string[][] = [
      [
        "Booking ID",
        "Buyer Name",
        "Email",
        "Tier",
        "Qty",
        "Amount (INR)",
        "Status",
        "Razorpay Payment ID",
        "Timestamp",
      ],
      ...financeRows.map((b) => {
        const buyer = profiles.find((p) => p.id === b.buyer_id);
        const tier = eventTiers.find((tr) => tr.id === b.tier_id);
        return [
          b.id,
          buyer?.full_name ?? "Student",
          buyer?.email ?? "",
          tier?.name ?? "",
          String(b.quantity),
          String(b.total_amount_inr),
          b.status,
          b.razorpay_payment_id ?? "FREE_BYPASS",
          new Date(b.created_at).toLocaleString("en-IN"),
        ];
      }),
    ];
    downloadCsv(`${event.slug}-finance-reconciliation.csv`, rows);
    showToast(`Exported ${financeRows.length} finance rows`, "success");
  };

  return (
    <AdminShell>
      <Link
        href="/admin"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#57534E] hover:text-[#111318]"
      >
        <Icon name="arrowLeft" className="h-4 w-4" />
        <span>All Events</span>
      </Link>

      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                event.is_published
                  ? "bg-emerald-50 text-[#059669]"
                  : "bg-[#F3F1EC] text-[#57534E]"
              }`}
            >
              {event.is_published ? "Published" : "Draft"}
            </span>
            <span className="font-mono text-xs text-[#57534E]">
              {formatEventDate(event.starts_at)} ·{" "}
              {formatEventTime(event.starts_at)} · {event.venue_name}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">
            {event.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#E7E5E0] bg-white px-3 text-xs font-semibold text-[#111318] hover:bg-[#F3F1EC]"
          >
            <Icon name="copy" className="h-3.5 w-3.5" />
            <span>Copy Event Link</span>
          </button>
          <button
            type="button"
            onClick={() => togglePublishEvent(event.id)}
            className="min-h-10 rounded-lg border border-[#E7E5E0] bg-white px-3 text-xs font-semibold text-[#57534E] hover:text-[#111318]"
          >
            {event.is_published ? "Unpublish" : "Publish Now"}
          </button>
          <Link
            href={`/scanner/${event.id}`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#111318] px-3.5 text-xs font-semibold text-white hover:bg-[#27272A]"
          >
            <Icon name="qr" className="h-3.5 w-3.5" />
            <span>Open Scanner</span>
          </Link>
        </div>
      </div>

      {/* Refund Alert Banner */}
      {refundNeeded.length > 0 && (
        <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#B45309]">
            <Icon name="alertTriangle" className="h-4 w-4 shrink-0" />
            <span>
              {refundNeeded.length} booking needs manual Razorpay refund (
              {refundNeeded[0]?.razorpay_payment_id})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (refundNeeded[0]) resolveManualRefund(refundNeeded[0].id);
            }}
            className="min-h-10 shrink-0 rounded-lg bg-[#111318] px-3 text-xs font-semibold text-white"
          >
            Mark Refunded
          </button>
        </div>
      )}

      {/* Live KPI Strip */}
      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#E7E5E0] bg-white p-4">
          <p className="text-xs font-medium text-[#57534E]">Tickets Sold</p>
          <p className="mt-1 font-mono text-2xl font-semibold">
            {soldCount}{" "}
            <span className="text-sm font-normal text-[#78716C]">
              / {totalCapacity}
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-[#E7E5E0] bg-white p-4">
          <p className="text-xs font-medium text-[#57534E]">Checked In</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-[#059669]">
            {checkedInTickets.length}{" "}
            <span className="text-sm font-normal text-[#78716C]">
              ({checkedInPct}%)
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-[#E7E5E0] bg-white p-4">
          <p className="text-xs font-medium text-[#57534E]">Gross Revenue</p>
          <p className="mt-1 font-mono text-2xl font-semibold">
            {formatInr(revenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E7E5E0] bg-white p-4">
          <p className="text-xs font-medium text-[#57534E]">Pending Holds</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-[#1D4ED8]">
            {pendingHolds}
          </p>
        </div>
      </section>

      {/* 1-Click Faculty & Finance Exports */}
      <section className="mt-6 rounded-2xl border border-[#E7E5E0] bg-white p-5">
        <h2 className="text-sm font-semibold tracking-wide text-[#57534E] uppercase">
          1-Click Faculty & Finance Exports
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleExportOdCsv}
            className="flex min-h-12 items-center justify-between rounded-xl border border-[#059669]/30 bg-emerald-50/60 px-4 py-3 text-left hover:bg-emerald-50"
          >
            <div>
              <p className="text-sm font-semibold text-[#111318]">
                Download OD Attendance CSV
              </p>
              <p className="mt-0.5 font-mono text-xs text-[#059669]">
                {checkedInInternal.length} physically verified internal students
              </p>
            </div>
            <Icon name="download" className="h-5 w-5 text-[#059669]" />
          </button>

          <button
            type="button"
            onClick={handleExportFinanceCsv}
            className="flex min-h-12 items-center justify-between rounded-xl border border-[#1D4ED8]/25 bg-[#EFF6FF]/60 px-4 py-3 text-left hover:bg-[#EFF6FF]"
          >
            <div>
              <p className="text-sm font-semibold text-[#111318]">
                Download Finance Reconciliation CSV
              </p>
              <p className="mt-0.5 font-mono text-xs text-[#1D4ED8]">
                Confirmed + Manual Refund rows with Razorpay IDs
              </p>
            </div>
            <Icon name="download" className="h-5 w-5 text-[#1D4ED8]" />
          </button>
        </div>
      </section>

      {/* Ticket Tiers Breakdown */}
      <section className="mt-6 rounded-2xl border border-[#E7E5E0] bg-white p-5">
        <h2 className="text-sm font-semibold tracking-wide text-[#57534E] uppercase">
          Ticket Tiers
        </h2>
        <div className="mt-3 space-y-3">
          {eventTiers.map((tier) => {
            const remaining = getTierRemaining(tier.id);
            const used = tier.total_capacity - remaining;
            const pct = Math.min(
              100,
              Math.round((used / tier.total_capacity) * 100),
            );
            return (
              <div
                key={tier.id}
                className="rounded-xl border border-[#F3F1EC] bg-[#FAF9F6] p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#111318]">
                      {tier.name}
                    </span>
                    <span className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-[#57534E]">
                      {tier.is_internal ? "Internal (OD)" : "External"}
                    </span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#111318]">
                    {formatInr(tier.price_inr)} · {used}/{tier.total_capacity}{" "}
                    claimed
                  </div>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E7E5E0]">
                  <div
                    className={`h-full rounded-full ${
                      remaining === 0 ? "bg-[#DC2626]" : "bg-[#1D4ED8]"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bookings Table */}
      <section className="mt-6 rounded-2xl border border-[#E7E5E0] bg-white p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-sm font-semibold tracking-wide text-[#57534E] uppercase">
            Recent Bookings ({visibleBookings.length})
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "ALL", label: "All" },
                { id: "CONFIRMED", label: "Confirmed" },
                { id: "PENDING", label: "Pending" },
                { id: "MANUAL_REFUND_NEEDED", label: "Refund Needed" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setBookingFilter(f.id)}
                className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${
                  bookingFilter === f.id
                    ? "bg-[#111318] text-white"
                    : "bg-[#F3F1EC] text-[#57534E] hover:text-[#111318]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#E7E5E0] text-[#78716C]">
                <th className="py-2.5 pr-3 font-semibold">Booking</th>
                <th className="py-2.5 pr-3 font-semibold">Buyer</th>
                <th className="py-2.5 pr-3 font-semibold">Tier & Qty</th>
                <th className="py-2.5 pr-3 font-semibold">Amount</th>
                <th className="py-2.5 pr-3 font-semibold">Status</th>
                <th className="py-2.5 font-semibold">Razorpay ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F1EC]">
              {visibleBookings.map((b) => {
                const buyer = profiles.find((p) => p.id === b.buyer_id);
                const tier = eventTiers.find((t) => t.id === b.tier_id);
                return (
                  <tr key={b.id}>
                    <td className="py-3 pr-3 font-mono font-semibold text-[#111318]">
                      #{b.id.slice(-6)}
                    </td>
                    <td className="py-3 pr-3">
                      <p className="font-medium text-[#111318]">
                        {buyer?.full_name ?? "Student"}
                      </p>
                      <p className="text-[11px] text-[#78716C]">
                        {buyer?.email}
                      </p>
                    </td>
                    <td className="py-3 pr-3 text-[#57534E]">
                      {tier?.name} × {b.quantity}
                    </td>
                    <td className="py-3 pr-3 font-mono font-semibold text-[#111318]">
                      {formatInr(b.total_amount_inr)}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-50 text-[#059669]"
                            : b.status === "MANUAL_REFUND_NEEDED"
                              ? "bg-amber-50 text-[#D97706]"
                              : b.status === "PENDING"
                                ? "bg-[#EFF6FF] text-[#1D4ED8]"
                                : "bg-[#F3F1EC] text-[#57534E]"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-[#57534E]">
                      {b.razorpay_payment_id ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
