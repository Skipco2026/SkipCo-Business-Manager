"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { useState } from "react";

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardShell({ children, title, subtitle }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-charcoal-50 dark:bg-charcoal-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <TopNav
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          subtitle={subtitle}
        />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
