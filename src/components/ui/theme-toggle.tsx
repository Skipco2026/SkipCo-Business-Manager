"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl border border-charcoal-200 dark:border-charcoal-700",
          className
        )}
        aria-label="Toggle theme"
      />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl border border-charcoal-200",
        "text-charcoal-600 transition-colors hover:bg-charcoal-50",
        "dark:border-charcoal-700 dark:text-charcoal-400 dark:hover:bg-charcoal-800",
        className
      )}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
