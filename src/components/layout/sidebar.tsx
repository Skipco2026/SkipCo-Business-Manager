"use client";

import { cn } from "@/lib/utils";
import { mainNavItems } from "@/config/navigation";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const renderNavItems = (items: typeof mainNavItems) =>
    items.map((item) => {
      const isActive =
        pathname === item.href ||
        (item.href !== "/dashboard" &&
          pathname.startsWith(item.href));

      const Icon = item.icon;

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive
              ? "bg-primary text-white shadow-md shadow-primary/25"
              : "text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5 shrink-0",
              isActive
                ? "text-white"
                : "text-charcoal-400 group-hover:text-charcoal-600 dark:group-hover:text-charcoal-300"
            )}
          />

          <span>{item.title}</span>
        </Link>
      );
    });

  /*
   * =========================================================
   * NAVIGATION GROUPS
   * =========================================================
   *
   * mainNavItems order:
   *
   * 0 = Dashboard
   * 1 = Customers
   * 2 = Invoices
   * 3 = Quotes
   * 4 = Payments
   * 5 = Statements
   * 6 = Employees
   * 7 = Contractors
   * 8 = Settings
   *
   * Jobs is added here directly because it already exists
   * at /jobs.
   */

  // Business
  const businessItems = mainNavItems.slice(0, 1);

  // Sales:
  // Invoices
  // Quotes
  // Payments
  // Statements
  // Jobs
  const salesItems = [
    ...mainNavItems.slice(2, 6),
    {
      title: "Jobs",
      href: "/jobs",
      icon: Briefcase,
    },
  ];

  // Operations:
  // Customers
  // Employees
  // Contractors
  // Settings
  const operationsItems = [
    mainNavItems[1],
    ...mainNavItems.slice(6),
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white dark:bg-charcoal-900">
      {/* Header */}
      <div className="flex h-20 items-center justify-between border-b border-charcoal-100 px-5 dark:border-charcoal-800">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center"
        >
          <Logo />
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-charcoal-500 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {/* =================================================
            BUSINESS
        ================================================= */}

        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">
          Business
        </p>

        <div className="space-y-1">
          {renderNavItems(businessItems)}
        </div>

        <div className="my-5 border-t border-charcoal-200 dark:border-charcoal-800" />

        {/* =================================================
            SALES
        ================================================= */}

        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">
          Sales
        </p>

        <div className="space-y-1">
          {renderNavItems(salesItems)}
        </div>

        <div className="my-5 border-t border-charcoal-200 dark:border-charcoal-800" />

        {/* =================================================
            OPERATIONS
        ================================================= */}

        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">
          Operations
        </p>

        <div className="space-y-1">
          {renderNavItems(operationsItems)}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-charcoal-100 p-4 dark:border-charcoal-800">
        <div className="rounded-xl bg-charcoal-50 p-4 dark:bg-charcoal-800/50">
          <p className="font-semibold text-charcoal-900 dark:text-white">
            Skip Co Solutions
          </p>

          <p className="mt-1 text-sm text-charcoal-500 dark:text-charcoal-400">
            Business Manager
          </p>

          <p className="mt-2 text-xs text-charcoal-400">
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-charcoal-100 bg-white dark:border-charcoal-800 dark:bg-charcoal-900 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
              }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-charcoal-100 bg-white dark:border-charcoal-800 dark:bg-charcoal-900 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}