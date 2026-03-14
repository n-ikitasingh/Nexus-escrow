import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

export const metadata: Metadata = {
  title: { default: "Nexus", template: "%s | Nexus" },
  description: "Modern SaaS platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
          <ToastProvider>
            {/* Animated background — always behind everything */}
            <div className="mesh-bg" aria-hidden="true" />
            <div className="orb orb-1" aria-hidden="true" />
            <div className="orb orb-2" aria-hidden="true" />
            <div className="orb orb-3" aria-hidden="true" />
            {/* Content on top */}
            <div className="relative z-10">
              {children}
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}