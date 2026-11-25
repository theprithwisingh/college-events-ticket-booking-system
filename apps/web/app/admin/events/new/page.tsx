"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { AdminShell } from "../../../../components/admin-shell";
import { Icon } from "../../../../components/icons";
import { useCampusPass } from "../../../../src/lib/store";

interface TierDraft {
  name: string;
  description: string;
  is_internal: boolean;
  price_inr: number;
  total_capacity: number;
  max_per_order: number;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewEventPage() {
  const router = useRouter();
  const { createEvent } = useCampusPass();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [venue, setVenue] = useState("");
  const [startsAt, setStartsAt] = useState("2026-12-05T18:00");
  const [category, setCategory] = useState("Pro-Show");
  const [organizer, setOrganizer] = useState("Student Council");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [error, setError] = useState("");

  const [tiers, setTiers] = useState<TierDraft[]>([
    {
      name: "Internal Student",
      description: "College ID required at gate · OD sheet eligible",
      is_internal: true,
      price_inr: 300,
      total_capacity: 250,
      max_per_order: 6,
    },
  ]);

  const updateTier = <K extends keyof TierDraft>(
    idx: number,
    key: K,
    value: TierDraft[K],
  ) => {
    setTiers((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [key]: value } : t)),
    );
  };

  const addTier = () => {
    if (tiers.length >= 4) return;
    setTiers((prev) => [
      ...prev,
      {
        name: "External Guest",
        description: "Open to non-campus guests",
        is_internal: false,
        price_inr: 500,
        total_capacity: 100,
        max_per_order: 4,
      },
    ]);
  };

  const removeTier = (idx: number) => {
    if (tiers.length <= 1) return;
    setTiers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3 || venue.trim().length < 2) {
      setError("Enter both an event title and venue name.");
      return;
    }
    const cleanSlug = slugify(slug || title);
    if (!cleanSlug) {
      setError("Provide a valid URL slug.");
      return;
    }
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      if (!t || !t.name.trim() || t.total_capacity < 1) {
        setError(`Check name and capacity for Tier ${i + 1}.`);
        return;
      }
    }

    const created = createEvent({
      title: title.trim(),
      slug: cleanSlug,
      description:
        description.trim() ||
        "Official campus event managed via CampusPass with QR verification.",
      venue_name: venue.trim(),
      starts_at: new Date(startsAt).toISOString(),
      category,
      organizer: organizer.trim(),
      is_published: isPublished,
      tiers,
    });
    router.push(`/admin/events/${created.id}`);
  };

  return (
    <AdminShell>
      <Link
        href="/admin"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#57534E] hover:text-[#111318]"
      >
        <Icon name="arrowLeft" className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </Link>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Create New Event
      </h1>
      <p className="mt-1 text-sm text-[#57534E]">
        Configure event details and 1–4 capacity-backed ticket tiers (Paid or ₹0
        Free).
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <section className="rounded-2xl border border-[#E7E5E0] bg-white p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-wide text-[#57534E] uppercase">
            Event Details
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#57534E]">
                Event Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                placeholder="HackFest 2026 Opening Night"
                className="mt-1 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#57534E]">
                Shareable Slug (/events/...)
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="hackfest-2026"
                className="mt-1 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 font-mono text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#57534E]">
                Venue Name
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Main Auditorium"
                className="mt-1 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#57534E]">
                Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 font-mono text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#57534E]">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#57534E]">
                  Organizer
                </label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#57534E]">
                Short Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key info students need before booking: gate rules, ID requirements, OD eligibility..."
                className="mt-1 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] p-3 text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
              />
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#E7E5E0] bg-[#FAF9F6] px-3.5 py-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 accent-[#1D4ED8]"
              />
              <span>Publish immediately on public Event Discovery</span>
            </label>
          </div>
        </section>

        {/* Dynamic Tier Builder (1-4 tiers) */}
        <section className="rounded-2xl border border-[#E7E5E0] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-[#57534E] uppercase">
                Ticket Tiers ({tiers.length} / 4)
              </h2>
              <p className="mt-0.5 text-xs text-[#78716C]">
                Set Price to ₹0 for instant free confirmation (skips Razorpay).
              </p>
            </div>
            {tiers.length < 4 && (
              <button
                type="button"
                onClick={addTier}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#E7E5E0] px-3 text-xs font-semibold text-[#111318] hover:bg-[#F3F1EC]"
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                <span>Add Tier</span>
              </button>
            )}
          </div>

          <div className="mt-4 space-y-4">
            {tiers.map((tier, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#E7E5E0] bg-[#FAF9F6] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#57534E]">
                    TIER {idx + 1}
                  </span>
                  {tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTier(idx)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626] hover:underline"
                    >
                      <Icon name="trash" className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#57534E]">
                      Tier Name
                    </label>
                    <input
                      type="text"
                      required
                      value={tier.name}
                      onChange={(e) => updateTier(idx, "name", e.target.value)}
                      className="mt-1 min-h-10 w-full rounded-lg border border-[#E7E5E0] bg-white px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#57534E]">
                      Price (₹, 0 = Free)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={tier.price_inr}
                      onChange={(e) =>
                        updateTier(
                          idx,
                          "price_inr",
                          Math.max(0, Number(e.target.value)),
                        )
                      }
                      className="mt-1 min-h-10 w-full rounded-lg border border-[#E7E5E0] bg-white px-3 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#57534E]">
                      Total Capacity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={tier.total_capacity}
                      onChange={(e) =>
                        updateTier(
                          idx,
                          "total_capacity",
                          Math.max(1, Number(e.target.value)),
                        )
                      }
                      className="mt-1 min-h-10 w-full rounded-lg border border-[#E7E5E0] bg-white px-3 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#57534E]">
                      Max Per Order (1–6)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={tier.max_per_order}
                      onChange={(e) =>
                        updateTier(
                          idx,
                          "max_per_order",
                          Math.max(1, Math.min(6, Number(e.target.value))),
                        )
                      }
                      className="mt-1 min-h-10 w-full rounded-lg border border-[#E7E5E0] bg-white px-3 font-mono text-sm"
                    />
                  </div>

                  <label className="flex min-h-10 cursor-pointer items-center gap-2.5 self-end rounded-lg border border-[#E7E5E0] bg-white px-3 text-xs font-medium sm:col-span-3">
                    <input
                      type="checkbox"
                      checked={tier.is_internal}
                      onChange={(e) =>
                        updateTier(idx, "is_internal", e.target.checked)
                      }
                      className="h-4 w-4 accent-[#1D4ED8]"
                    />
                    <span>
                      Internal Student Tier (Requires Roll No, Dept, Sem &
                      Physical College ID)
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-[#DC2626]"
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin"
            className="inline-flex min-h-12 items-center rounded-xl border border-[#E7E5E0] bg-white px-5 text-sm font-semibold text-[#57534E]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="min-h-12 rounded-xl bg-[#1D4ED8] px-6 text-sm font-semibold text-white hover:bg-[#1E40AF]"
          >
            {isPublished ? "Publish Event" : "Save Draft"}
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
