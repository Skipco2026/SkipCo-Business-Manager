"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { siteConfig } from "@/config/site";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  FileText,
  Receipt,
  Shield,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Users,
    title: "Customer Management",
    description:
      "Centralise customer accounts, contact details, and service history for every skip hire client across Bloemfontein and the Free State.",
  },
  {
    icon: FileText,
    title: "Quotes & Invoicing",
    description:
      "Generate professional quotes and tax-compliant invoices in seconds. Track payments and outstanding balances at a glance.",
  },
  {
    icon: Truck,
    title: "Job Scheduling",
    description:
      "Plan skip deliveries, collections, and site visits with a visual calendar. Assign drivers and track job status in real time.",
  },
  {
    icon: BarChart3,
    title: "Business Reports",
    description:
      "Monitor revenue, outstanding invoices, and operational KPIs with dashboards built for waste management businesses.",
  },
  {
    icon: Receipt,
    title: "Point of Sale",
    description:
      "Process on-site payments and issue receipts directly from the field. Perfect for walk-in customers and cash transactions.",
  },
  {
    icon: Calendar,
    title: "Calendar & Planning",
    description:
      "View all scheduled jobs, deliveries, and collections in one unified calendar. Never miss a collection date again.",
  },
];

const stats = [
  { value: "147+", label: "Active Customers" },
  { value: "R284K", label: "Monthly Revenue" },
  { value: "23", label: "Jobs This Week" },
  { value: "99.2%", label: "Collection Rate" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-charcoal-900">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-charcoal-100 bg-white/80 backdrop-blur-xl dark:border-charcoal-800 dark:bg-charcoal-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="gradient-mesh absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Zap className="h-3.5 w-3.5" />
                Built for SkipCo Solutions
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-8 text-4xl font-bold tracking-tight text-charcoal-900 sm:text-5xl lg:text-6xl dark:text-white"
            >
              Run your skip hire business{" "}
              <span className="text-primary">from one place</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg leading-relaxed text-charcoal-500 dark:text-charcoal-400"
            >
              SkipCo Business Manager helps {siteConfig.company.tradingAs} manage
              customers, quotes, invoices, jobs, and payments — all in a single
              professional platform designed for waste management operations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link href="/login">
                <Button size="lg">
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  Explore Features
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-6 lg:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-charcoal-100 bg-white p-6 text-center card-shadow dark:border-charcoal-800 dark:bg-charcoal-800/50"
              >
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="mt-1 text-sm text-charcoal-500 dark:text-charcoal-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-charcoal-900 dark:text-white">
              Everything you need to manage your business
            </h2>
            <p className="mt-4 text-charcoal-500 dark:text-charcoal-400">
              From first quote to final collection, SkipCo Business Manager streamlines
              every step of your skip hire workflow.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="group rounded-2xl border border-charcoal-100 bg-white p-8 card-shadow transition-all duration-300 hover:card-shadow-lg hover:-translate-y-1 dark:border-charcoal-800 dark:bg-charcoal-800/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-charcoal-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-500 dark:text-charcoal-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-charcoal-100 bg-charcoal-50 py-16 dark:border-charcoal-800 dark:bg-charcoal-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-charcoal-900 dark:text-white">
                  Enterprise-grade security
                </p>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                  Your business data is protected with Supabase authentication and encryption.
                </p>
              </div>
            </div>
            <div className="text-center lg:text-right">
              <p className="text-sm font-medium text-charcoal-900 dark:text-white">
                {siteConfig.company.legalName}
              </p>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                Reg: {siteConfig.company.registration} · {siteConfig.company.location}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl gradient-primary px-8 py-16 text-center lg:px-16">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMTBoNjBNMTAgMHYxMDBNMjAgMTBoNjBMMzAgMHYxMDBNMzAgMTBoNjBNNDAgMHYxMDBNNDAgMTBoNjBNNjAgMTBoNjBNNTAgMHYxMDBNNjAgMHYxMDBaIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS1vcGFjaXR5PSIuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-30" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to streamline your operations?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-primary-100">
                Sign in to your SkipCo Business Manager dashboard and take control of
                your skip hire business today.
              </p>
              <Link href="/login" className="mt-8 inline-block">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-primary-50"
                >
                  Sign in to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-charcoal-100 bg-white py-12 dark:border-charcoal-800 dark:bg-charcoal-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Logo size="sm" />
            <div className="text-center text-sm text-charcoal-500 dark:text-charcoal-400 md:text-right">
              <p>{siteConfig.company.legalName}</p>
              <p className="mt-1">
                {siteConfig.company.email} · {siteConfig.company.phone}
              </p>
              <p className="mt-1">{siteConfig.company.location}</p>
            </div>
          </div>
          <div className="mt-8 border-t border-charcoal-100 pt-8 text-center text-xs text-charcoal-400 dark:border-charcoal-800">
            © {new Date().getFullYear()} {siteConfig.company.tradingAs}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
