"use client";

import * as React from "react";
import { useLocale } from "@/hooks/use-locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type LegalSection = {
  id: string;
  title: { ar: string; en: string };
  body: { ar: string; en: string }[];
};

export type LegalDocumentProps = {
  title: { ar: string; en: string };
  sections: LegalSection[];
  compliance?: boolean;
  backHref?: string;
  backLabel?: { ar: string; en: string };
};

export function LegalDocument({
  title,
  sections,
  compliance,
  backHref = "/auth/register",
  backLabel,
}: LegalDocumentProps) {
  const { t, locale } = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <main className="flex min-h-screen flex-col bg-background p-4" dir={dir} lang={locale}>
      <Card className="flex-1 max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">{t(title)}</h1>
            {compliance && (
              <Badge variant="secondary" className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold">
                {locale === "ar" ? "متوافق مع نظام حماية البيانات الشخصية وأنظمة ساما" : "PDPL & SAMA Compliant"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              {t({ ar: "طباعة", en: "Print" })}
            </Button>
            <a
              href={backHref}
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              {t(backLabel ?? { ar: "العودة إلى التسجيل", en: "Back to Registration" })}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <nav className="lg:col-span-3 hidden lg:block space-y-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t({ ar: "المحتويات", en: "Contents" })}
            </h2>
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {t(section.title)}
              </a>
            ))}
          </nav>

          <div className="lg:col-span-9 space-y-8" dir={dir}>
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="space-y-4">
                <h2 className="text-lg font-bold text-foreground">{t(section.title)}</h2>
                <div className="space-y-4 text-sm text-foreground leading-relaxed">
                  {section.body.map((p, i) => (
                    <p key={i}>{t(p)}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Card>
    </main>
  );
}
