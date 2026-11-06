"use client";

import * as React from "react";
import { useLocale } from "@/hooks/use-locale";
import { fetchProviders } from "@/lib/auth";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4" data-icon="inline-start">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4" data-icon="inline-start">
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.656c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.234 2.686.234v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      />
    </svg>
  );
}

export function SocialButtons() {
  const { t } = useLocale();
  const [providers, setProviders] = React.useState({
    google: false,
    facebook: false,
  });

  React.useEffect(() => {
    let cancelled = false;
    fetchProviders().then((configured) => {
      if (!cancelled) setProviders(configured);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const notConfigured = t({
    ar: "غير مُفعّل على الخادم حاليًا",
    en: "Not configured on the server yet",
  });

  const hrefFor = (provider: "google" | "facebook") => `/api/auth/${provider}`;

  return (
    <div className="grid grid-cols-2 gap-2">
      <a
        href={hrefFor("google")}
        title={providers.google ? undefined : notConfigured}
        aria-disabled={!providers.google}
        className={providers.google
          ? "inline-flex h-10 items-center justify-center gap-2 rounded-4xl border border-border bg-input/30 text-sm font-bold text-foreground transition-colors hover:bg-input/50 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          : "pointer-events-none inline-flex h-10 items-center justify-center gap-2 rounded-4xl border border-border bg-input/30 text-sm font-bold text-muted-foreground"}
      >
        <GoogleMark />
        Google
      </a>
      <a
        href={hrefFor("facebook")}
        title={providers.facebook ? undefined : notConfigured}
        aria-disabled={!providers.facebook}
        className={providers.facebook
          ? "inline-flex h-10 items-center justify-center gap-2 rounded-4xl border border-border bg-input/30 text-sm font-bold text-foreground transition-colors hover:bg-input/50 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          : "pointer-events-none inline-flex h-10 items-center justify-center gap-2 rounded-4xl border border-border bg-input/30 text-sm font-bold text-muted-foreground"}
      >
        <FacebookMark />
        Facebook
      </a>
    </div>
  );
}

export function SocialDivider() {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="whitespace-nowrap text-xs font-bold text-muted-foreground">
        {t({ ar: "أو المتابعة باستخدام", en: "Or continue with" })}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
