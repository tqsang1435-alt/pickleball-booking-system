import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PickleClub",
  description: "Pickleball Court & Coach Booking System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={beVietnamPro.className}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
