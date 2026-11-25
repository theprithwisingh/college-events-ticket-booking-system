"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useCampusPass } from "../src/lib/store";
import { Icon } from "./icons";
import { ToastBanner } from "./student-shell";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, switchDemoRole, bookings } = useCampusPass();
  const refundCount = bookings.filter(
    (b) => b.status === "MANUAL_REFUND_NEEDED",
  ).length;

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "sliders" as const },
    { href: "/admin/events/new", label: "Create Event", icon: "plus" as const },
    { href: "/admin/team", label: "Team & Roles", icon: "users" as const },
  ];

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#FAF9F6] px-4 py-16">
        <ToastBanner />
        <div className="mx-auto max-w-md rounded-2xl border border-[#E7E5E0] bg-white p-6 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-[#D97706]">
            <Icon name="shield" className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-[#111318]">
            Admin workspace restricted
          </h1>
          <p className="mt-2 text-sm text-[#57534E]">
            Your active account is{" "}
            <span className="font-mono font-semibold">
              {currentUser?.role ?? "SIGNED OUT"}
            </span>
            . Only Club Heads (ADMIN) can access event creation and CSV exports.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => switchDemoRole("ADMIN")}
              className="min-h-11 rounded-lg bg-[#1D4ED8] px-4 text-sm font-semibold text-white hover:bg-[#1E40AF]"
            >
              Switch to Demo Admin
            </button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#E7E5E0] bg-white px-4 text-sm font-medium text-[#111318] hover:bg-[#F3F1EC]"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111318] lg:flex">
      <ToastBanner />

      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-[#E7E5E0] bg-white p-5 lg:flex">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111318] text-white">
              <Icon name="ticket" className="h-4 w-4" />
            </span>
            <div>
              <span className="block text-sm font-semibold leading-none">
                CampusPass
              </span>
              <span className="mt-1 block font-mono text-[10px] font-semibold tracking-wider text-[#1D4ED8] uppercase">
                Admin Portal
              </span>
            </div>
          </Link>

          <nav aria-label="Admin Navigation" className="mt-8 space-y-1">
            {navItems.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin" ||
                    (pathname.startsWith("/admin/events/") &&
                      pathname !== "/admin/events/new")
                  : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-11 items-center justify-between rounded-lg px-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#EFF6FF] text-[#1D4ED8]"
                      : "text-[#57534E] hover:bg-[#F3F1EC] hover:text-[#111318]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon name={item.icon} className="h-4 w-4" />
                    <span>{item.label}</span>
                  </span>
                  {item.href === "/admin" && refundCount > 0 && (
                    <span className="rounded-full bg-[#D97706] px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                      {refundCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-[#F3F1EC] pt-4">
          <Link
            href="/scanner"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#111318] px-3 text-sm font-semibold text-white hover:bg-[#27272A]"
          >
            <Icon name="qr" className="h-4 w-4" />
            <span>Open Gate Scanner</span>
          </Link>
          <Link
            href="/"
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#E7E5E0] px-3 text-xs font-medium text-[#57534E] hover:bg-[#F3F1EC] hover:text-[#111318]"
          >
            <Icon name="arrowLeft" className="h-3.5 w-3.5" />
            <span>Student Discovery</span>
          </Link>
        </div>
      </aside>

      <div className="sticky top-0 z-30 border-b border-[#E7E5E0] bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#111318] text-white">
              <Icon name="ticket" className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-semibold">CampusPass Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/scanner"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#111318] px-2.5 text-xs font-semibold text-white"
            >
              <Icon name="qr" className="h-3.5 w-3.5" />
              <span>Scanner</span>
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-9 items-center rounded-lg border border-[#E7E5E0] px-2.5 text-xs font-medium text-[#57534E]"
            >
              Exit
            </Link>
          </div>
        </div>
        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "bg-[#EFF6FF] text-[#1D4ED8]"
                    : "bg-[#F3F1EC] text-[#57534E]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
