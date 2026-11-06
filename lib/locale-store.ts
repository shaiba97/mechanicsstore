import { Bilingual, DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY, Locale } from "@/lib/i18n";

const listeners = new Set<() => void>();

export function getLocaleSnapshot(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function subscribeLocale(reverify: () => void): () => void {
  listeners.add(reverify);
  window.addEventListener("storage", reverify);
  return () => {
    listeners.delete(reverify);
    window.removeEventListener("storage", reverify);
  };
}

export function setLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  listeners.forEach((notify) => notify());
}

export function tr(entry: Bilingual | string | undefined, locale: Locale): string {
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  return entry[locale];
}
