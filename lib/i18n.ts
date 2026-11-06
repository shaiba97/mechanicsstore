export type Locale = "ar" | "en";

export type Dir = "rtl" | "ltr";

export type Bilingual = {
  readonly ar: string;
  readonly en: string;
};

export const LOCALE_STORAGE_KEY = "store.locale";

export const DEFAULT_LOCALE: Locale = "ar";

export function isLocale(value: string | null): value is Locale {
  return value === "ar" || value === "en";
}

export function formatDateTime(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
