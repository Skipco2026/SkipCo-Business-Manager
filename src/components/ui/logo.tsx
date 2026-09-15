import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({
  className,
  showText = true,
  size = "md",
}: LogoProps) {
  const sizes = {
    sm: {
      image: "h-8 w-auto max-w-[150px]",
      text: "text-sm",
      sub: "text-[10px]",
    },
    md: {
      image: "h-10 w-auto max-w-[190px]",
      text: "text-lg",
      sub: "text-xs",
    },
    lg: {
      image: "h-14 w-auto max-w-[220px]",
      text: "text-xl",
      sub: "text-sm",
    },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/skipco-logo.jpg"
        alt="Skip Co Solutions"
        width={220}
        height={80}
        priority
        className={cn(
          "object-contain object-left",
          s.image
        )}
      />

      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-semibold leading-tight text-charcoal-900 dark:text-white",
              s.text
            )}
          >
            Skip Co Solutions
          </span>

          <span
            className={cn(
              "leading-tight text-charcoal-500 dark:text-charcoal-400",
              s.sub
            )}
          >
            Business Manager
          </span>
        </div>
      )}
    </div>
  );
}