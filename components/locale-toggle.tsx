"use client";

import * as React from "react";
import { cn } from "cn";
import { useLocale } from "@/hooks/use-locale";

export function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const options: { id: "ar" | "en"; label: string }[] = [
    { id: "ar", label: "AR" },
    { id: "en", label: "EN" },
  ];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center rounded-full border border-border bg-background p-0.5",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => setLocale(option.id)}
          aria-pressed={locale === option.id}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            locale === option.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
