export type ProfileRole = "STUDENT" | "VOLUNTEER" | "ADMIN";
export type BookingStatus =
  "PENDING" | "CONFIRMED" | "EXPIRED" | "MANUAL_REFUND_NEEDED";
export type TicketStatus = "VALID" | "CHECKED_IN" | "CANCELLED";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  roll_number: string | null;
  department: string | null;
  semester: string | null;
  role: ProfileRole;
  is_external?: boolean;
  created_at: string;
}

export interface EventRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  venue_name: string;
  starts_at: string;
  category: string;
  organizer: string;
  is_published: boolean;
  created_by: string;
  created_at: string;
}

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  description: string;
  is_internal: boolean;
  price_inr: number;
  total_capacity: number;
  max_per_order: number;
}

export interface AttendeeInput {
  attendee_name: string;
  attendee_roll_no: string;
  attendee_dept: string;
  attendee_semester: string;
}

export interface Booking {
  id: string;
  event_id: string;
  tier_id: string;
  buyer_id: string;
  quantity: number;
  total_amount_inr: number;
  status: BookingStatus;
  attendees_json: AttendeeInput[];
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  booking_id: string;
  event_id: string;
  tier_id: string;
  ticket_code: string;
  attendee_name: string;
  attendee_roll_no: string | null;
  attendee_dept: string | null;
  attendee_semester: string | null;
  qr_signature: string;
  status: TicketStatus;
  checked_in_at: string | null;
  scanned_by: string | null;
  created_at: string;
}

export const DEPARTMENTS = [
  "CSE",
  "ECE",
  "IT",
  "EEE",
  "ME",
  "Civil",
  "MBA",
  "Other",
] as const;

export const SEMESTERS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
] as const;

export const INITIAL_PROFILES: Profile[] = [
  {
    id: "prof-student-1",
    email: "rahul.sharma@college.edu.in",
    full_name: "Rahul Sharma",
    roll_number: "23BCE1042",
    department: "CSE",
    semester: "5",
    role: "STUDENT",
    created_at: "2026-11-10T09:00:00.000Z",
  },
  {
    id: "prof-vol-1",
    email: "ananya.gate@college.edu.in",
    full_name: "Ananya Iyer",
    roll_number: "22BEC0318",
    department: "ECE",
    semester: "7",
    role: "VOLUNTEER",
    created_at: "2026-11-10T09:15:00.000Z",
  },
  {
    id: "prof-admin-1",
    email: "clubhead@college.edu.in",
    full_name: "Prithwi Singh",
    roll_number: "22BCE0011",
    department: "CSE",
    semester: "7",
    role: "ADMIN",
    created_at: "2026-11-01T08:00:00.000Z",
  },
  {
    id: "prof-student-2",
    email: "aman.verma@college.edu.in",
    full_name: "Aman Verma",
    roll_number: "23BCE1088",
    department: "CSE",
    semester: "5",
    role: "STUDENT",
    created_at: "2026-11-12T10:30:00.000Z",
  },
  {
    id: "prof-student-3",
    email: "meera.nair@college.edu.in",
    full_name: "Meera Nair",
    roll_number: "24BIT0204",
    department: "IT",
    semester: "3",
    role: "STUDENT",
    created_at: "2026-11-14T11:20:00.000Z",
  },
];

export const INITIAL_EVENTS: EventRecord[] = [
  {
    id: "evt-dj-night",
    slug: "dj-night-2026",
    title: "AURA ’26 DJ Night & Live Set",
    description:
      "Annual flagship pro-show featuring guest DJs, laser stage lighting, and campus band openers. Doors open 45 minutes prior; internal passes require physical College ID at Gate 1.",
    venue_name: "Main Auditorium",
    starts_at: "2026-11-28T18:00:00+05:30",
    category: "Pro-Show",
    organizer: "Cultural Council",
    is_published: true,
    created_by: "prof-admin-1",
    created_at: "2026-11-15T10:00:00.000Z",
  },
  {
    id: "evt-ai-workshop",
    slug: "systems-ai-workshop",
    title: "Applied LLMs & Systems Workshop",
    description:
      "Hands-on 3-hour engineering lab covering structured outputs, Postgres vector search, and latency profiling. Bring your laptop. OD attendance slip issued automatically after gate check-in.",
    venue_name: "Seminar Complex 3 · Block C",
    starts_at: "2026-11-29T10:00:00+05:30",
    category: "Workshop",
    organizer: "ACM Student Chapter",
    is_published: true,
    created_by: "prof-admin-1",
    created_at: "2026-11-16T09:00:00.000Z",
  },
  {
    id: "evt-standup",
    slug: "campus-comedy-night",
    title: "Late Evening Campus Stand-Up",
    description:
      "90-minute comedy lineup with two touring comics and student openers. Limited seating with strict QR verification at Mini Auditorium doors.",
    venue_name: "Mini Auditorium · Block B",
    starts_at: "2026-11-29T19:30:00+05:30",
    category: "Comedy",
    organizer: "Literary & Arts Club",
    is_published: true,
    created_by: "prof-admin-1",
    created_at: "2026-11-17T14:00:00.000Z",
  },
  {
    id: "evt-robotics-draft",
    slug: "robo-wars-qualifiers",
    title: "RoboWars Arena Qualifiers",
    description:
      "Draft event for technical fest qualifiers. Configure final arena capacity before publishing.",
    venue_name: "Open Air Amphitheatre",
    starts_at: "2026-12-02T15:00:00+05:30",
    category: "Tech Fest",
    organizer: "Robotics Society",
    is_published: false,
    created_by: "prof-admin-1",
    created_at: "2026-11-20T12:00:00.000Z",
  },
];

