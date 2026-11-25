"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { useCampusPass } from "../src/lib/store";
import { Icon } from "./icons";

export function ToastBanner() {
  const { toast, dismissToast } = useCampusPass();
  if (!toast) return null;

  const toneStyles = {
    info: "border-[#1D4ED8]/20 bg-[#111318] text-white",
    success: "border-[#059669]/30 bg-[#059669] text-white",
    warning: "border-[#D97706]/30 bg-[#D97706] text-white",
    error: "border-[#DC2626]/30 bg-[#DC2626] text-white",
  }[toast.tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      <div
        className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${toneStyles}`}
      >
        <span>{toast.text}</span>
        <button
          type="button"
          onClick={dismissToast}
          aria-label="Dismiss notification"
          className="ml-1 rounded-md p-1 opacity-80 hover:opacity-100"
        >
          <Icon name="close" className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function StudentNavbar() {
  const pathname = usePathname();
  const { currentUser, tickets, bookings, signOut, switchDemoRole } =
    useCampusPass();
  const [menuOpen, setMenuOpen] = useState(false);

  const myTicketCount = currentUser
    ? tickets.filter((t) => {
        const b = bookings.find((bk) => bk.id === t.booking_id);
        return b?.buyer_id === currentUser.id && t.status !== "CANCELLED";
      }).length
    : 0;

  return (
    <>
      <ToastBanner />
      <header className="sticky top-0 z-40 border-b border-[#E7E5E0] bg-[#FAF9F6]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-[#111318] transition-opacity hover:opacity-80"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111318] text-white">
                <Icon name="ticket" className="h-4 w-4" />
              </span>
              <span className="text-base font-semibold tracking-tight">
                CampusPass
              </span>
            </Link>

            <nav
              aria-label="Primary"
              className="hidden items-center gap-1 sm:flex"
            >
              <Link
                href="/"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === "/"
                    ? "bg-[#F3F1EC] text-[#111318]"
                    : "text-[#57534E] hover:text-[#111318]"
                }`}
              >
                Events
              </Link>
              <Link
                href="/my-tickets"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith("/my-tickets")
                    ? "bg-[#F3F1EC] text-[#111318]"
                    : "text-[#57534E] hover:text-[#111318]"
                }`}
              >
                <span>My Tickets</span>
                {myTicketCount > 0 && (
                  <span className="rounded-full bg-[#1D4ED8] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">
                    {myTicketCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#1D4ED8]/25 bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8] hover:bg-[#DBEAFE]"
              >
                <Icon name="sliders" className="h-3.5 w-3.5" />
                <span>Admin</span>
              </Link>
            )}
            {(currentUser?.role === "VOLUNTEER" ||
              currentUser?.role === "ADMIN") && (
              <Link
                href="/scanner"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#111318] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#27272A]"
              >
                <Icon name="qr" className="h-3.5 w-3.5" />
                <span>Scanner</span>
              </Link>
            )}

            <Link
              href="/my-tickets"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#E7E5E0] bg-white px-3 text-xs font-medium text-[#111318] sm:hidden"
            >
              <Icon name="ticket" className="h-4 w-4" />
              <span>Passes</span>
              {myTicketCount > 0 && (
                <span className="rounded-full bg-[#1D4ED8] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                  {myTicketCount}
                </span>
              )}
            </Link>

            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-[#E7E5E0] bg-white px-2.5 py-1.5 text-sm font-medium text-[#111318] hover:border-[#D6D3CB]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3F1EC] font-mono text-xs font-semibold text-[#111318]">
                    {(currentUser.full_name ?? currentUser.email)
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <span className="hidden max-w-[110px] truncate sm:inline">
                    {currentUser.full_name?.split(" ")[0] ?? "Account"}
                  </span>
                  <Icon
                    name="chevronDown"
                    className="h-3.5 w-3.5 text-[#57534E]"
                  />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#E7E5E0] bg-white p-2 shadow-xl">
                    <div className="border-b border-[#F3F1EC] px-3 py-2">
                      <p className="truncate text-sm font-semibold text-[#111318]">
                        {currentUser.full_name}
                      </p>
                      <p className="truncate font-mono text-xs text-[#57534E]">
                        {currentUser.roll_number ?? currentUser.email}
                      </p>
                      <span className="mt-1.5 inline-block rounded-md bg-[#F3F1EC] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#57534E]">
                        ROLE: {currentUser.role}
                      </span>
                    </div>

                    <div className="border-b border-[#F3F1EC] px-3 py-2">
                      <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[#78716C] uppercase">
                        Preview Role (Demo)
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {(["STUDENT", "VOLUNTEER", "ADMIN"] as const).map(
                          (role) => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => {
                                switchDemoRole(role);
                                setMenuOpen(false);
                              }}
                              className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                                currentUser.role === role
                                  ? "bg-[#1D4ED8] text-white"
                                  : "bg-[#F3F1EC] text-[#57534E] hover:text-[#111318]"
                              }`}
                            >
                              {role === "VOLUNTEER"
                                ? "Gate"
                                : role.charAt(0) + role.slice(1).toLowerCase()}
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="pt-1">
                      <Link
                        href="/onboarding"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#111318] hover:bg-[#F3F1EC]"
                      >
                        <Icon name="users" className="h-4 w-4 text-[#57534E]" />
                        <span>Edit Student Profile</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          signOut();
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#DC2626] hover:bg-red-50"
                      >
                        <Icon name="logout" className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center rounded-lg bg-[#1D4ED8] px-4 text-sm font-semibold text-white hover:bg-[#1E40AF]"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
