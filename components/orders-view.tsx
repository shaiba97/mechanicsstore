"use client";

import * as React from "react";
import { cn } from "cn";
import { OrderTable, OrderStatusBadge } from "@/components/order-table";
import { OtpModal } from "@/components/otp-modal";
import { Panel, PanelHeader } from "@/components/panel";
import { useStoreData } from "@/components/store-data-provider";
import { useLocale } from "@/hooks/use-locale";
import { orderNumber, type OrderStatus, type StoreOrder } from "@/lib/data";

export function OrdersView() {
  const { orders, setOrderStatus } = useStoreData();
  const { t } = useLocale();

  // Compute summary counts from live orders
  const statusCounts = [
    "pending",
    "store_preparing",
    "delivery_assigned",
    "otp_generated",
    "completed",
    "cancelled",
  ].map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));

  const [otpTarget, setOtpTarget] = React.useState<StoreOrder | null>(null);

  const advance = (order: StoreOrder) => {
    const next: Record<string, OrderStatus> = {
      pending: "store_preparing" as OrderStatus,
      store_preparing: "delivery_assigned" as OrderStatus,
      delivery_assigned: "otp_generated" as OrderStatus,
      otp_generated: "completed" as OrderStatus,
      completed: "completed" as OrderStatus,
      cancelled: "cancelled" as OrderStatus,
    };
    setOrderStatus(order.id, next[order.status] ?? order.status);
  };

  // Accept all pending orders → move to store_preparing
  const acceptAllPending = () => {
    orders.filter((o) => o.status === "pending").forEach((order) =>
      setOrderStatus(order.id, "store_preparing"),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelHeader
          title={t({ ar: "ملخص الطلبات", en: "Order Summary" })}
          hint={t({ ar: "الحالة المباشرة لطابور الطلبات", en: "Live state of the order queue" })}
        />
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          {statusCounts.map((entry) => (
            <div
              key={entry.status}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5"
            >
              <OrderStatusBadge status={entry.status as OrderStatus} />
              <span className="text-lg font-black text-foreground" dir="ltr">
                {entry.count}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title={t({ ar: "الطلبات الواردة", en: "Incoming Orders" })}
          hint={t({
            ar: "حدّث حالة الطلب أو تحقق من رمز OTP للتسليم الذاتي",
            en: "Advance order status or verify OTP for self-delivery",
          })}
          action={
            <button
              type="button"
              onClick={acceptAllPending}
              disabled={!orders.some((o) => o.status === "pending")}
              className={cn(
                "rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted",
                !orders.some((o) => o.status === "pending") && "pointer-events-none opacity-40",
              )}
            >
              {t({ ar: "قبول الكل", en: "Accept all" })}
            </button>
          }
        />
        <div className="p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {orders
              .filter((order) => order.status !== "completed")
              .map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => advance(order)}
                  title={t({ ar: "اضغط لتقديم الحالة", en: "Click to advance status" })}
                  className="group inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <span dir="ltr">{orderNumber(order.id)}</span>
                  <OrderStatusBadge status={order.status} />
                  <span className="hidden text-[10px] font-semibold text-primary group-hover:inline">
                    {t({ ar: "تقدّم ←", en: "advance →" })}
                  </span>
                </button>
              ))}
          </div>
          <OrderTable orders={orders} onVerifyOtp={(order) => setOtpTarget(order)} />
        </div>
      </Panel>

      <OtpModal order={otpTarget} onClose={() => setOtpTarget(null)} />
    </div>
  );
}