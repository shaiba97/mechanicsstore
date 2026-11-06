"use client";

import { KeyRound } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { formatDateTime, type Bilingual } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import { orderNumber, type Compatibility, type OrderStatus, type StoreOrder } from "@/lib/data";

const STATUS_STYLES: Record<OrderStatus, { className: string; label: Bilingual }> = {
  pending: {
    className: "border-indigo-200 bg-indigo-50 text-indigo-700",
    label: { ar: "جديد", en: "New" },
  },
  store_preparing: {
    className: "border-amber-200 bg-amber-50 text-amber-700",
    label: { ar: "قيد التجهيز", en: "Preparing" },
  },
  delivery_assigned: {
    className: "border-sky-200 bg-sky-50 text-sky-700",
    label: { ar: "الكابتن في الطريق", en: "Captain On the Way" },
  },
  out_for_delivery: {
    className: "border-blue-200 bg-blue-50 text-blue-700",
    label: { ar: "قيد التوصيل الذاتي", en: "Out for Self-Delivery" },
  },
  otp_generated: {
    className: "border-violet-200 bg-violet-50 text-violet-700",
    label: { ar: "بانتظار التحقق", en: "Awaiting OTP" },
  },
  completed: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    label: { ar: "تم التسليم", en: "Delivered" },
  },
  cancelled: {
    className: "border-rose-200 bg-rose-50 text-rose-700",
    label: { ar: "ملغي", en: "Cancelled" },
  },
};

const DEFAULT_STATUS_STYLE = {
  className: "border-border bg-muted text-muted-foreground",
  label: { ar: "غير معروف", en: "Unknown" } as Bilingual,
};

const COMPATIBILITY_STYLES: Record<
  Compatibility,
  { className: string; label: Bilingual }
> = {
  match: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    label: { ar: "مطابق للمركبة", en: "Vehicle Match" },
  },
  mismatch: {
    className: "border-amber-200 bg-amber-50 text-amber-700",
    label: { ar: "غير مطابق", en: "Incompatible" },
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useLocale();
  const style = STATUS_STYLES[status] ?? DEFAULT_STATUS_STYLE;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
        style.className,
      )}
    >
      {t(style.label)}
    </span>
  );
}

export function CompatibilityTag({ value }: { value: Compatibility }) {
  const { t } = useLocale();
  const style = COMPATIBILITY_STYLES[value];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
        style.className,
      )}
    >
      {t(style.label)}
    </span>
  );
}

export function OrderTable({
  orders,
  onVerifyOtp,
}: {
  orders: StoreOrder[];
  onVerifyOtp: (order: StoreOrder) => void;
}) {
  const { t, locale } = useLocale();

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm font-semibold text-muted-foreground">
        {t({ ar: "لا توجد طلبات حالياً", en: "No orders right now" })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
            <th className="px-4 py-3 text-start">{t({ ar: "الطلب", en: "Order" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "العميل", en: "Customer" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "المركبة", en: "Vehicle" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "القطع", en: "Parts" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "التوافق", en: "Compatibility" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "الإجمالي", en: "Total" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "الحالة", en: "Status" })}</th>
            <th className="px-4 py-3 text-start">{t({ ar: "الإجراء", en: "Action" })}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const canVerify =
              order.delivery === "self" && order.status !== "completed";
            return (
              <tr
                key={order.id}
                className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <span className="block font-bold text-foreground" dir="ltr">
                    {orderNumber(order.id)}
                  </span>
                  <span className="block text-xs text-muted-foreground" dir="ltr">
                    {formatDateTime(order.placedAt, locale)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="block font-semibold text-foreground">
                    {order.customerName}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t(order.city)} · <span dir="ltr">{order.phone}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="block font-semibold text-foreground">
                    {t(order.vehicle)}
                  </span>
                  <span className="block font-mono text-[11px] text-muted-foreground" dir="ltr">
                    {order.vin}
                  </span>
                </td>
                <td className="max-w-56 px-4 py-3">
                  <span className="block truncate text-xs text-muted-foreground">
                    {order.parts
                      .map((part) => `${t(part.name)} ×${part.qty}`)
                      .join("، ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <CompatibilityTag value={order.compatibility} />
                </td>
                <td className="px-4 py-3 font-bold text-foreground">
                  <span dir="ltr">{order.totalSar.toLocaleString("en-US")}</span>{" "}
                  <span className="text-xs font-semibold text-muted-foreground">SAR</span>
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">
                  {canVerify && onVerifyOtp ? (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      onClick={() => onVerifyOtp(order)}
                    >
                      <KeyRound aria-hidden />
                      {locale === "ar" ? "تحقق OTP" : "Verify OTP"}
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {order.status === "completed"
                        ? t({ ar: "مكتمل", en: "Done" })
                        : t({ ar: "مع الكابتن", en: "With captain" })}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
