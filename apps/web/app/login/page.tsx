"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import { Icon } from "../../components/icons";
import { ToastBanner } from "../../components/student-shell";
import { useCampusPass } from "../../src/lib/store";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const { signInWithEmail } = useCampusPass();

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const finishAuth = (targetEmail: string, fullName?: string) => {
    const profile = signInWithEmail(targetEmail, fullName);
    if (
      profile.role === "STUDENT" &&
      !profile.is_external &&
      (!profile.roll_number || !profile.department)
    ) {
      router.push(`/onboarding?next=${encodeURIComponent(nextPath)}`);
    } else {
      router.push(nextPath);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setStep("otp");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 6) {
      setError(
        "Enter the 6-digit code sent to your inbox (any 6 digits work in UI mode).",
      );
      return;
    }
    setError("");
    finishAuth(email);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] px-4 py-10 text-[#111318]">
      <ToastBanner />

      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#57534E] hover:text-[#111318]"
        >
          <Icon name="arrowLeft" className="h-4 w-4" />
          <span>Back to Events</span>
        </Link>

        <div className="rounded-2xl border border-[#E7E5E0] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#111318] text-white">
              <Icon name="ticket" className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-lg leading-tight font-semibold">
                Sign in to CampusPass
              </h1>
              <p className="text-xs text-[#57534E]">
                Book passes, access QR tickets & OD records
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              finishAuth("rahul.sharma@college.edu.in", "Rahul Sharma")
            }
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#1D4ED8] px-4 text-sm font-semibold text-white hover:bg-[#1E40AF]"
          >
            <span>Continue with Google</span>
            <Icon name="arrowRight" className="h-4 w-4" />
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E7E5E0]" />
            <span className="font-mono text-[11px] text-[#78716C] uppercase">
              Or email OTP
            </span>
            <div className="h-px flex-1 bg-[#E7E5E0]" />
          </div>

          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-[#57534E]"
                >
                  College or Personal Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu.in"
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 text-sm text-[#111318] focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-[#DC2626]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="min-h-11 w-full rounded-xl border border-[#E7E5E0] bg-white text-sm font-semibold text-[#111318] hover:bg-[#F3F1EC]"
              >
                Send 6-digit OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div className="rounded-lg bg-[#F3F1EC] px-3 py-2 text-xs text-[#57534E]">
                Code sent to <strong className="text-[#111318]">{email}</strong>
              </div>
              <div>
                <label
                  htmlFor="login-otp"
                  className="block text-xs font-semibold text-[#57534E]"
                >
                  6-Digit Verification Code
                </label>
                <input
                  id="login-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] px-3 text-center font-mono text-lg tracking-[0.35em] text-[#111318] focus:border-[#1D4ED8] focus:bg-white focus:outline-none"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-[#DC2626]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="min-h-11 w-full rounded-xl bg-[#111318] text-sm font-semibold text-white hover:bg-[#27272A]"
              >
                Verify & Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                }}
                className="min-h-10 w-full text-xs font-medium text-[#57534E] hover:text-[#111318]"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-[#78716C]">
          First-time students enter Roll Number once for automatic OD sheets.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6]" />}>
      <LoginForm />
    </Suspense>
  );
}
