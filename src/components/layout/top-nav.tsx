"use client";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Bell, Menu, Search, LogOut, User } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface TopNavProps {
  onMenuClick: () => void;
  title?: string;
  subtitle?: string;
}

export function TopNav({ onMenuClick, title, subtitle }: TopNavProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-charcoal-100 bg-white/80 px-4 backdrop-blur-xl dark:border-charcoal-800 dark:bg-charcoal-900/80 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-charcoal-600 hover:bg-charcoal-100 lg:hidden dark:text-charcoal-400 dark:hover:bg-charcoal-800"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          {title && (
            <h1 className="text-lg font-semibold text-charcoal-900 dark:text-white">{title}</h1>
          )}
          {subtitle && (
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center md:flex">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
            <input
              type="search"
              placeholder="Search customers, invoices, jobs..."
              className={cn(
                "h-9 w-64 rounded-xl border border-charcoal-200 bg-charcoal-50 pl-9 pr-4 text-sm",
                "placeholder:text-charcoal-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                "dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-white"
              )}
            />
          </div>
        </div>

        <ThemeToggle />

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-charcoal-200 text-charcoal-600 transition-colors hover:bg-charcoal-50 dark:border-charcoal-700 dark:text-charcoal-400 dark:hover:bg-charcoal-800"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white"
            aria-label="User menu"
          >
            <User className="h-4 w-4" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-charcoal-100 bg-white py-1 card-shadow-lg dark:border-charcoal-800 dark:bg-charcoal-800">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-charcoal-700 hover:bg-charcoal-50 dark:text-charcoal-300 dark:hover:bg-charcoal-700"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
