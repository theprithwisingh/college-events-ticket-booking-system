"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { Icon } from "../../../components/icons";
import { StudentNavbar } from "../../../components/student-shell";
import {
  type AttendeeInput,
  DEPARTMENTS,
  formatEventDate,
  formatEventTime,
  formatInr,
  SEMESTERS,
} from "../../../src/lib/mock-data";
import { useCampusPass } from "../../../src/lib/store";

export default function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const {
    events,
    currentUser,
    getEventTiers,
    getTierRemaining,
    initiateBooking,
    showToast,
  } = useCampusPass();

  const event = events.find((e) => e.slug === params.slug);
  const eventTiers = useMemo(
    () => (event ? getEventTiers(event.id) : []),
    [event, getEventTiers],
  );

  const firstAvailableTierId = useMemo(() => {
    const avail = eventTiers.find((t) => getTierRemaining(t.id) > 0);
    return avail?.id ?? eventTiers[0]?.id ?? "";
  }, [eventTiers, getTierRemaining]);

  const [selectedTierId, setSelectedTierId] =
    useState<string>(firstAvailableTierId);
  const [quantity, setQuantity] = useState<number>(1);
  const [editSelf, setEditSelf] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");

  const [attendees, setAttendees] = useState<AttendeeInput[]>(() => [
    {
      attendee_name: currentUser?.full_name ?? "",
      attendee_roll_no: currentUser?.roll_number ?? "",
      attendee_dept: currentUser?.department ?? "CSE",
      attendee_semester: currentUser?.semester ?? "5",
    },
  ]);

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <StudentNavbar />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-xl font-semibold">Event not found</h1>
          <p className="mt-2 text-sm text-[#57534E]">
            This event link may have expired or been unpublished.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#111318] px-4 text-sm font-semibold text-white"
          >
            Browse Upcoming Events
          </Link>
        </main>
      </div>
    );
  }

  const activeTier =
    eventTiers.find((t) => t.id === selectedTierId) ?? eventTiers[0];
  const activeRemaining = activeTier ? getTierRemaining(activeTier.id) : 0;
  const maxAllowed = activeTier
    ? Math.min(activeTier.max_per_order, activeRemaining)
    : 1;
  const isFree = activeTier?.price_inr === 0;
  const totalAmount = (activeTier?.price_inr ?? 0) * quantity;

  const updateQuantity = (nextQty: number) => {
    const clamped = Math.max(1, Math.min(Math.max(1, maxAllowed), nextQty));
    setQuantity(clamped);
    setAttendees((prev) => {
      const copy = [...prev];
      while (copy.length < clamped) {
        copy.push({
          attendee_name: "",
          attendee_roll_no: "",
          attendee_dept: "",
          attendee_semester: "",
        });
      }
      return copy.slice(0, clamped);
    });
    setFormError("");
  };

  const updateAttendeeField = (
    index: number,
    field: keyof AttendeeInput,
    value: string,
  ) => {
    setAttendees((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]:
                field === "attendee_roll_no" ? value.toUpperCase() : value,
            }
          : item,
      ),
    );
    setFormError("");
  };

  const copyMyDeptAndSem = (index: number) => {
    const baseDept =
      attendees[0]?.attendee_dept || currentUser?.department || "CSE";
    const baseSem =
      attendees[0]?.attendee_semester || currentUser?.semester || "5";
    setAttendees((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              attendee_dept: baseDept,
              attendee_semester: baseSem,
            }
          : item,
      ),
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      showToast("Live tier counts refreshed", "info");
    }, 350);
  };

  const handleReserve = () => {
    if (!currentUser) {
      router.push(`/login?next=${encodeURIComponent(`/events/${event.slug}`)}`);
      return;
    }
    if (!activeTier || activeRemaining === 0) {
      setFormError("Please choose an available ticket tier.");
      return;
    }

    for (let i = 0; i < attendees.length; i++) {
      const att = attendees[i];
      if (!att || att.attendee_name.trim().length < 2) {
        setFormError(`Enter full name for Ticket ${i + 1}.`);
        if (i === 0) setEditSelf(true);
        return;
      }
      if (activeTier.is_internal) {
        if (att.attendee_roll_no.trim().length < 4) {
          setFormError(
            `Enter Roll Number for Ticket ${i + 1} (required for Internal OD sheet).`,
          );
          if (i === 0) setEditSelf(true);
          return;
        }
        if (!att.attendee_dept || !att.attendee_semester) {
          setFormError(`Select Department & Semester for Ticket ${i + 1}.`);
          if (i === 0) setEditSelf(true);
          return;
        }
      }
    }

    const result = initiateBooking({
      eventId: event.id,
      tierId: activeTier.id,
      attendees,
    });

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    if (result.instantConfirmed) {
      router.push(`/my-tickets?booking=${result.booking.id}`);
    } else {
      router.push(`/checkout/${result.booking.id}`);
    }
  };

  const ticket1Ready =
    Boolean(attendees[0]?.attendee_name.trim()) &&
    (!activeTier?.is_internal ||
      (Boolean(attendees[0]?.attendee_roll_no.trim()) &&
        Boolean(attendees[0]?.attendee_dept) &&
        Boolean(attendees[0]?.attendee_semester)));

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-32 text-[#111318]">
      <StudentNavbar />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#57534E] hover:text-[#111318]"
        >
          <Icon name="arrowLeft" className="h-4 w-4" />
          <span>All Events</span>
        </Link>

        <section className="mt-3 rounded-2xl border border-[#E7E5E0] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F3F1EC] px-2.5 py-1 font-mono text-xs font-semibold text-[#111318]">
              <Icon name="calendar" className="h-3.5 w-3.5 text-[#1D4ED8]" />
              {formatEventDate(event.starts_at)} ·{" "}
              {formatEventTime(event.starts_at)}
            </span>
            <span className="rounded-md bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">
              {event.category}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {event.title}
          </h1>

          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#57534E]">
            <Icon name="mapPin" className="h-4 w-4 text-[#78716C]" />
            <span>{event.venue_name}</span>
            <span aria-hidden="true">·</span>
            <span>Hosted by {event.organizer}</span>
          </p>

          <p className="mt-3 text-sm leading-relaxed text-[#57534E]">
            {event.description}
          </p>

          <div className="mt-5 flex items-center gap-2 border-t border-[#F3F1EC] pt-4 text-xs font-medium text-[#57534E]">
            <span className="inline-flex items-center gap-1.5 text-[#1D4ED8]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1D4ED8] font-mono text-[11px] font-semibold text-white">
                1
              </span>
              Pick Tier
            </span>
            <span className="h-px flex-1 bg-[#E7E5E0]" />
            <span className="inline-flex items-center gap-1.5 text-[#111318]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111318] font-mono text-[11px] font-semibold text-white">
                2
              </span>
              Attendees
            </span>
            {!isFree && (
              <>
                <span className="h-px flex-1 bg-[#E7E5E0]" />
                <span className="inline-flex items-center gap-1.5 text-[#78716C]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F3F1EC] font-mono text-[11px] font-semibold text-[#57534E]">
                    3
                  </span>
                  UPI Pay
                </span>
              </>
            )}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-[#57534E] uppercase">
              1. Select Ticket Tier
            </h2>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF]"
            >
              <Icon
                name="refresh"
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh counts</span>
            </button>
          </div>

          <div
            className="mt-2.5 space-y-2.5"
            role="radiogroup"
            aria-label="Ticket tiers"
          >
            {eventTiers.map((tier) => {
              const remaining = getTierRemaining(tier.id);
              const soldOut = remaining === 0;
              const selected = activeTier?.id === tier.id && !soldOut;
              const sellingFast =
                !soldOut && remaining / tier.total_capacity < 0.25;

              return (
                <button
                  key={tier.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={soldOut}
                  onClick={() => {
                    setSelectedTierId(tier.id);
                    const nextMax = Math.min(tier.max_per_order, remaining);
                    if (quantity > nextMax) updateQuantity(nextMax);
                    setFormError("");
                  }}
                  className={`flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition-all ${
                    soldOut
                      ? "cursor-not-allowed border-[#E7E5E0] bg-[#FAF9F6] opacity-60"
                      : selected
                        ? "border-[#1D4ED8] bg-[#EFF6FF]/60 ring-1 ring-[#1D4ED8]"
                        : "border-[#E7E5E0] bg-white hover:border-[#D6D3CB]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-[#1D4ED8] bg-[#1D4ED8]"
                          : "border-[#D6D3CB] bg-white"
                      }`}
                    >
                      {selected && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </span>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-[#111318]">
                          {tier.name}
                        </span>
                        {tier.is_internal ? (
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-[#D97706]">
                            College ID Required
                          </span>
                        ) : (
                          <span className="rounded bg-[#F3F1EC] px-2 py-0.5 text-[11px] font-medium text-[#57534E]">
                            Open Guest
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[#57534E]">
                        {tier.description}
                      </p>
                      <p className="mt-1.5 font-mono text-xs">
                        {soldOut ? (
                          <span className="font-semibold text-[#DC2626]">
                            SOLD OUT
                          </span>
                        ) : sellingFast ? (
                          <span className="font-semibold text-[#EA580C]">
                            Only {remaining} left · Max {tier.max_per_order}
                            /order
                          </span>
                        ) : (
                          <span className="text-[#57534E]">
                            {remaining} left · Max {tier.max_per_order}/order
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 font-mono text-base font-semibold ${
                      tier.price_inr === 0 ? "text-[#059669]" : "text-[#111318]"
                    }`}
                  >
                    {tier.price_inr === 0 ? "Free" : formatInr(tier.price_inr)}
                  </span>
                </button>
              );
            })}
          </div>

          {activeTier && activeRemaining > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#E7E5E0] bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#111318]">Quantity</p>
                <p className="text-xs text-[#57534E]">
                  1 individual QR pass per attendee (max {maxAllowed})
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease ticket quantity"
                  disabled={quantity <= 1}
                  onClick={() => updateQuantity(quantity - 1)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E7E5E0] bg-[#FAF9F6] text-lg font-semibold text-[#111318] hover:bg-[#F3F1EC] disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-6 text-center font-mono text-base font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase ticket quantity"
                  disabled={quantity >= maxAllowed}
                  onClick={() => updateQuantity(quantity + 1)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E7E5E0] bg-[#FAF9F6] text-lg font-semibold text-[#111318] hover:bg-[#F3F1EC] disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </section>

        {activeTier && activeRemaining > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-[#57534E] uppercase">
                2. Attendee Details ({quantity}{" "}
                {quantity === 1 ? "Pass" : "Passes"})
              </h2>
              <span className="text-xs text-[#78716C]">
                {activeTier.is_internal
                  ? "Used for OD Attendance CSV"
                  : "Name only · Fast checkout"}
              </span>
            </div>

            <div className="mt-2.5 space-y-3">
              {attendees.map((att, idx) => {
                const isSelf = idx === 0;
                const showCollapsedSelf = isSelf && ticket1Ready && !editSelf;

                if (showCollapsedSelf) {
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-2xl border border-[#E7E5E0] bg-white px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[#059669]">
                            <Icon name="check" className="h-3 w-3" />
                          </span>
                          <span className="text-sm font-semibold text-[#111318]">
                            Ticket 1 · {att.attendee_name}
                          </span>
                        </div>
                        <p className="mt-1 pl-7 font-mono text-xs text-[#57534E]">
                          {activeTier.is_internal
                            ? `${att.attendee_roll_no} · ${att.attendee_dept} · Sem ${att.attendee_semester}`
                            : "External Guest Pass (Auto-filled)"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditSelf(true)}
                        className="min-h-10 shrink-0 rounded-lg px-3 text-xs font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF]"
                      >
                        Edit
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#E7E5E0] bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#111318]">
                        {isSelf
                          ? "Ticket 1 (Your Pass)"
                          : `Ticket ${idx + 1} (Friend ${idx})`}
                      </h3>

                      {!isSelf && activeTier.is_internal && (
                        <button
                          type="button"
                          onClick={() => copyMyDeptAndSem(idx)}
                          className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#EFF6FF] px-2.5 text-xs font-semibold text-[#1D4ED8] hover:bg-[#DBEAFE]"
                        >
                          <Icon name="sparkles" className="h-3.5 w-3.5" />
                          <span>Same Dept & Sem as me</span>
                        </button>
                      )}
                      {isSelf && ticket1Ready && (
                        <button
                          type="button"
                          onClick={() => setEditSelf(false)}
                          className="text-xs font-semibold text-[#57534E] hover:text-[#111318]"
                        >
                          Done
                        </button>
                      )}
                    </div>

                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-[#57534E]">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={att.attendee_name}
                          onChange={(e) =>
                            updateAttendeeField(
                              idx,
                              "attendee_name",
                              e.target.value,
                            )
                          }
                          placeholder={
                            isSelf ? "Rahul Sharma" : "Friend's full name"
                          }
                          className="mt-1 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
                        />
                      </div>

                      {activeTier.is_internal && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <label className="block text-xs font-medium text-[#57534E]">
                              Roll Number
                            </label>
                            <input
                              type="text"
                              value={att.attendee_roll_no}
                              onChange={(e) =>
                                updateAttendeeField(
                                  idx,
                                  "attendee_roll_no",
                                  e.target.value,
                                )
                              }
                              placeholder="23BCE1088"
                              className="mt-1 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 font-mono text-sm uppercase focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[#57534E]">
                              Department
                            </label>
                            <select
                              value={att.attendee_dept}
                              onChange={(e) =>
                                updateAttendeeField(
                                  idx,
                                  "attendee_dept",
                                  e.target.value,
                                )
                              }
                              className="mt-1 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
                            >
                              <option value="">Select</option>
                              {DEPARTMENTS.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[#57534E]">
                              Semester
                            </label>
                            <select
                              value={att.attendee_semester}
                              onChange={(e) =>
                                updateAttendeeField(
                                  idx,
                                  "attendee_semester",
                                  e.target.value,
                                )
                              }
                              className="mt-1 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 font-mono text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
                            >
                              <option value="">Select</option>
                              {SEMESTERS.map((s) => (
                                <option key={s} value={s}>
                                  Sem {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-[#DC2626]"
              >
                <Icon name="alertTriangle" className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
          </section>
        )}
      </main>

      {activeTier && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E7E5E0] bg-white/95 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-[#57534E]">
                {quantity} ×{" "}
                {activeTier.price_inr === 0
                  ? "₹0"
                  : formatInr(activeTier.price_inr)}{" "}
                · ₹0 fee
              </p>
              <p className="font-mono text-lg font-semibold text-[#111318]">
                {isFree ? "Free (₹0)" : formatInr(totalAmount)}
              </p>
            </div>

            <button
              type="button"
              disabled={activeRemaining === 0}
              onClick={handleReserve}
              className={`inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#D6D3CB] ${
                isFree
                  ? "bg-[#059669] hover:bg-[#047857]"
                  : "bg-[#1D4ED8] hover:bg-[#1E40AF]"
              }`}
            >
              <span>
                {activeRemaining === 0
                  ? "Tier Sold Out"
                  : isFree
                    ? "Confirm Free Tickets (₹0)"
                    : "Reserve & Pay"}
              </span>
              {activeRemaining > 0 && (
                <Icon name="arrowRight" className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
