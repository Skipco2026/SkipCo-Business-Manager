"use client";

import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { ActivityItem } from "@/types";
import {
  Receipt,
  FileText,
  Briefcase,
  Users,
  CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";

const activityIcons = {
  invoice: Receipt,
  quote: FileText,
  job: Briefcase,
  customer: Users,
  payment: CreditCard,
};

const activityColors = {
  invoice: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  quote: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  job: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  customer: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  payment: "bg-primary/10 text-primary",
};

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const Icon = activityIcons[activity.type];
        const colorClass = activityColors[activity.type];

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-charcoal-50 dark:hover:bg-charcoal-800/50"
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                colorClass
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-charcoal-900 dark:text-white">
                  {activity.title}
                </p>
                {activity.amount && (
                  <span className="shrink-0 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                    {formatCurrency(activity.amount)}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-charcoal-500 dark:text-charcoal-400">
                {activity.description}
              </p>
              <p className="mt-1 text-xs text-charcoal-400">
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
