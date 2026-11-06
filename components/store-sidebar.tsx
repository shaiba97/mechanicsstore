"use client";

import {
  Banknote,
  Building2,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Package,
  Wallet,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { useEffect, useState } from "react";
import { useLocale } from "@/hooks/use-locale";
import { useStoreData, type SectionId } from "@/components/store-data-provider";
import { fetchStoreProfile } from "@/lib/store";
import type { Bilingual } from "@/lib/i18n";

export const NAV_ITEMS: {
  id: SectionId;
  icon: LucideIcon;
  label: Bilingual;
}[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: { ar: "الرئيسية", en: "Dashboard Overview" },
  },
  {
    id: "orders",
    icon: Inbox,
    label: { ar: "الطلبات الواردة", en: "Incoming Orders" },
  },
  {
    id: "inventory",
    icon: Package,
    label: { ar: "مخزون القطع", en: "Parts Inventory" },
  },
  {
    id: "delivery",
    icon: KeyRound,
    label: { ar: "التسليم الذاتي", en: "Self-Delivery & OTP" },
  },
  {
    id: "earnings",
    icon: Wallet,
    label: { ar: "المبيعات والأرباح", en: "Sales & Earnings" },
  },
  {
    id: "reviews",
    icon: Star,
    label: { ar: "تقييمات المنتجات", en: "Product Reviews" },
  },
  {
    id: "settings",
    icon: Banknote,
    label: { ar: "الحسابات والمدفوعات", en: "Payouts & Settings" },
  },
  {
    id: "profile",
    icon: Building2,
    label: { ar: "الملف الشخصي", en: "Store Profile" },
  },

];

export function StoreSidebar({ className }: { className?: string }) {
  const { section, setSection } = useStoreData();
  const { t, locale } = useLocale();
  const [crNumber, setCrNumber] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStoreProfile().then((result) => {
      if (!cancelled && result.ok) setCrNumber(result.data.crNumber || null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav
      className={cn(
        "sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1.5 bg-sidebar p-3 md:flex",
        className,
      )}
      aria-label="Store navigation"
    >
      <div className="mb-4 flex items-center gap-2.5 px-2 pt-1">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent text-sm font-black text-white">
          ر
        </span>
        <span className="min-w-0">
<span className="block truncate text-sm font-bold text-white">
              {t({ ar: "متجرك", en: "Your Store" })}
            </span>
          <span className="block text-[11px] font-medium text-indigo-200">
            {locale === "ar" ? "لوحة التاجر" : "Merchant Dashboard"}
          </span>
        </span>
      </div>

      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = section === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-white/40",
              active
                ? "bg-sidebar-accent text-white shadow-sm"
                : "text-indigo-100 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-4.5 shrink-0" aria-hidden />
            <span className="truncate">{t(item.label)}</span>
          </button>
        );
      })}

      <div className="mt-auto rounded-xl border border-white/15 bg-white/5 p-3">
        <p className="text-[11px] font-semibold text-indigo-200">
          {locale === "ar" ? "رقم السجل التجاري" : "CR Number"}
        </p>
        <p className="mt-0.5 text-xs font-bold text-white" dir="ltr">
          {crNumber ?? "—"}
        </p>
      </div>
    </nav>
  );
}

export function MobileNav({ className }: { className?: string }) {
  const { section, setSection } = useStoreData();
  const { t } = useLocale();

  return (
    <nav
      className={cn(
        "flex gap-1.5 overflow-x-auto border-b bg-sidebar px-3 py-2 md:hidden",
        className,
      )}
      aria-label="Store navigation"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = section === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-sidebar-accent text-white"
                : "text-indigo-100 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {t(item.label)}
          </button>
        );
      })}
    </nav>
  );
}
