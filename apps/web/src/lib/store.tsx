"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  type AttendeeInput,
  type Booking,
  type EventRecord,
  INITIAL_BOOKINGS,
  INITIAL_EVENTS,
  INITIAL_PROFILES,
  INITIAL_TICKETS,
  INITIAL_TIERS,
  type Profile,
  type ProfileRole,
  type Ticket,
  type TicketTier,
} from "./mock-data";

export type ToastTone = "info" | "success" | "warning" | "error";

export interface ToastMessage {
  id: number;
  text: string;
  tone: ToastTone;
}

export interface CheckInResult {
  outcome: "ALLOW_ENTRY" | "ALREADY_SCANNED" | "INVALID";
  ticket?: Ticket;
  tier?: TicketTier;
  reason?: string;
}

interface CreateEventInput {
  title: string;
  slug: string;
  description: string;
  venue_name: string;
  starts_at: string;
  category: string;
  organizer: string;
  is_published: boolean;
  tiers: Array<{
    name: string;
    description: string;
    is_internal: boolean;
    price_inr: number;
    total_capacity: number;
    max_per_order: number;
  }>;
}

interface CampusPassContextValue {
  profiles: Profile[];
  events: EventRecord[];
  tiers: TicketTier[];
  bookings: Booking[];
  tickets: Ticket[];
  currentUser: Profile | null;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  toast: ToastMessage | null;
  showToast: (text: string, tone?: ToastTone) => void;
  dismissToast: () => void;
  signInWithEmail: (email: string, fullName?: string) => Profile;
  signOut: () => void;
  switchDemoRole: (role: ProfileRole) => void;
  completeOnboarding: (input: {
    full_name: string;
    roll_number: string | null;
    department: string | null;
    semester: string | null;
    is_external: boolean;
  }) => void;
  getTierRemaining: (tierId: string) => number;
  getEventTiers: (eventId: string) => TicketTier[];
  getLowestAvailablePrice: (eventId: string) => number | null;
  initiateBooking: (input: {
    eventId: string;
    tierId: string;
    attendees: AttendeeInput[];
  }) =>
    | { ok: true; booking: Booking; instantConfirmed: boolean }
    | { ok: false; error: string };
  confirmBookingPayment: (bookingId: string) => Booking | null;
  expireBooking: (bookingId: string) => void;
  flagBookingManualRefund: (bookingId: string) => Booking | null;
  resolveManualRefund: (bookingId: string) => void;
  checkInByQuery: (eventId: string, query: string) => CheckInResult;
  createEvent: (input: CreateEventInput) => EventRecord;
  togglePublishEvent: (eventId: string) => void;
  updateUserRole: (profileId: string, role: ProfileRole) => void;
}

const CampusPassContext = createContext<CampusPassContextValue | null>(null);

function generateTicketCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function CampusPassProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [events, setEvents] = useState<EventRecord[]>(INITIAL_EVENTS);
  const [tiers, setTiers] = useState<TicketTier[]>(INITIAL_TIERS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    "prof-student-1",
  );
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, tone: ToastTone = "info") => {
    const id = Date.now();
    setToast({ id, text, tone });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3600);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const currentUser = useMemo(
    () => profiles.find((p) => p.id === currentUserId) ?? null,
    [profiles, currentUserId],
  );

  const isAuthenticated = Boolean(currentUser);
  const needsOnboarding = Boolean(
    currentUser &&
    currentUser.role === "STUDENT" &&
    !currentUser.is_external &&
    (!currentUser.roll_number || !currentUser.department),
  );

  const signInWithEmail = useCallback(
    (email: string, fullName?: string) => {
      const normalized = email.trim().toLowerCase();
      const existing = profiles.find(
        (p) => p.email.toLowerCase() === normalized,
      );
      if (existing) {
        setCurrentUserId(existing.id);
        showToast(
          `Signed in as ${existing.full_name ?? existing.email}`,
          "success",
        );
        return existing;
      }
      const created: Profile = {
        id: generateId("prof"),
        email: normalized,
        full_name: fullName?.trim() || normalized.split("@")[0] || "Student",
        roll_number: null,
        department: null,
        semester: null,
        role: "STUDENT",
        created_at: new Date().toISOString(),
      };
      setProfiles((prev) => [...prev, created]);
      setCurrentUserId(created.id);
      showToast("Signed in — complete your student profile once", "info");
      return created;
    },
    [profiles, showToast],
  );

  const signOut = useCallback(() => {
    setCurrentUserId(null);
    showToast("Signed out of CampusPass", "info");
  }, [showToast]);

  const switchDemoRole = useCallback(
    (role: ProfileRole) => {
      const target = profiles.find((p) => p.role === role);
      if (target) {
        setCurrentUserId(target.id);
        showToast(
          `Switched demo account to ${role} (${target.full_name ?? target.email})`,
          "info",
        );
      }
    },
    [profiles, showToast],
  );

  const completeOnboarding = useCallback(
    (input: {
      full_name: string;
      roll_number: string | null;
      department: string | null;
      semester: string | null;
      is_external: boolean;
    }) => {
      if (!currentUserId) return;
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === currentUserId
            ? {
                ...p,
                full_name: input.full_name.trim(),
                roll_number: input.is_external
                  ? null
                  : input.roll_number?.trim().toUpperCase() || null,
                department: input.is_external ? null : input.department,
                semester: input.is_external ? null : input.semester,
                is_external: input.is_external,
              }
            : p,
        ),
      );
      showToast("Profile saved — ready to book in 1 tap", "success");
    },
    [currentUserId, showToast],
  );

  const getTierRemaining = useCallback(
    (tierId: string) => {
      const tier = tiers.find((t) => t.id === tierId);
      if (!tier) return 0;
      const now = Date.now();
      const reserved = bookings.reduce((sum, b) => {
        if (b.tier_id !== tierId) return sum;
        if (b.status === "CONFIRMED") return sum + b.quantity;
        if (
          b.status === "PENDING" &&
          b.expires_at &&
          new Date(b.expires_at).getTime() > now
        ) {
          return sum + b.quantity;
        }
        return sum;
      }, 0);
      return Math.max(0, tier.total_capacity - reserved);
    },
    [tiers, bookings],
  );

  const getEventTiers = useCallback(
    (eventId: string) => tiers.filter((t) => t.event_id === eventId),
    [tiers],
  );

  const getLowestAvailablePrice = useCallback(
    (eventId: string): number | null => {
      const available = tiers.filter(
        (t) => t.event_id === eventId && getTierRemaining(t.id) > 0,
      );
      if (available.length === 0) return null;
      return Math.min(...available.map((t) => t.price_inr));
    },
    [tiers, getTierRemaining],
  );

  const mintTicketsForBooking = useCallback((booking: Booking): Ticket[] => {
    const nowIso = new Date().toISOString();
    return booking.attendees_json.map((att) => {
      const id = generateId("tkt");
      const code = generateTicketCode();
      return {
        id,
        booking_id: booking.id,
        event_id: booking.event_id,
        tier_id: booking.tier_id,
        ticket_code: code,
        attendee_name: att.attendee_name.trim(),
        attendee_roll_no: att.attendee_roll_no.trim().toUpperCase() || null,
        attendee_dept: att.attendee_dept || null,
        attendee_semester: att.attendee_semester || null,
        qr_signature: `cpv1.${id}.${code}.hmac_${Math.random().toString(16).slice(2, 10)}`,
        status: "VALID",
        checked_in_at: null,
        scanned_by: null,
        created_at: nowIso,
      };
    });
  }, []);

  const initiateBooking = useCallback(
    (input: {
      eventId: string;
      tierId: string;
      attendees: AttendeeInput[];
    }):
      | { ok: true; booking: Booking; instantConfirmed: boolean }
      | { ok: false; error: string } => {
      if (!currentUser) {
        return { ok: false, error: "Please sign in to reserve tickets." };
      }
      const tier = tiers.find(
        (t) => t.id === input.tierId && t.event_id === input.eventId,
      );
      if (!tier) {
        return { ok: false, error: "Selected ticket tier was not found." };
      }
      const qty = input.attendees.length;
      if (qty < 1 || qty > tier.max_per_order) {
        return {
          ok: false,
          error: `You can book between 1 and ${tier.max_per_order} tickets for this tier.`,
        };
      }
      const remaining = getTierRemaining(tier.id);
      if (qty > remaining) {
        return {
          ok: false,
          error:
            remaining === 0
              ? "This tier just sold out. Please select another tier."
              : `Only ${remaining} ticket${remaining === 1 ? "" : "s"} left in this tier.`,
        };
      }

      const total = tier.price_inr * qty;
      const isFree = total === 0;
      const booking: Booking = {
        id: generateId("bk"),
        event_id: input.eventId,
        tier_id: tier.id,
        buyer_id: currentUser.id,
        quantity: qty,
        total_amount_inr: total,
        status: isFree ? "CONFIRMED" : "PENDING",
        attendees_json: input.attendees,
        razorpay_order_id: isFree ? null : `order_${generateTicketCode()}`,
        razorpay_payment_id: null,
        expires_at: isFree
          ? null
          : new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      setBookings((prev) => [booking, ...prev]);

      if (isFree) {
        const minted = mintTicketsForBooking(booking);
        setTickets((prev) => [...minted, ...prev]);
        showToast(
          `Confirmed ${qty} free pass${qty > 1 ? "es" : ""} — QR ready`,
          "success",
        );
      } else {
        showToast(
          `Holding ${qty} ticket${qty > 1 ? "s" : ""} for 7 minutes`,
          "info",
        );
      }

      return { ok: true, booking, instantConfirmed: isFree };
    },
    [currentUser, tiers, getTierRemaining, mintTicketsForBooking, showToast],
  );

  const confirmBookingPayment = useCallback(
    (bookingId: string): Booking | null => {
      const target = bookings.find((b) => b.id === bookingId);
      if (!target) return null;
      if (target.status === "CONFIRMED") return target;
      const updated: Booking = {
        ...target,
        status: "CONFIRMED",
        razorpay_payment_id: `pay_${generateTicketCode()}${Math.floor(10 + Math.random() * 89)}`,
        expires_at: null,
      };
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updated : b)),
      );
      const minted = mintTicketsForBooking(updated);
      setTickets((prev) => [...minted, ...prev]);
      showToast("Payment verified — QR passes generated", "success");
      return updated;
    },
    [bookings, mintTicketsForBooking, showToast],
  );

  const expireBooking = useCallback((bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId && b.status === "PENDING"
          ? { ...b, status: "EXPIRED" }
          : b,
      ),
    );
  }, []);

  const flagBookingManualRefund = useCallback(
    (bookingId: string): Booking | null => {
      const target = bookings.find((b) => b.id === bookingId);
      if (!target) return null;
      const updated: Booking = {
        ...target,
        status: "MANUAL_REFUND_NEEDED",
        razorpay_payment_id:
          target.razorpay_payment_id ?? `pay_Late${generateTicketCode()}`,
      };
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updated : b)),
      );
      return updated;
    },
    [bookings],
  );

  const resolveManualRefund = useCallback(
    (bookingId: string) => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId && b.status === "MANUAL_REFUND_NEEDED"
            ? { ...b, status: "EXPIRED" }
            : b,
        ),
      );
      showToast("Marked as refunded & resolved", "success");
    },
    [showToast],
  );

  const checkInByQuery = useCallback(
    (eventId: string, query: string): CheckInResult => {
      const clean = query.trim().toUpperCase();
      if (!clean) {
        return {
          outcome: "INVALID",
          reason: "Enter a Roll No or 6-char code.",
        };
      }
      const matched = tickets.find(
        (t) =>
          t.ticket_code.toUpperCase() === clean ||
          (t.attendee_roll_no &&
            t.attendee_roll_no.toUpperCase() === clean &&
            t.event_id === eventId) ||
          t.qr_signature.toUpperCase() === clean,
      );

      if (!matched) {
        return {
          outcome: "INVALID",
          reason: "No ticket matched this code or Roll Number.",
        };
      }
      if (matched.event_id !== eventId) {
        return {
          outcome: "INVALID",
          ticket: matched,
          reason: "Ticket belongs to a different event.",
        };
      }
      const tier = tiers.find((t) => t.id === matched.tier_id);
      if (matched.status === "CANCELLED") {
        return {
          outcome: "INVALID",
          ticket: matched,
          tier,
          reason: "Ticket was cancelled or refunded.",
        };
      }
      if (matched.status === "CHECKED_IN") {
        return {
          outcome: "ALREADY_SCANNED",
          ticket: matched,
          tier,
          reason: "Already checked in earlier.",
        };
      }

      const checkedInAt = new Date().toISOString();
      const updatedTicket: Ticket = {
        ...matched,
        status: "CHECKED_IN",
        checked_in_at: checkedInAt,
        scanned_by: currentUser?.id ?? "prof-vol-1",
      };
      setTickets((prev) =>
        prev.map((t) => (t.id === matched.id ? updatedTicket : t)),
      );
      return {
        outcome: "ALLOW_ENTRY",
        ticket: updatedTicket,
        tier,
      };
    },
    [tickets, tiers, currentUser],
  );

  const createEvent = useCallback(
    (input: CreateEventInput): EventRecord => {
      const eventId = generateId("evt");
      const newEvent: EventRecord = {
        id: eventId,
        slug: input.slug,
        title: input.title,
        description: input.description,
        venue_name: input.venue_name,
        starts_at: input.starts_at,
        category: input.category,
        organizer: input.organizer || "Campus Council",
        is_published: input.is_published,
        created_by: currentUser?.id ?? "prof-admin-1",
        created_at: new Date().toISOString(),
      };
      const newTiers: TicketTier[] = input.tiers.map((t) => ({
        id: generateId("tier"),
        event_id: eventId,
        name: t.name,
        description: t.description,
        is_internal: t.is_internal,
        price_inr: t.price_inr,
        total_capacity: t.total_capacity,
        max_per_order: t.max_per_order,
      }));
      setEvents((prev) => [newEvent, ...prev]);
      setTiers((prev) => [...newTiers, ...prev]);
      showToast(
        input.is_published
          ? `Published "${newEvent.title}"`
          : `Saved draft "${newEvent.title}"`,
        "success",
      );
      return newEvent;
    },
    [currentUser, showToast],
  );

  const togglePublishEvent = useCallback(
    (eventId: string) => {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, is_published: !e.is_published } : e,
        ),
      );
      showToast("Updated event publish status", "info");
    },
    [showToast],
  );

  const updateUserRole = useCallback(
    (profileId: string, role: ProfileRole) => {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role } : p)),
      );
      showToast(`Updated role to ${role}`, "success");
    },
    [showToast],
  );

  const value = useMemo<CampusPassContextValue>(
    () => ({
      profiles,
      events,
      tiers,
      bookings,
      tickets,
      currentUser,
      isAuthenticated,
      needsOnboarding,
      toast,
      showToast,
      dismissToast,
      signInWithEmail,
      signOut,
      switchDemoRole,
      completeOnboarding,
      getTierRemaining,
      getEventTiers,
      getLowestAvailablePrice,
      initiateBooking,
      confirmBookingPayment,
      expireBooking,
      flagBookingManualRefund,
      resolveManualRefund,
      checkInByQuery,
      createEvent,
      togglePublishEvent,
      updateUserRole,
    }),
    [
      profiles,
      events,
      tiers,
      bookings,
      tickets,
      currentUser,
      isAuthenticated,
      needsOnboarding,
      toast,
      showToast,
      dismissToast,
      signInWithEmail,
      signOut,
      switchDemoRole,
      completeOnboarding,
      getTierRemaining,
      getEventTiers,
      getLowestAvailablePrice,
      initiateBooking,
      confirmBookingPayment,
      expireBooking,
      flagBookingManualRefund,
      resolveManualRefund,
      checkInByQuery,
      createEvent,
      togglePublishEvent,
      updateUserRole,
    ],
  );

  return (
    <CampusPassContext.Provider value={value}>
      {children}
    </CampusPassContext.Provider>
  );
}

export function useCampusPass(): CampusPassContextValue {
  const ctx = useContext(CampusPassContext);
  if (!ctx) {
    throw new Error("useCampusPass must be used inside CampusPassProvider");
  }
  return ctx;
}
