"use client";

import React, { useMemo, useState } from "react";
import { AdminShell } from "../../../components/admin-shell";
import { Icon } from "../../../components/icons";
import { type ProfileRole } from "../../../src/lib/mock-data";
import { useCampusPass } from "../../../src/lib/store";

export default function AdminTeamPage() {
  const { profiles, updateUserRole } = useCampusPass();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.email.toLowerCase().includes(q) ||
        (p.full_name && p.full_name.toLowerCase().includes(q)) ||
        (p.roll_number && p.roll_number.toLowerCase().includes(q)),
    );
  }, [profiles, query]);

  return (
    <AdminShell>
      <div>
        <p className="font-mono text-xs font-semibold tracking-wider text-[#1D4ED8] uppercase">
          Access Control
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Team & Gate Volunteers
        </h1>
        <p className="mt-1 text-sm text-[#57534E]">
          Promote registered students to Gate Volunteers (`VOLUNTEER`) or Club
          Heads (`ADMIN`). Changes enforce immediately via RLS.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-[#E7E5E0] bg-white p-5">
        <label className="relative block max-w-md">
          <span className="sr-only">Search users by email or roll number</span>
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#78716C]"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email, name, or Roll No..."
            className="min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] pr-3 pl-9 text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
          />
        </label>

        <div className="mt-5 divide-y divide-[#F3F1EC]">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#111318]">
                  {user.full_name ?? "Unnamed User"}
                </p>
                <p className="mt-0.5 font-mono text-xs text-[#57534E]">
                  {user.email}
                  {user.roll_number ? ` · ${user.roll_number}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <label className="sr-only" htmlFor={`role-${user.id}`}>
                  Role for {user.email}
                </label>
                <select
                  id={`role-${user.id}`}
                  value={user.role}
                  onChange={(e) =>
                    updateUserRole(user.id, e.target.value as ProfileRole)
                  }
                  className="min-h-10 rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 font-mono text-xs font-semibold text-[#111318] focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="VOLUNTEER">VOLUNTEER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-[#57534E]">
              No registered users matched &ldquo;{query}&rdquo;.
            </p>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
