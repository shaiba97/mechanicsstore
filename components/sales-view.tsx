"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/hooks/use-locale";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { OverviewView } from "@/components/sales/overview-view";
import { AccountingPeriodsView } from "@/components/sales/accounting-periods-view";

type TabId = "overview" | "periods";

const TABS: { id: TabId; label: { ar: string; en: string } }[] = [
  { id: "overview", label: { ar: "نظرة عامة", en: "Overview" } },
  { id: "periods", label: { ar: "الفترات المحاسبية", en: "Accounting Periods" } },
];

export function SalesView() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const urlTab = searchParams.get("tab");
  const tab: TabId = TABS.some((item) => item.id === urlTab) ? (urlTab as TabId) : "overview";

  const setTabUrl = React.useCallback(
    (next: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="flex flex-col gap-4" dir={dir} lang={locale}>
      <Tabs value={tab} onValueChange={setTabUrl} orientation="horizontal">
        <TabsList>
          {TABS.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {t(item.label)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview" className="pt-4">
          <OverviewView />
        </TabsContent>
        <TabsContent value="periods" className="pt-4">
          <AccountingPeriodsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
