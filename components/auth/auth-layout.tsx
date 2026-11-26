"use client";

import * as React from "react";
import { LocaleToggle } from "@/components/locale-toggle";
import { useLocale } from "@/hooks/use-locale";
import { AveroLogo } from "@/components/avero-logo";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const { t, locale } = useLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-3 flex justify-end">
          <LocaleToggle />
        </div>
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-primary p-2 text-primary-foreground shadow-sm">
            <AveroLogo variant="mark" size="lg" />
          </div>
          <div className="leading-tight text-right">
            <p className="text-base font-black text-foreground">
              {t({ ar: "أفيرو", en: "Avero" })}
            </p>
            <p className="text-[11px] font-bold text-muted-foreground">
              {t({ ar: "بوابة المتاجرة", en: "Store Portal" })}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-extrabold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-5">{children}</div>
          <div className="mt-5 border-t border-border pt-4 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t({
            ar: "بتسجيلك، توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بالمنصة.",
            en: "By signing in, you agree to the platform terms of use and privacy policy.",
          })}
        </p>
      </div>
    </div>
  );
}
