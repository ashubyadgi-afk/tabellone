import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata = {
  title: "Tabellone — Advertising Space Platform",
  description: "Owner Operating System for AdSpace inventory, bookings, and invoices",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} scroll-smooth`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
