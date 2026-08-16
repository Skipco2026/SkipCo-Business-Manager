"use client";

import { cn, formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  Users,
  Briefcase,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

type IconName =
  | "trending-up"
  | "receipt"
  | "file-text"
  | "users"
  | "briefcase"
  | "clock";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: IconName;
  trend?: {
    value: number;
    label: string;
  };
  index?: number;
  className?: string;
}

const icons = {
  "trending-up": TrendingUp,
  receipt: Receipt,
  "file-text": FileText,
  users: Users,
  briefcase: Briefcase,
  clock: Clock,
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  index = 0,
  className,
}: StatCardProps) {
  const Icon = icons[icon];
  const isPositive = trend ? trend.value >= 0 : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-charcoal-100 bg-white p-6 card-shadow",
        "transition-all duration-300 hover:card-shadow-lg hover:-translate-y-0.5",
        "dark:border-charcoal-800 dark:bg-charcoal-800/50",
        className
      )}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 transition-transform duration-300 group-hover:scale-110" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-charcoal-500 dark:text-charcoal-400">
            {title}
          </p>

          <p className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-white">
            {typeof value === "number" ? formatCurrency(value) : value}
          </p>

          {subtitle && (
            <p className="text-xs text-charcoal-400 dark:text-charcoal-500">
              {subtitle}
            </p>
          )}

          {trend && (
            <div className="flex items-center gap-1.5">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}

              <span
                className={cn(
                  "text-xs font-medium",
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {isPositive ? "+" : ""}
                {trend.value}%
              </span>

              <span className="text-xs text-charcoal-400">
                {trend.label}
              </span>
            </div>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}