import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Director",
  description: "Turn ideas into cinematic storyboards with AI",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full" style={{ backgroundColor: "#0A0A0F" }}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
