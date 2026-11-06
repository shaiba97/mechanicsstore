"use client";

import * as React from "react";
import { DEFAULT_LOCALE, Dir, Locale } from "@/lib/i18n";
import {
  getLocaleSnapshot,
  setLocale as setLocaleStore,
  subscribeLocale,
  tr,
} from "@/lib/locale-store";
import type { Bilingual } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  dir: Dir;
  setLocale: (locale: Locale) => void;
  t: (entry: Bilingual | string) => string;
};

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

const serverSnapshot = DEFAULT_LOCALE;

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = React.useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    () => serverSnapshot,
  );

  React.useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = React.useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      setLocale: setLocaleStore,
      t: (entry) => tr(entry, locale),
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = React.useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within <LocaleProvider>");
  }
  return context;
}
