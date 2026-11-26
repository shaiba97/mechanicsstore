"use client";

import { type Locale } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

type AveroLogoProps = {
  variant?: "full" | "mark" | "wordmark";
  size?: "sm" | "md" | "lg";
  locale?: Locale;
  inverted?: boolean;
  className?: string;
};

const SIZE_CONFIG = {
  sm: { icon: 28, textEn: "text-lg", textAr: "text-base" },
  md: { icon: 36, textEn: "text-2xl", textAr: "text-xl" },
  lg: { icon: 48, textEn: "text-3xl", textAr: "text-2xl" },
} as const;

const HEX_NUT_FILL = "#0F172A";
const HEX_NUT_STROKE = "#F59E0B";
const HEX_RING = "#334155";
const HEX_TEXT = "#F8FAFC";
const ACCENT = "#F59E0B";

export function AveroLogo({
  variant = "full",
  size = "md",
  locale: localeProp,
  inverted = false,
  className = "",
}: AveroLogoProps) {
  const { locale } = useLocale();
  const localeValue = localeProp ?? locale;
  const showArabic = localeValue === "ar";
  const showEnglish = localeValue === "en";

  const sizeConfig = SIZE_CONFIG[size];
  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      aria-label={showArabic ? "أفيرو" : "Avero"}
    >
      {variant !== "wordmark" && (
        <svg
          width={sizeConfig.icon}
          height={sizeConfig.icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          aria-hidden="true"
        >
          <path
            d="M24 3L42.1865 13.5V34.5L24 45L5.81347 34.5V13.5L24 3Z"
            fill={HEX_NUT_FILL}
            stroke={HEX_NUT_STROKE}
            strokeWidth="2.5"
          />
          <circle
            cx="24"
            cy="24"
            r="12"
            stroke={inverted ? "rgba(255,255,255,0.35)" : HEX_RING}
            strokeWidth="2"
            strokeDasharray="4 2"
            fill="none"
          />
          <path
            d="M24 12L33 32H27.8L24 23.2L20.2 32H15L24 12Z"
            fill={HEX_TEXT}
          />
          <rect x="18" y="25.5" width="12" height="3" rx="0.5" fill={ACCENT} />
        </svg>
      )}

      {variant !== "mark" && (
        <div className="flex items-baseline gap-2.5 leading-none">
          <span
            dir="ltr"
            className={`font-black tracking-[0.12em] uppercase ${sizeConfig.textEn} ${
              inverted ? "text-white" : "text-slate-900 dark:text-white"
            }`}
          >
            {showEnglish && (
              <>
                AV<span className="text-amber-500">E</span>RO
              </>
            )}
          </span>
          <span
            dir="rtl"
            className={`font-extrabold tracking-tight ${sizeConfig.textAr} ${
              inverted ? "text-white" : "text-slate-800 dark:text-slate-100"
            }`}
          >
            {showArabic && (
              <>
                أفي<span className="text-amber-500">ر</span>و
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}