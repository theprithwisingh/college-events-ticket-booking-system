"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "../../../components/icons";
import { formatEventTime } from "../../../src/lib/mock-data";
import { type CheckInResult, useCampusPass } from "../../../src/lib/store";

function playGateTone(type: "allow" | "duplicate" | "invalid") {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "allow") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(1180, now + 0.14);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === "duplicate") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(240, now + 0.15);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.34);
    } else {
      osc.type = "square";
      osc.frequency.setValueAtTime(190, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    }
  } catch {
    // Audio playback blocked before user gesture
  }
}

interface RecentScan {
  id: number;
  outcome: CheckInResult["outcome"];
  name: string;
  meta: string;
  time: string;
}

export default function ActiveScannerPage() {
  const params = useParams<{ eventId: string }>();
  const { events, tickets, tiers, checkInByQuery } = useCampusPass();

  const event = events.find((e) => e.id === params.eventId);
  const eventTickets = tickets.filter((t) => t.event_id === params.eventId);
  const checkedInCount = eventTickets.filter(
    (t) => t.status === "CHECKED_IN",
  ).length;

  const [torchOn, setTorchOn] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [flash, setFlash] = useState<CheckInResult | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([
    {
      id: 1,
      outcome: "ALLOW_ENTRY",
      name: "Meera Nair",
      meta: "24BIT0204 · Internal",
      time: "5:46 PM",
    },
    {
      id: 2,
      outcome: "ALLOW_ENTRY",
      name: "Aman Verma",
      meta: "23BCE1088 · Internal",
      time: "5:42 PM",
    },
  ]);

  const triggerVerdict = useCallback((result: CheckInResult) => {
    setFlash(result);
    if (result.outcome === "ALLOW_ENTRY") {
      playGateTone("allow");
      navigator.vibrate?.(70);
    } else if (result.outcome === "ALREADY_SCANNED") {
      playGateTone("duplicate");
      navigator.vibrate?.([160, 80, 160]);
    } else {
      playGateTone("invalid");
      navigator.vibrate?.(260);
    }

    setRecentScans((prev) => [
      {
        id: Date.now(),
        outcome: result.outcome,
        name: result.ticket?.attendee_name ?? "Unknown Ticket",
        meta:
          result.outcome === "ALLOW_ENTRY"
            ? `${result.ticket?.attendee_roll_no ?? "External"} · ${result.tier?.name ?? ""}`
            : (result.reason ?? result.outcome),
        time: formatEventTime(new Date().toISOString()),
      },
      ...prev.slice(0, 5),
    ]);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const ms = flash.outcome === "ALLOW_ENTRY" ? 1500 : 2200;
    const timer = window.setTimeout(() => setFlash(null), ms);
    return () => window.clearTimeout(timer);
  }, [flash]);

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4 text-white">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Event not found</h1>
          <Link
            href="/scanner"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950"
          >
            Back to Scanner List
          </Link>
        </div>
      </div>
    );
  }

  const handleManualCheckIn = (codeOrRoll: string) => {
    const res = checkInByQuery(event.id, codeOrRoll);
    setSheetOpen(false);
    setSearchQuery("");
    triggerVerdict(res);
  };

  const matchingTickets = searchQuery.trim()
    ? eventTickets.filter((t) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          t.ticket_code.toLowerCase().includes(q) ||
          (t.attendee_roll_no &&
            t.attendee_roll_no.toLowerCase().includes(q)) ||
          t.attendee_name.toLowerCase().includes(q)
        );
      })
    : eventTickets.slice(0, 4);

  const nextValidTicket = eventTickets.find((t) => t.status === "VALID");
  const alreadyScannedTicket = eventTickets.find(
    (t) => t.status === "CHECKED_IN",
  );

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-[#09090B] text-[#FAFAFA]">
      {/* Full-Screen 3-Modal Verdict Flash Overlay (WCAG 1.4.1: Color + Icon + Audio + Haptic) */}
      {flash && (
        <button
          type="button"
          onClick={() => setFlash(null)}
          role="status"
          aria-live="assertive"
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center text-white ${
            flash.outcome === "ALLOW_ENTRY"
              ? "bg-[#059669]"
              : flash.outcome === "ALREADY_SCANNED"
                ? "bg-[#DC2626]"
                : "bg-[#991B1B]"
          }`}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <Icon
              name={
                flash.outcome === "ALLOW_ENTRY"
                  ? "checkCircle"
                  : flash.outcome === "ALREADY_SCANNED"
                    ? "alertTriangle"
                    : "xCircle"
              }
              className="h-12 w-12"
            />
          </div>

          <h2 className="mt-5 text-4xl font-bold tracking-tight">
            {flash.outcome === "ALLOW_ENTRY"
              ? "ALLOW ENTRY"
              : flash.outcome === "ALREADY_SCANNED"
                ? "ALREADY SCANNED"
                : "INVALID TICKET"}
          </h2>

          {flash.outcome === "ALLOW_ENTRY" && flash.tier && (
            <span
              className={`mt-4 inline-block rounded-full px-4 py-1.5 font-mono text-sm font-bold tracking-wide uppercase ${
                flash.tier.is_internal
                  ? "bg-amber-400 text-zinc-950"
                  : "bg-white text-zinc-950"
              }`}
            >
              {flash.tier.is_internal
                ? "INTERNAL — CHECK COLLEGE ID"
                : "EXTERNAL GUEST"}
            </span>
          )}

          {flash.ticket ? (
            <div className="mt-5 space-y-1">
              <p className="text-2xl font-semibold">
                {flash.ticket.attendee_name}
              </p>
              <p className="font-mono text-base text-white/90">
                {flash.ticket.attendee_roll_no ?? "External Guest"} ·{" "}
                {flash.ticket.ticket_code}
              </p>
              {flash.outcome === "ALREADY_SCANNED" &&
                flash.ticket.checked_in_at && (
                  <p className="mt-2 rounded-lg bg-black/25 px-3 py-1.5 font-mono text-sm font-semibold">
                    Previously entered at{" "}
                    {formatEventTime(flash.ticket.checked_in_at)}
                  </p>
                )}
            </div>
          ) : (
            <p className="mt-4 max-w-xs text-base text-white/90">
              {flash.reason ?? "Signature failed or belongs to another event."}
            </p>
          )}

          <p className="mt-8 font-mono text-xs text-white/75 uppercase">
            Tap anywhere to scan next
          </p>
        </button>
      )}

      {/* Top Compact Status Bar */}
      <header className="border-b border-white/10 bg-[#09090B] px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          <Link
            href="/scanner"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-zinc-300 hover:bg-white/10"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            <span>Events</span>
          </Link>

          <div className="min-w-0 text-center">
            <h1 className="truncate text-sm font-semibold text-white">
              {event.title}
            </h1>
            <p className="font-mono text-xs text-zinc-400">
              Checked In:{" "}
              <strong className="text-emerald-400">{checkedInCount}</strong> /{" "}
              {eventTickets.length}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Online
          </span>
        </div>
      </header>

      {/* Center Camera Viewfinder Reticle */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-6">
        <div
          className={`relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-[#141418] transition-shadow ${
            torchOn ? "ring-2 ring-amber-400/60" : ""
          }`}
        >
          {/* Corner Guides */}
          <span className="absolute top-4 left-4 h-7 w-7 rounded-tl-xl border-t-3 border-l-3 border-white" />
          <span className="absolute top-4 right-4 h-7 w-7 rounded-tr-xl border-t-3 border-r-3 border-white" />
          <span className="absolute bottom-4 left-4 h-7 w-7 rounded-bl-xl border-b-3 border-l-3 border-white" />
          <span className="absolute right-4 bottom-4 h-7 w-7 rounded-br-xl border-r-3 border-b-3 border-white" />

          {/* Animated Scan Line (respects prefers-reduced-motion) */}
          <div className="animate-scan-beam absolute inset-x-6 top-6 h-0.5 bg-emerald-400/80 shadow-[0_0_12px_#10B981]" />

          <div className="px-6 text-center">
            <Icon name="qr" className="mx-auto h-10 w-10 text-zinc-500" />
            <p className="mt-2 text-xs font-medium text-zinc-400">
              Align attendee QR inside frame
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
              {torchOn ? "TORCH ACTIVE" : "CAMERA READY"}
            </p>
          </div>
        </div>

        {/* Dev Simulation Bar (UI-first verification of audio/haptics/overlays) */}
        <div className="mt-6 w-full rounded-2xl border border-white/10 bg-[#141418] p-3">
          <p className="font-mono text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
            Simulate Gate Scan (Audio + Flash Test)
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                if (nextValidTicket) {
                  handleManualCheckIn(nextValidTicket.ticket_code);
                } else {
                  triggerVerdict({
                    outcome: "ALLOW_ENTRY",
                    ticket: eventTickets[0],
                    tier: tiers.find((t) => t.id === eventTickets[0]?.tier_id),
                  });
                }
              }}
              className="min-h-10 rounded-xl bg-emerald-500/15 px-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25"
            >
              Valid Pass
            </button>
            <button
              type="button"
              onClick={() =>
                handleManualCheckIn(
                  alreadyScannedTicket?.ticket_code ?? "C4R8T2",
                )
              }
              className="min-h-10 rounded-xl bg-amber-500/15 px-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/25"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => handleManualCheckIn("BAD999")}
              className="min-h-10 rounded-xl bg-red-500/15 px-2 text-xs font-semibold text-red-400 hover:bg-red-500/25"
            >
              Invalid QR
            </button>
          </div>
        </div>

        {/* Recent Scans Log */}
        <div className="mt-4 w-full">
          <p className="font-mono text-[11px] font-semibold text-zinc-500 uppercase">
            Recent Scans (This Device)
          </p>
          <ul className="mt-2 space-y-1.5">
            {recentScans.slice(0, 3).map((scan) => (
              <li
                key={scan.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-[#141418] px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    name={
                      scan.outcome === "ALLOW_ENTRY" ? "checkCircle" : "xCircle"
                    }
                    className={`h-4 w-4 shrink-0 ${
                      scan.outcome === "ALLOW_ENTRY"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-100">
                      {scan.name}
                    </p>
                    <p className="truncate font-mono text-[11px] text-zinc-400">
                      {scan.meta}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-zinc-500">
                  {scan.time}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Bottom Thumb-Zone Controls (One-handed auditorium ergonomics) */}
      <footer className="sticky bottom-0 border-t border-white/10 bg-[#09090B]/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-2.5">
          <button
            type="button"
            onClick={() => setTorchOn((v) => !v)}
            aria-pressed={torchOn}
            className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold ${
              torchOn
                ? "border-amber-400 bg-amber-400 text-zinc-950"
                : "border-white/15 bg-[#141418] text-zinc-200 hover:bg-white/10"
            }`}
          >
            <Icon name="flashlight" className="h-4 w-4" />
            <span>{torchOn ? "Torch On" : "Torch"}</span>
          </button>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
          >
            <Icon name="search" className="h-4 w-4" />
            <span>Manual Roll No / Code Search</span>
          </button>
        </div>
      </footer>

      {/* Cracked-Screen Fallback Bottom Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-t-3xl border-t border-white/15 bg-[#141418] p-5 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                Manual Roll No / Code Check-In
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close manual search"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) handleManualCheckIn(searchQuery);
              }}
              className="mt-3 flex gap-2"
            >
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter 23BCE1042 or A9X2K1..."
                className="min-h-12 flex-1 rounded-xl border border-white/15 bg-[#09090B] px-3.5 font-mono text-sm text-white uppercase placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none"
              />
              <button
                type="submit"
                className="min-h-12 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-zinc-950"
              >
                Check In
              </button>
            </form>

            <div className="mt-4 max-h-60 space-y-2 overflow-y-auto">
              {matchingTickets.length === 0 ? (
                <p className="py-6 text-center text-xs text-zinc-400">
                  No matching attendee found for this event.
                </p>
              ) : (
                matchingTickets.map((t) => {
                  const checked = t.status === "CHECKED_IN";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#09090B] px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {t.attendee_name}
                        </p>
                        <p className="font-mono text-xs text-zinc-400">
                          {t.attendee_roll_no ?? "External"} · {t.ticket_code}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleManualCheckIn(t.ticket_code)}
                        className={`min-h-10 shrink-0 rounded-lg px-3 text-xs font-semibold ${
                          checked
                            ? "border border-white/15 text-zinc-400"
                            : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                        }`}
                      >
                        {checked ? "Checked In" : "Confirm"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
