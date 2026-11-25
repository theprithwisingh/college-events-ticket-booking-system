"use client";

import Link from "next/link";
import React from "react";
import { Icon } from "../../components/icons";
import { ToastBanner } from "../../components/student-shell";
import { formatEventDate, formatEventTime } from "../../src/lib/mock-data";
import { useCampusPass } from "../../src/lib/store";

export default function ScannerEventPickerPage() {
  const { currentUser, switchDemoRole, events, tickets, tiers } =
    useCampusPass();

  const canScan =
    currentUser?.role === "VOLUNTEER" || currentUser?.role === "ADMIN";

  if (!canScan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4 text-[#FAFAFA]">
        <ToastBanner />
        <div className="max-w-sm rounded-2xl border border-white/10 bg-[#141418] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
            <Icon name="qr" className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold">
            Gate Scanner Restricted
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Only assigned Gate Volunteers or Admins can open the QR scanner.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => switchDemoRole("VOLUNTEER")}
              className="min-h-11 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Switch to Demo Volunteer
            </button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-medium text-zinc-200 hover:bg-white/5"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeEvents = events.filter((e) => e.is_published);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA]">
      <ToastBanner />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#09090B]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Icon name="qr" className="h-4 w-4" />
            </span>
            <div>
              <span className="block text-sm font-semibold leading-none">
                Gate Scanner
              </span>
              <span className="mt-0.5 block font-mono text-[10px] text-zinc-400 uppercase">
                Dark Auditorium Mode
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-lg border border-white/15 px-3 text-xs font-medium text-zinc-300 hover:bg-white/5"
          >
            Exit
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-xl font-semibold">Select Event Gate</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Choose an active event to launch camera QR verification and manual
          Roll No fallback.
        </p>

        <div className="mt-5 space-y-3">
          {activeEvents.map((event) => {
            const eventTickets = tickets.filter((t) => t.event_id === event.id);
            const checkedIn = eventTickets.filter(
              (t) => t.status === "CHECKED_IN",
            ).length;
            const totalCap = tiers
              .filter((t) => t.event_id === event.id)
              .reduce((s, t) => s + t.total_capacity, 0);
            const pct =
              eventTickets.length > 0
                ? Math.round((checkedIn / eventTickets.length) * 100)
                : 0;

            return (
              <Link
                key={event.id}
                href={`/scanner/${event.id}`}
                className="block rounded-2xl border border-white/10 bg-[#141418] p-4 transition-colors hover:border-emerald-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-emerald-400">
                      {formatEventDate(event.starts_at)} ·{" "}
                      {formatEventTime(event.starts_at)}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-white">
                      {event.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {event.venue_name}
                    </p>
                  </div>
                  <span className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl bg-emerald-500 px-3.5 text-xs font-semibold text-zinc-950">
                    <span>Open</span>
                    <Icon name="arrowRight" className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
                    <span>
                      Checked In: {checkedIn} / {eventTickets.length} issued (
                      {totalCap} cap)
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
