"use client";

import { cn } from "@/lib/utils";
import { mainNavItems } from "@/config/navigation";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Briefcase,
  ChevronDown,
  Users,
  DollarSign,
  FileText,
  Clock3,
  CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  /*
   * =========================================================
   * EMPLOYEES NAVIGATION STATE
   * =========================================================
   */

  const employeeSectionActive =
    pathname === "/employees" ||
    pathname.startsWith("/employees/");

  const payrollSectionActive =
    pathname === "/employees/payroll" ||
    pathname.startsWith("/employees/payroll/");

  const [employeesOpen, setEmployeesOpen] =
    useState(employeeSectionActive);

  const [payrollOpen, setPayrollOpen] =
    useState(payrollSectionActive);

  /*
   * Automatically open Employees when on an Employees page.
   */

  useEffect(() => {
    if (employeeSectionActive) {
      setEmployeesOpen(true);
    }

    if (payrollSectionActive) {
      setEmployeesOpen(true);
      setPayrollOpen(true);
    }
  }, [employeeSectionActive, payrollSectionActive]);

  /*
   * =========================================================
   * NORMAL NAVIGATION ITEMS
   * =========================================================
   */

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
   * mainNavItems:
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
   * Jobs is added manually because it exists at /jobs.
   */

  // Business
  // Dashboard + Customers
  const businessItems = [
    mainNavItems[0],
    mainNavItems[1],
  ];

  // Sales
  const salesItems = [
    ...mainNavItems.slice(2, 6),
    {
      title: "Jobs",
      href: "/jobs",
      icon: Briefcase,
    },
  ];

  /*
   * =========================================================
   * EMPLOYEES SUB-NAVIGATION
   * =========================================================
   */

  const employeesSubItems = [
    {
      title: "Employees",
      href: "/employees",
      icon: Users,
    },
    {
      title: "Attendance",
      href: "/employees/attendance",
      icon: Clock3,
    },
    {
      title: "Leave",
      href: "/employees/leave",
      icon: CalendarDays,
    },
  ];

  /*
   * =========================================================
   * SIDEBAR CONTENT
   * =========================================================
   */

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
          {/* =================================================
              EMPLOYEES PARENT
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              setEmployeesOpen((current) => !current)
            }
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              employeeSectionActive
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
            )}
          >
            <Users
              className={cn(
                "h-5 w-5 shrink-0",
                employeeSectionActive
                  ? "text-white"
                  : "text-charcoal-400 group-hover:text-charcoal-600 dark:group-hover:text-charcoal-300"
              )}
            />

            <span className="flex-1 text-left">
              Employees
            </span>

            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                employeesOpen && "rotate-180"
              )}
            />
          </button>

          {/* =================================================
              EMPLOYEES SUBMENU
          ================================================= */}

          <AnimatePresence initial={false}>
            {employeesOpen && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height: "auto",
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="overflow-hidden"
              >
                <div className="ml-4 space-y-1 border-l border-charcoal-200 pl-3 dark:border-charcoal-700">
                  {/* Employees */}

                  {employeesSubItems
                    .filter(
                      (item) => item.href === "/employees"
                    )
                    .map((item) => {
                      const Icon = item.icon;

                      const isActive =
                        pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive
                                ? "text-primary"
                                : "text-charcoal-400"
                            )}
                          />

                          <span>{item.title}</span>
                        </Link>
                      );
                    })}

                  {/* =================================================
                      PAYROLL PARENT
                  ================================================= */}

                  <button
                    type="button"
                    onClick={() =>
                      setPayrollOpen(
                        (current) => !current
                      )
                    }
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      payrollSectionActive
                        ? "bg-primary/10 text-primary"
                        : "text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
                    )}
                  >
                    <DollarSign
                      className={cn(
                        "h-4 w-4 shrink-0",
                        payrollSectionActive
                          ? "text-primary"
                          : "text-charcoal-400"
                      )}
                    />

                    <span className="flex-1 text-left">
                      Payroll
                    </span>

                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        payrollOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {/* =================================================
                      PAYROLL SUBMENU
                  ================================================= */}

                  <AnimatePresence initial={false}>
                    {payrollOpen && (
                      <motion.div
                        initial={{
                          height: 0,
                          opacity: 0,
                        }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                        }}
                        transition={{
                          duration: 0.2,
                        }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 space-y-1 border-l border-charcoal-100 pl-3 dark:border-charcoal-800">
                          <Link
                            href="/employees/payroll"
                            onClick={onClose}
                            className={cn(
                              "group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
                              pathname ===
                                "/employees/payroll"
                                ? "bg-primary/10 text-primary"
                                : "text-charcoal-500 hover:bg-charcoal-50 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
                            )}
                          >
                            <DollarSign className="h-3.5 w-3.5 shrink-0" />

                            <span>Payroll</span>
                          </Link>

                          <Link
                            href="/employees/payroll/payslips"
                            onClick={onClose}
                            className={cn(
                              "group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
                              pathname.startsWith(
                                "/employees/payroll/payslips"
                              )
                                ? "bg-primary/10 text-primary"
                                : "text-charcoal-500 hover:bg-charcoal-50 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
                            )}
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />

                            <span>Payslips</span>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* =================================================
                      ATTENDANCE
                  ================================================= */}

                  {employeesSubItems
                    .filter(
                      (item) =>
                        item.href ===
                        "/employees/attendance"
                    )
                    .map((item) => {
                      const Icon = item.icon;

                      const isActive =
                        pathname === item.href ||
                        pathname.startsWith(
                          `${item.href}/`
                        );

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive
                                ? "text-primary"
                                : "text-charcoal-400"
                            )}
                          />

                          <span>{item.title}</span>
                        </Link>
                      );
                    })}

                  {/* =================================================
                      LEAVE
                  ================================================= */}

                  {employeesSubItems
                    .filter(
                      (item) =>
                        item.href ===
                        "/employees/leave"
                    )
                    .map((item) => {
                      const Icon = item.icon;

                      const isActive =
                        pathname === item.href ||
                        pathname.startsWith(
                          `${item.href}/`
                        );

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive
                                ? "text-primary"
                                : "text-charcoal-400"
                            )}
                          />

                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* =================================================
              CONTRACTORS
          ================================================= */}

          <Link
            href={mainNavItems[7].href}
            onClick={onClose}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname === mainNavItems[7].href ||
                pathname.startsWith(
                  `${mainNavItems[7].href}/`
                )
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
            )}
          >
            {(() => {
              const Icon = mainNavItems[7].icon;

              return (
                <>
                  <Icon className="h-5 w-5 shrink-0 text-charcoal-400 group-hover:text-charcoal-600 dark:group-hover:text-charcoal-300" />

                  <span>{mainNavItems[7].title}</span>
                </>
              );
            })()}
          </Link>

          {/* =================================================
              SETTINGS
          ================================================= */}

          <Link
            href={mainNavItems[8].href}
            onClick={onClose}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname === mainNavItems[8].href ||
                pathname.startsWith(
                  `${mainNavItems[8].href}/`
                )
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:bg-charcoal-800 dark:hover:text-white"
            )}
          >
            {(() => {
              const Icon = mainNavItems[8].icon;

              return (
                <>
                  <Icon className="h-5 w-5 shrink-0 text-charcoal-400 group-hover:text-charcoal-600 dark:group-hover:text-charcoal-300" />

                  <span>{mainNavItems[8].title}</span>
                </>
              );
            })()}
          </Link>
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