"use client";

import { AlertTriangle, CheckCircle2, Clock3, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { useStoreData } from "@/components/store-data-provider";
import { useLocale } from "@/hooks/use-locale";
import type { Bilingual } from "@/lib/i18n";

type KpiDefinition = {
  id: string;
  icon: LucideIcon;
  label: Bilingual;
  tone: string;
};

const KPI_DEFINITIONS: KpiDefinition[] = [
  {
    id: "sales",
    icon: Wallet,
    label: { ar: "مبيعات اليوم", en: "Today's Sales" },
    tone: "bg-indigo-50 text-indigo-600",
  },
  {
    id: "pending",
    icon: Clock3,
    label: { ar: "طلبات معلقة", en: "Pending Orders" },
    tone: "bg-cyan-50 text-cyan-600",
  },
  {
    id: "stock",
    icon: AlertTriangle,
    label: { ar: "مخزون منخفض", en: "Low Stock Items" },
    tone: "bg-amber-50 text-amber-600",
  },
  {
    id: "delivered",
    icon: CheckCircle2,
    label: { ar: "تسليمات الأسبوع", en: "Completed Deliveries" },
    tone: "bg-emerald-50 text-emerald-600",
  },
];

export function KpiCards() {
  const { stats } = useStoreData();
  const { t } = useLocale();

  const values: Record<string, string> = {
    sales: stats.todaySalesSar.toLocaleString("en-US"),
    pending: String(stats.pendingOrders),
    stock: String(stats.lowStock),
    delivered: String(stats.completedWeek),
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_DEFINITIONS.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className="rounded-xl border border-border bg-card p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t(kpi.label)}
                </p>
                <p className="mt-1.5 flex items-baseline gap-1 text-2xl font-black text-foreground">
                  <span dir="ltr">{values[kpi.id]}</span>
                  {kpi.id === "sales" ? (
                    <span className="text-sm font-bold text-muted-foreground">SAR</span>
                  ) : null}
                </p>
              </div>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  kpi.tone,
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
