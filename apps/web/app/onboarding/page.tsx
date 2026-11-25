"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import { Icon } from "../../components/icons";
import { ToastBanner } from "../../components/student-shell";
import { DEPARTMENTS, SEMESTERS } from "../../src/lib/mock-data";
import { useCampusPass } from "../../src/lib/store";

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const { currentUser, completeOnboarding } = useCampusPass();

  const [fullName, setFullName] = useState(currentUser?.full_name ?? "");
  const [isExternal, setIsExternal] = useState(
    Boolean(currentUser?.is_external),
  );
  const [rollNumber, setRollNumber] = useState(currentUser?.roll_number ?? "");
  const [department, setDepartment] = useState(
    currentUser?.department ?? "CSE",
  );
  const [semester, setSemester] = useState(currentUser?.semester ?? "5");
  const [error, setError] = useState("");

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] px-4">
        <div className="max-w-sm rounded-2xl border border-[#E7E5E0] bg-white p-6 text-center">
          <h1 className="text-lg font-semibold">Sign in first</h1>
          <p className="mt-1 text-sm text-[#57534E]">
            Your profile is linked to your CampusPass account.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent("/onboarding")}`}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#1D4ED8] px-4 text-sm font-semibold text-white"
          >
            Go to Sign in
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      setError("Enter your full name as printed on your ID card.");
      return;
    }
    if (!isExternal && rollNumber.trim().length < 4) {
      setError("Enter your college Roll Number (e.g., 23BCE1042).");
      return;
    }
    setError("");
    completeOnboarding({
      full_name: fullName,
      roll_number: isExternal ? null : rollNumber,
      department: isExternal ? null : department,
      semester: isExternal ? null : semester,
      is_external: isExternal,
    });
    router.push(nextPath);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] px-4 py-10 text-[#111318]">
      <ToastBanner />

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#57534E] hover:text-[#111318]"
        >
          <Icon name="arrowLeft" className="h-4 w-4" />
          <span>Back to Events</span>
        </Link>

        <div className="rounded-2xl border border-[#E7E5E0] bg-white p-6 shadow-xs">
          <p className="font-mono text-xs font-semibold tracking-wider text-[#1D4ED8] uppercase">
            One-Time Setup
          </p>
          <h1 className="mt-1 text-xl font-semibold">
            Complete your attendee profile
          </h1>
          <p className="mt-1 text-sm text-[#57534E]">
            Saved once so Ticket 1 auto-fills on every booking and matches your
            college OD attendance sheet.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="ob-name"
                className="block text-xs font-semibold text-[#57534E]"
              >
                Full Name (as on ID Card)
              </label>
              <input
                id="ob-name"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rahul Sharma"
                className="mt-1.5 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
              />
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#E7E5E0] bg-[#FAF9F6] px-3.5 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={isExternal}
                onChange={(e) => setIsExternal(e.target.checked)}
                className="h-4 w-4 rounded border-[#D6D3CB] accent-[#1D4ED8]"
              />
              <span className="text-[#111318]">
                I am an external guest (not from this college)
              </span>
            </label>

            {!isExternal && (
              <>
                <div>
                  <label
                    htmlFor="ob-roll"
                    className="block text-xs font-semibold text-[#57534E]"
                  >
                    College Roll Number
                  </label>
                  <input
                    id="ob-roll"
                    type="text"
                    required
                    autoCapitalize="characters"
                    value={rollNumber}
                    onChange={(e) =>
                      setRollNumber(e.target.value.toUpperCase())
                    }
                    placeholder="23BCE1042"
                    className="mt-1.5 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 font-mono text-sm uppercase focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="ob-dept"
                      className="block text-xs font-semibold text-[#57534E]"
                    >
                      Department
                    </label>
                    <select
                      id="ob-dept"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="ob-sem"
                      className="block text-xs font-semibold text-[#57534E]"
                    >
                      Semester
                    </label>
                    <select
                      id="ob-sem"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="mt-1.5 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 font-mono text-sm focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
                    >
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s}>
                          Sem {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-[#DC2626]"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="min-h-12 w-full rounded-xl bg-[#1D4ED8] text-sm font-semibold text-white hover:bg-[#1E40AF]"
            >
              Save Profile & Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6]" />}>
      <OnboardingForm />
    </Suspense>
  );
}
