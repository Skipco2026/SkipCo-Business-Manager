import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-1 text-sm text-charcoal-500 dark:text-charcoal-400">{description}</p>
        </div>
      </div>
      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button>{action.label}</Button>
          </Link>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  );
}

interface PlaceholderContentProps {
  features: string[];
}

export function PlaceholderContent({ features }: PlaceholderContentProps) {
  return (
    <div className="rounded-2xl border border-dashed border-charcoal-200 bg-white p-8 dark:border-charcoal-700 dark:bg-charcoal-800/30">
      <p className="mb-6 text-sm text-charcoal-500 dark:text-charcoal-400">
        This module is ready for integration. Planned capabilities include:
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-3 rounded-xl bg-charcoal-50 px-4 py-3 text-sm text-charcoal-700 dark:bg-charcoal-800/50 dark:text-charcoal-300"
          >
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