export const INITIAL_TIERS: TicketTier[] = [
  // DJ Night: includes a SOLD OUT early-bird tier to enforce the research rule:
  // discovery cards MUST advertise lowest AVAILABLE price (₹300), never sold-out ₹199!
  {
    id: "tier-dj-early",
    event_id: "evt-dj-night",
    name: "Early Bird Internal",
    description: "First 50 internal student passes (Sold Out)",
    is_internal: true,
    price_inr: 199,
    total_capacity: 2,
    max_per_order: 4,
  },
  {
    id: "tier-dj-internal",
    event_id: "evt-dj-night",
    name: "Internal Student Pass",
    description: "Physical College ID verified at gate · Eligible for OD sheet",
    is_internal: true,
    price_inr: 300,
    total_capacity: 50,
    max_per_order: 6,
  },
  {
    id: "tier-dj-external",
    event_id: "evt-dj-night",
    name: "External Guest Pass",
    description: "Open to non-campus guests · Valid Govt ID at Gate 2",
    is_internal: false,
    price_inr: 500,
    total_capacity: 25,
    max_per_order: 4,
  },
  // Free Workshop (₹0 instant bypass)
  {
    id: "tier-ai-free",
    event_id: "evt-ai-workshop",
    name: "Free Student Workshop Pass",
    description: "₹0 instant confirmation · Physical College ID & OD enabled",
    is_internal: true,
    price_inr: 0,
    total_capacity: 60,
    max_per_order: 3,
  },
  // Stand-Up (Selling Fast: < 20% left)
  {
    id: "tier-standup-int",
    event_id: "evt-standup",
    name: "Internal Student",
    description: "College ID mandatory · General hall entry",
    is_internal: true,
    price_inr: 250,
    total_capacity: 10,
    max_per_order: 4,
  },
  {
    id: "tier-standup-ext",
    event_id: "evt-standup",
    name: "External Guest",
    description: "Open guest entry · No Roll Number needed",
    is_internal: false,
    price_inr: 400,
    total_capacity: 15,
    max_per_order: 4,
  },
  // Draft Event
  {
    id: "tier-robo-free",
    event_id: "evt-robotics-draft",
    name: "Spectator Pass",
    description: "Free campus entry",
    is_internal: true,
    price_inr: 0,
    total_capacity: 120,
    max_per_order: 6,
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "bk-early-soldout",
    event_id: "evt-dj-night",
    tier_id: "tier-dj-early",
    buyer_id: "prof-student-2",
    quantity: 2,
    total_amount_inr: 398,
    status: "CONFIRMED",
    attendees_json: [
      {
        attendee_name: "Aman Verma",
        attendee_roll_no: "23BCE1088",
        attendee_dept: "CSE",
        attendee_semester: "5",
      },
      {
        attendee_name: "Meera Nair",
        attendee_roll_no: "24BIT0204",
        attendee_dept: "IT",
        attendee_semester: "3",
      },
    ],
    razorpay_order_id: "order_Pk91a8x01",
    razorpay_payment_id: "pay_Pk91b4z99",
    expires_at: null,
    created_at: "2026-11-22T14:10:00.000Z",
  },
  {
    id: "bk-rahul-dj",
    event_id: "evt-dj-night",
    tier_id: "tier-dj-internal",
    buyer_id: "prof-student-1",
    quantity: 2,
    total_amount_inr: 600,
    status: "CONFIRMED",
    attendees_json: [
      {
        attendee_name: "Rahul Sharma",
        attendee_roll_no: "23BCE1042",
        attendee_dept: "CSE",
        attendee_semester: "5",
      },
      {
        attendee_name: "Kabir Menon",
        attendee_roll_no: "23BCE1095",
        attendee_dept: "CSE",
        attendee_semester: "5",
      },
    ],
    razorpay_order_id: "order_Pk92c1y22",
    razorpay_payment_id: "pay_Pk92d7m88",
    expires_at: null,
    created_at: "2026-11-23T11:25:00.000Z",
  },
  {
    id: "bk-refund-1",
    event_id: "evt-dj-night",
    tier_id: "tier-dj-early",
    buyer_id: "prof-student-3",
    quantity: 1,
    total_amount_inr: 199,
    status: "MANUAL_REFUND_NEEDED",
    attendees_json: [
      {
        attendee_name: "Meera Nair",
        attendee_roll_no: "24BIT0204",
        attendee_dept: "IT",
        attendee_semester: "3",
      },
    ],
    razorpay_order_id: "order_Pk93f2k00",
    razorpay_payment_id: "pay_Late99182x",
    expires_at: "2026-11-23T12:00:00.000Z",
    created_at: "2026-11-23T11:50:00.000Z",
  },
  {
    id: "bk-standup-bulk",
    event_id: "evt-standup",
    tier_id: "tier-standup-int",
    buyer_id: "prof-student-2",
    quantity: 9,
    total_amount_inr: 2250,
    status: "CONFIRMED",
    attendees_json: [
      {
        attendee_name: "Aman Verma",
        attendee_roll_no: "23BCE1088",
        attendee_dept: "CSE",
        attendee_semester: "5",
      },
    ],
    razorpay_order_id: "order_Pk94x9q11",
    razorpay_payment_id: "pay_Pk94y3r44",
    expires_at: null,
    created_at: "2026-11-23T16:40:00.000Z",
  },
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: "tkt-101",
    booking_id: "bk-rahul-dj",
    event_id: "evt-dj-night",
    tier_id: "tier-dj-internal",
    ticket_code: "A9X2K1",
    attendee_name: "Rahul Sharma",
    attendee_roll_no: "23BCE1042",
    attendee_dept: "CSE",
    attendee_semester: "5",
    qr_signature: "cpv1.tkt-101.A9X2K1.hmac_84f2a9c1",
    status: "VALID",
    checked_in_at: null,
    scanned_by: null,
    created_at: "2026-11-23T11:25:05.000Z",
  },
  {
    id: "tkt-102",
    booking_id: "bk-rahul-dj",
    event_id: "evt-dj-night",
    tier_id: "tier-dj-internal",
    ticket_code: "B7M4P9",
    attendee_name: "Kabir Menon",
    attendee_roll_no: "23BCE1095",
    attendee_dept: "CSE",
    attendee_semester: "5",
    qr_signature: "cpv1.tkt-102.B7M4P9.hmac_19c4d7e2",
    status: "VALID",
    checked_in_at: null,
    scanned_by: null,
    created_at: "2026-11-23T11:25:05.000Z",
  },
  {
    id: "tkt-103",
    booking_id: "bk-early-soldout",
    event_id: "evt-dj-night",
    tier_id: "tier-dj-early",
    ticket_code: "C4R8T2",
    attendee_name: "Aman Verma",
    attendee_roll_no: "23BCE1088",
    attendee_dept: "CSE",
    attendee_semester: "5",
    qr_signature: "cpv1.tkt-103.C4R8T2.hmac_52b1e0f8",
    status: "CHECKED_IN",
    checked_in_at: "2026-11-28T17:42:00+05:30",
    scanned_by: "prof-vol-1",
    created_at: "2026-11-22T14:10:05.000Z",
  },
  {
    id: "tkt-104",
    booking_id: "bk-early-soldout",
    event_id: "evt-dj-night",
    tier_id: "tier-dj-early",
    ticket_code: "D2W6N5",
    attendee_name: "Meera Nair",
    attendee_roll_no: "24BIT0204",
    attendee_dept: "IT",
    attendee_semester: "3",
    qr_signature: "cpv1.tkt-104.D2W6N5.hmac_73a9b6c4",
    status: "CHECKED_IN",
    checked_in_at: "2026-11-28T17:46:00+05:30",
    scanned_by: "prof-vol-1",
    created_at: "2026-11-22T14:10:05.000Z",
  },
];

export function formatEventDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatEventTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatInr(amount: number): string {
  if (amount === 0) return "Free";
  return `₹${new Intl.NumberFormat("en-IN").format(amount)}`;
}
