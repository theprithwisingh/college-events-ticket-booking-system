"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { Icon } from "../components/icons";
import { StudentNavbar } from "../components/student-shell";
import {
  formatEventDate,
  formatEventTime,
  formatInr,
} from "../src/lib/mock-data";
import { useCampusPass } from "../src/lib/store";

type PriceFilter = "all" | "free" | "paid";

export default function EventDiscoveryPage() {
  const { events, getEventTiers, getTierRemaining, getLowestAvailablePrice } =
    useCampusPass();
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [query, setQuery] = useState("");

  const publishedEvents = useMemo(
    () =>
      events
        .filter((e) => e.is_published)
        .sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        ),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return publishedEvents.filter((event) => {
      const tiers = getEventTiers(event.id);
      const lowestAvailable = getLowestAvailablePrice(event.id);
      const hasFree = tiers.some(
        (t) => t.price_inr === 0 && getTierRemaining(t.id) > 0,
      );
      const hasPaid = tiers.some(
        (t) => t.price_inr > 0 && getTierRemaining(t.id) > 0,
      );

      if (priceFilter === "free" && !hasFree) return false;
      if (priceFilter === "paid" && !hasPaid) return false;
      if (
        q &&
        !event.title.toLowerCase().includes(q) &&
        !event.venue_name.toLowerCase().includes(q) &&
        !event.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return lowestAvailable !== undefined;
    });
  }, [
    publishedEvents,
    priceFilter,
    query,
    getEventTiers,
    getTierRemaining,
    getLowestAvailablePrice,
  ]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111318]">
      <StudentNavbar />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="flex flex-col gap-4 border-b border-[#E7E5E0] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs font-medium tracking-wider text-[#1D4ED8] uppercase">
              Official Campus Ticketing
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-[#111318] sm:text-3xl">
              Upcoming Campus Events
            </h1>
            <p className="mt-1 text-sm text-[#57534E]">
              Live tier capacity, ₹0 platform fees, and instant QR gate passes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E5E0] bg-white px-3 py-1.5 font-medium">
              <Icon name="shield" className="h-3.5 w-3.5 text-[#059669]" />
              Zero overselling
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E5E0] bg-white px-3 py-1.5 font-medium">
              <Icon name="qr" className="h-3.5 w-3.5 text-[#1D4ED8]" />
              Verified OD export
            </span>
          </div>
        </section>

        <section
          aria-label="Filter events"
          className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2">
            {(
              [
                { id: "all", label: "All Events" },
                { id: "free", label: "Free (₹0)" },
                { id: "paid", label: "Paid Passes" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPriceFilter(tab.id)}
                className={`min-h-11 rounded-lg px-3.5 text-sm font-medium transition-colors ${
                  priceFilter === tab.id
                    ? "bg-[#111318] text-white"
                    : "border border-[#E7E5E0] bg-white text-[#57534E] hover:border-[#D6D3CB] hover:text-[#111318]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="relative block sm:w-64">
            <span className="sr-only">Search events</span>
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#78716C]"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search event or venue..."
              className="min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-white pr-3 pl-9 text-sm text-[#111318] placeholder:text-[#78716C] focus:border-[#1D4ED8] focus:outline-none"
            />
          </label>
        </section>

        {filteredEvents.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#D6D3CB] bg-white p-10 text-center">
            <p className="text-base font-semibold text-[#111318]">
              No matching events found
            </p>
            <p className="mt-1 text-sm text-[#57534E]">
              Try clearing your filter or search query to view all published
              campus events.
            </p>
            <button
              type="button"
              onClick={() => {
                setPriceFilter("all");
                setQuery("");
              }}
              className="mt-4 min-h-11 rounded-lg bg-[#111318] px-4 text-sm font-semibold text-white hover:bg-[#27272A]"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <section
            aria-label="Published events"
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            {filteredEvents.map((event) => {
              const eventTiers = getEventTiers(event.id);
              const totalCapacity = eventTiers.reduce(
                (s, t) => s + t.total_capacity,
                0,
              );
              const totalRemaining = eventTiers.reduce(
                (s, t) => s + getTierRemaining(t.id),
                0,
              );
              const lowestAvailable = getLowestAvailablePrice(event.id);
              const isSoldOut = lowestAvailable === null;
              const isSellingFast =
                !isSoldOut &&
                totalCapacity > 0 &&
                totalRemaining / totalCapacity < 0.25;
              const hasInternalTier = eventTiers.some((t) => t.is_internal);

              return (
                <article
                  key={event.id}
                  className="group flex flex-col justify-between rounded-2xl border border-[#E7E5E0] bg-white p-5 transition-colors hover:border-[#D6D3CB]"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F3F1EC] px-2.5 py-1 font-mono text-xs font-semibold text-[#111318]">
                        <Icon
                          name="calendar"
                          className="h-3.5 w-3.5 text-[#1D4ED8]"
                        />
                        {formatEventDate(event.starts_at)} ·{" "}
                        {formatEventTime(event.starts_at)}
                      </span>

                      {isSoldOut ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-[#DC2626]">
                          <Icon name="xCircle" className="h-3.5 w-3.5" />
                          Sold Out
                        </span>
                      ) : isSellingFast ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#EA580C]">
                          <Icon name="clock" className="h-3.5 w-3.5" />
                          Selling Fast · {totalRemaining} left
                        </span>
                      ) : (
                        <span className="font-mono text-xs font-medium text-[#57534E]">
                          {totalRemaining} passes left
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3.5 text-lg font-semibold tracking-tight text-[#111318] group-hover:text-[#1D4ED8]">
                      <Link href={`/events/${event.slug}`}>{event.title}</Link>
                    </h2>

                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#57534E]">
                      <Icon
                        name="mapPin"
                        className="h-4 w-4 shrink-0 text-[#78716C]"
                      />
                      <span>{event.venue_name}</span>
                      <span aria-hidden="true">·</span>
                      <span>{event.organizer}</span>
                    </p>

                    <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-[#57534E]">
                      {event.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#F3F1EC] pt-4">
                    <div>
                      <p className="text-[11px] font-medium tracking-wide text-[#78716C] uppercase">
                        {isSoldOut
                          ? "Availability"
                          : lowestAvailable === 0
                            ? "Entry"
                            : "Available from"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span
                          className={`font-mono text-base font-semibold ${
                            isSoldOut
                              ? "text-[#78716C]"
                              : lowestAvailable === 0
                                ? "text-[#059669]"
                                : "text-[#111318]"
                          }`}
                        >
                          {isSoldOut
                            ? "Sold Out"
                            : lowestAvailable === 0
                              ? "Free (₹0)"
                              : formatInr(lowestAvailable)}
                        </span>
                        {hasInternalTier && (
                          <span className="rounded bg-[#F3F1EC] px-1.5 py-0.5 text-[11px] font-medium text-[#57534E]">
                            College ID
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/events/${event.slug}`}
                      className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors ${
                        isSoldOut
                          ? "border border-[#E7E5E0] bg-[#FAF9F6] text-[#57534E]"
                          : lowestAvailable === 0
                            ? "bg-[#059669] text-white hover:bg-[#047857]"
                            : "bg-[#1D4ED8] text-white hover:bg-[#1E40AF]"
                      }`}
                    >
                      <span>
                        {isSoldOut
                          ? "View Tiers"
                          : lowestAvailable === 0
                            ? "Get Free Pass"
                            : "Select Pass"}
                      </span>
                      <Icon name="arrowRight" className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
