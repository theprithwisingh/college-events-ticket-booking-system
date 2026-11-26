import type { Metadata } from "next";
import localFont from "next/font/local";
import { CampusPassProvider } from "../src/lib/store";
import "./globals.css";

const robotoSans = localFont({
  src: "./fonts/RobotoSans-Variable.ttf",
  variable: "--font-roboto-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CampusPass — College Event Ticketing & Gate Pass",
  description:
    "Reserve college event tickets with atomic capacity holds, UPI checkout, instant QR gate passes, and 1-click OD attendance exports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={robotoSans.variable}>
      <body>
        <CampusPassProvider>{children}</CampusPassProvider>
      </body>
    </html>
  );
}
