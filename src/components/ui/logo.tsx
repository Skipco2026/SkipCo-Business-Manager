import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: { icon: "h-7 w-7 text-xs", text: "text-sm", sub: "text-[10px]" },
    md: { icon: "h-9 w-9 text-sm", text: "text-lg", sub: "text-xs" },
    lg: { icon: "h-11 w-11 text-base", text: "text-xl", sub: "text-sm" },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl gradient-primary font-bold text-white shadow-lg shadow-primary/25",
          s.icon
        )}
      >
        SC
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-semibold leading-tight text-charcoal-900 dark:text-white", s.text)}>
            {siteConfig.shortName}
          </span>
          <span className={cn("leading-tight text-charcoal-500 dark:text-charcoal-400", s.sub)}>
            Business Manager
          </span>
        </div>
      )}
    </div>
  );
}
