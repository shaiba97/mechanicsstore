"use client";

import * as React from "react";
import { Loader2, Minus, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/hooks/use-locale";
import type { InventoryItem } from "@/lib/inventory";

const CONDITION_LABELS: Record<InventoryItem["condition"], { ar: string; en: string; oem: boolean }> = {
  OEM_ORIGINAL: { ar: "أصلي (OEM)", en: "OEM Original", oem: true },
  AFTERMARKET_COMMERCIAL: { ar: "بعد السوق", en: "Aftermarket", oem: false },
  USED: { ar: "مستعمل", en: "Used", oem: false },
};

function ConditionBadge({ condition }: { condition: InventoryItem["condition"] }) {
  const { t } = useLocale();
  const option = CONDITION_LABELS[condition];
  if (option.oem) {
    return (
      <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
        {t({ ar: option.ar, en: option.en })}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
      {t({ ar: option.ar, en: option.en })}
    </span>
  );
}

function StockStepper({
  item,
  busy,
  onStockChange,
}: {
  item: InventoryItem;
  busy: boolean;
  onStockChange: (item: InventoryItem, quantity: number) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label={t({ ar: `تقليل مخزون ${item.partNumber}`, en: `Decrease stock ${item.partNumber}` })}
        onClick={() => onStockChange(item, item.quantity - 1)}
        disabled={busy || item.quantity <= 0}
        className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <Input
        type="number"
        min={0}
        value={item.quantity}
        onChange={(event) => onStockChange(item, Math.max(0, Number(event.target.value) || 0))}
        aria-label={t({ ar: `كمية ${item.partNumber}`, en: `Quantity ${item.partNumber}` })}
        className="h-7 w-14 rounded-lg px-1 text-center text-sm font-bold"
      />
      <button
        type="button"
        aria-label={t({ ar: `زيادة مخزون ${item.partNumber}`, en: `Increase stock ${item.partNumber}` })}
        onClick={() => onStockChange(item, item.quantity + 1)}
        disabled={busy}
        className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
      {busy ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden /> : null}
    </div>
  );
}

export function InventoryTable({
  items,
  busyId,
  onStockChange,
  onToggleActive,
  onEdit,
  onDeleteTrigger,
}: {
  items: InventoryItem[];
  busyId: string | null;
  onStockChange: (item: InventoryItem, quantity: number) => void;
  onToggleActive: (item: InventoryItem, next: boolean) => void;
  onEdit: (item: InventoryItem) => void;
  onDeleteTrigger: (item: InventoryItem) => void;
}) {
  const { t, locale } = useLocale();
  const name = (item: InventoryItem) =>
    locale === "ar" ? item.partNameAr || item.partNameEn : item.partNameEn || item.partNameAr;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
            <th className="px-4 py-3 text-start">{t({ ar: "القطعة", en: "Part" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "الفئة", en: "Category" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "النوع", en: "Condition" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "التوافق", en: "Fitment" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "السعر", en: "Price" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "المخزون / الحد", en: "Stock / Min" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "نشط", en: "Active" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "إجراءات", en: "Actions" })}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const low = item.quantity <= item.minStockAlert;
            const busy = busyId === item.id;
            return (
              <tr
                key={item.id}
                className={cn(
                  "border-b border-border/70 transition-colors last:border-0 hover:bg-muted/30",
                  low && "bg-amber-50/50 hover:bg-amber-50",
                  !item.isActive && "opacity-60",
                )}
              >
                <td className="px-4 py-3">
                  <span className="block font-semibold text-foreground">{name(item)}</span>
                  <span className="block text-xs text-muted-foreground">
                    <span dir="ltr">{item.partNumber}</span>
                    {item.brandName ? ` · ${t(item.brandName)}` : ""}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.categoryName ? t(item.categoryName) : "—"}
                </td>
                <td className="px-4 py-3">
                  <ConditionBadge condition={item.condition} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <span dir="ltr">× {item.compatibilityVins.length}</span>
                </td>
                <td className="px-4 py-3 font-bold text-foreground">
                  <span dir="ltr">{item.price.toLocaleString("en-US")}</span>{" "}
                  <span className="text-xs font-semibold text-muted-foreground">SAR</span>
                </td>
                <td className={cn("px-4 py-3", low && "text-amber-700")}>
                  <StockStepper item={item} busy={busy} onStockChange={onStockChange} />
                  {low ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold">
                      <TriangleAlert className="size-3" aria-hidden />
                      {t({ ar: "مخزون منخفض", en: "Low stock" })}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={item.isActive}
                    disabled={busy}
                    onCheckedChange={(checked) => onToggleActive(item, checked)}
                    aria-label={t({
                      ar: `${item.isActive ? "تعطيل" : "تفعيل"} ${item.partNumber}`,
                      en: `${item.isActive ? "Deactivate" : "Activate"} ${item.partNumber}`,
                    })}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t({ ar: `تعديل ${item.partNumber}`, en: `Edit ${item.partNumber}` })}
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="size-4 text-muted-foreground" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy}
                      aria-label={t({ ar: `حذف ${item.partNumber}`, en: `Delete ${item.partNumber}` })}
                      onClick={() => onDeleteTrigger(item)}
                    >
                      <Trash2 className="size-4 text-destructive" aria-hidden />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
