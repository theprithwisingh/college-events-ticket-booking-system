"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { Icon } from "../../components/icons";
import { exportTicketPng, QRCodeSVG } from "../../components/qr-code";
import { StudentNavbar } from "../../components/student-shell";
import {
  formatEventDate,
  formatEventTime,
  type Ticket,
} from "../../src/lib/mock-data";
import { useCampusPass } from "../../src/lib/store";

export default function MyTicketsPage() {
  const { currentUser, bookings, tickets, events, tiers, showToast } =
    useCampusPass();
  const [activeIndexByEvent, setActiveIndexByEvent] = useState<
    Record<string, number>
  >({});

  const myTicketsByEvent = useMemo(() => {
    if (!currentUser) return [];
    const myBookingIds = new Set(
      bookings
        .filter(
          (b) => b.buyer_id === currentUser.id && b.status === "CONFIRMED",
        )
        .map((b) => b.id),
    );
    const mine = tickets.filter(
      (t) => myBookingIds.has(t.booking_id) && t.status !== "CANCELLED",
    );

    const map = new Map<string, Ticket[]>();
    mine.forEach((t) => {
      const list = map.get(t.event_id) ?? [];
      list.push(t);
      map.set(t.event_id, list);
    });

    return Array.from(map.entries()).map(([eventId, eventTickets]) => ({
      event: events.find((e) => e.id === eventId),
      tickets: eventTickets,
    }));
  }, [currentUser, bookings, tickets, events]);

  const handleDownloadOrShare = async (
    ticket: Ticket,
    mode: "share" | "download",
  ) => {
    const event = events.find((e) => e.id === ticket.event_id);
    const tier = tiers.find((t) => t.id === ticket.tier_id);
    if (!event || !tier) return;

    const attendeeMeta = ticket.attendee_roll_no
      ? `${ticket.attendee_roll_no} • ${ticket.attendee_dept ?? ""} • Sem ${ticket.attendee_semester ?? ""}`
      : "External Guest Pass";

    const blob = await exportTicketPng({
      eventTitle: event.title,
      dateTime: `${formatEventDate(event.starts_at)} · ${formatEventTime(event.starts_at)}`,
      venue: event.venue_name,
      tierName: tier.name,
      isInternal: tier.is_internal,
      attendeeName: ticket.attendee_name,
      attendeeMeta,
      ticketCode: ticket.ticket_code,
      qrPayload: ticket.qr_signature,
    });

    if (!blob) {
      showToast("Could not render ticket image", "error");
      return;
    }

    const file = new File([blob], `CampusPass-${ticket.ticket_code}.png`, {
      type: "image/png",
    });

    if (
      mode === "share" &&
      typeof navigator !== "undefined" &&
      navigator.share &&
      navigator.canShare?.({ files: [file] })
    ) {
      try {
        await navigator.share({
          title: `${event.title} — ${ticket.attendee_name}`,
          text: `CampusPass ticket for ${event.title} (Code: ${ticket.ticket_code})`,
          files: [file],
        });
        return;
      } catch {
        // Fall through to PNG download if share cancelled/unsupported
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CampusPass-${ticket.ticket_code}.png`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(
      mode === "share"
        ? "Saved pass PNG — attach it in WhatsApp"
        : `Downloaded CampusPass-${ticket.ticket_code}.png`,
      "success",
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-16 text-[#111318]">
      <StudentNavbar />

      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        <div className="flex items-end justify-between border-b border-[#E7E5E0] pb-4">
          <div>
            <p className="font-mono text-xs font-semibold tracking-wider text-[#1D4ED8] uppercase">
              Gate Pass Vault
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              My Tickets
            </h1>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-[#1D4ED8] hover:underline"
          >
            Browse Events
          </Link>
        </div>

        {!currentUser ? (
          <div className="mt-8 rounded-2xl border border-[#E7E5E0] bg-white p-8 text-center">
            <h2 className="text-base font-semibold">Sign in to view passes</h2>
            <p className="mt-1 text-sm text-[#57534E]">
              Your confirmed QR tickets and OD verification status live here.
            </p>
            <Link
              href="/login?next=/my-tickets"
              className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#1D4ED8] px-5 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          </div>
        ) : myTicketsByEvent.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#D6D3CB] bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F1EC] text-[#57534E]">
              <Icon name="ticket" className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-base font-semibold">No tickets yet</h2>
            <p className="mt-1 text-sm text-[#57534E]">
              Book a free or paid campus event pass and your scannable QR will
              appear here immediately.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-5 text-sm font-semibold text-white hover:bg-[#1E40AF]"
            >
              <span>Browse Events</span>
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {myTicketsByEvent.map(({ event, tickets: group }) => {
              if (!event) return null;
              const currentIdx = Math.min(
                activeIndexByEvent[event.id] ?? 0,
                group.length - 1,
              );
              const activeTicket = group[currentIdx];
              if (!activeTicket) return null;
              const tier = tiers.find((t) => t.id === activeTicket.tier_id);
              const isCheckedIn = activeTicket.status === "CHECKED_IN";

              return (
                <section key={event.id} aria-label={event.title}>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-[#111318]">
                        {event.title}
                      </h2>
                      <p className="font-mono text-xs text-[#57534E]">
                        {formatEventDate(event.starts_at)} ·{" "}
                        {formatEventTime(event.starts_at)} · {event.venue_name}
                      </p>
                    </div>
                    {group.length > 1 && (
                      <span className="rounded-full bg-[#F3F1EC] px-2.5 py-1 font-mono text-xs font-semibold text-[#111318]">
                        {currentIdx + 1} / {group.length}
                      </span>
                    )}
                  </div>

                  {/* Perforated Editorial Ticket Card */}
                  <div className="overflow-hidden rounded-2xl border border-[#E7E5E0] bg-white shadow-xs">
                    {/* High-contrast Gate ID Requirement Banner */}
                    <div
                      className={`px-4 py-2.5 text-center font-mono text-xs font-semibold tracking-wide uppercase ${
                        tier?.is_internal
                          ? "bg-[#D97706] text-white"
                          : "bg-[#1D4ED8] text-white"
                      }`}
                    >
                      {tier?.is_internal
                        ? "Internal Pass — Bring Physical College ID"
                        : "External Guest Pass — Valid Govt ID"}
                    </div>

                    {/* QR Section (Forced pure white surface & 16px quiet zone) */}
                    <div className="flex flex-col items-center px-6 pt-6 pb-5">
                      <QRCodeSVG value={activeTicket.qr_signature} size={208} />

                      <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F3F1EC] px-3 py-1.5">
                        <span className="text-[11px] font-medium text-[#57534E]">
                          FALLBACK CODE
                        </span>
                        <span className="font-mono text-sm font-bold tracking-widest text-[#111318]">
                          {activeTicket.ticket_code}
                        </span>
                      </div>
                    </div>

                    {/* Perforation Divider */}
                    <div className="relative flex items-center">
                      <div className="h-5 w-2.5 rounded-r-full border-y border-r border-[#E7E5E0] bg-[#FAF9F6]" />
                      <div className="mx-2 flex-1 border-t-2 border-dashed border-[#E7E5E0]" />
                      <div className="h-5 w-2.5 rounded-l-full border-y border-l border-[#E7E5E0] bg-[#FAF9F6]" />
                    </div>

                    {/* Attendee Metadata & Live Gate Status */}
                    <div className="px-6 py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-[#111318]">
                            {activeTicket.attendee_name}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-[#57534E]">
                            {activeTicket.attendee_roll_no
                              ? `${activeTicket.attendee_roll_no} · ${activeTicket.attendee_dept} · Sem ${activeTicket.attendee_semester}`
                              : "External Guest"}
                          </p>
                          <p className="mt-1 text-xs text-[#78716C]">
                            {tier?.name}
                          </p>
                        </div>

                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#059669]">
                            <Icon name="checkCircle" className="h-3.5 w-3.5" />
                            Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
                            <span className="h-2 w-2 rounded-full bg-[#1D4ED8]" />
                            Valid Pass
                          </span>
                        )}
                      </div>

                      {isCheckedIn && activeTicket.checked_in_at && (
                        <div className="mt-3 rounded-lg bg-emerald-50/70 px-3 py-2 text-xs text-[#059669]">
                          Gate verified at{" "}
                          <span className="font-mono font-semibold">
                            {formatEventTime(activeTicket.checked_in_at)}
                          </span>{" "}
                          · Included in official OD Attendance sheet.
                        </div>
                      )}

                      {/* Share & Download Actions */}
                      <div className="mt-5 grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadOrShare(activeTicket, "share")
                          }
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#111318] px-3 text-xs font-semibold text-white hover:bg-[#27272A]"
                        >
                          <Icon name="share" className="h-4 w-4" />
                          <span>Share Pass</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadOrShare(activeTicket, "download")
                          }
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#E7E5E0] bg-white px-3 text-xs font-semibold text-[#111318] hover:bg-[#F3F1EC]"
                        >
                          <Icon name="download" className="h-4 w-4" />
                          <span>Save PNG</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Multi-ticket Switcher */}
                  {group.length > 1 && (
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        type="button"
                        disabled={currentIdx === 0}
                        onClick={() =>
                          setActiveIndexByEvent((prev) => ({
                            ...prev,
                            [event.id]: Math.max(0, currentIdx - 1),
                          }))
                        }
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#E7E5E0] bg-white px-3 text-xs font-semibold text-[#111318] disabled:opacity-40"
                      >
                        <Icon name="arrowLeft" className="h-3.5 w-3.5" />
                        <span>Previous</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {group.map((t, idx) => (
                          <button
                            key={t.id}
                            type="button"
                            aria-label={`View ticket ${idx + 1}: ${t.attendee_name}`}
                            onClick={() =>
                              setActiveIndexByEvent((prev) => ({
                                ...prev,
                                [event.id]: idx,
                              }))
                            }
                            className={`h-2.5 rounded-full transition-all ${
                              idx === currentIdx
                                ? "w-6 bg-[#1D4ED8]"
                                : "w-2.5 bg-[#D6D3CB]"
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={currentIdx === group.length - 1}
                        onClick={() =>
                          setActiveIndexByEvent((prev) => ({
                            ...prev,
                            [event.id]: Math.min(
                              group.length - 1,
                              currentIdx + 1,
                            ),
                          }))
                        }
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#E7E5E0] bg-white px-3 text-xs font-semibold text-[#111318] disabled:opacity-40"
                      >
                        <span>Next</span>
                        <Icon name="arrowRight" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
