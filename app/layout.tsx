import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Akili - Voice Router Diagnosis",
  description: "Voice-guided router diagnosis system for telecommunications support",
  keywords: ["router", "diagnosis", "voice", "AI", "Akili", "networking", "troubleshooting", "telecom"],
  authors: [{ name: "Akili Team" }],
  openGraph: {
    title: "Akili - Voice Router Diagnosis",
    description: "Voice-guided router diagnosis system",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        {/* Background Pattern */}
        <div className="fixed inset-0 pattern-dots pointer-events-none opacity-50" />
        <div className="fixed inset-0 bg-gradient-to-br from-pathrag-bg via-pathrag-bg to-pathrag-surface-alt/30 pointer-events-none" />
        
        {/* Main Content */}
        <div className="relative">
          {children}
        </div>
      </body>
    </html>
  );
}
