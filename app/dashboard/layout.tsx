"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar }  from "@/components/layout/Navbar";
import Link from "next/link";


const PAGE_TITLES: Record<string, string> = {
  "/dashboard":            "Overview",
  "/dashboard/analytics":  "Analytics",
  "/dashboard/projects":   "Projects",
  "/dashboard/team":       "Team",
  "/dashboard/settings":   "Settings",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} />

        {/* Scrollable area with sticky footer */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
              {children}
            </div>
          </div>

          {/* Footer – always at bottom of scrollable area */}
          <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            © 2026 Your App. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
}