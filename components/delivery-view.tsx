"use client";

import * as React from "react";
import { cn } from "cn";
import { MapPin, Phone, Truck } from "lucide-react";
import { OtpButton, OtpModal } from "@/components/otp-modal";
import { OrderStatusBadge } from "@/components/order-table";
import { Panel, PanelHeader } from "@/components/panel";
import { useStoreData } from "@/components/store-data-provider";
import { useLocale } from "@/hooks/use-locale";
import { orderNumber, type StoreOrder } from "@/lib/data";
import {
  fetchDeliveryFees,
  type DeliveryFee,
  updateDeliveryFee,
} from "@/lib/api";

type Tab = "dispatch" | "fees";

export function DeliveryView() {
  const { orders } = useStoreData();
  const { t, dir } = useLocale();
  const [otpTarget, setOtpTarget] = React.useState<StoreOrder | null>(null);
  const [tab, setTab] = React.useState<Tab>("dispatch");
  const [fees, setFees] = React.useState<DeliveryFee[]>([]);
  const [feeLoading, setFeeLoading] = React.useState(false);
  const [editingCity, setEditingCity] = React.useState<string | null>(null);
  const [feeValue, setFeeValue] = React.useState("");

  // All orders are self-delivery in this setup; filter by active (non-completed) status
  const activeOrders = orders.filter(
    (order) => order.status !== "completed" && order.status !== "cancelled",
  );
  const activeOrder = otpTarget
    ? orders.find((order) => order.id === otpTarget.id) ?? null
    : null;

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setFeeLoading(true);
      try {
        const data = await fetchDeliveryFees();
        if (!cancelled) setFees(data);
      } catch (err) {
        console.error("Failed to load delivery fees", err);
      } finally {
        if (!cancelled) setFeeLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCity || !feeValue) return;
    const feeSar = Number(feeValue);
    if (!Number.isFinite(feeSar) || feeSar < 0) return;
    try {
      await updateDeliveryFee(editingCity, feeSar);
      setFees((prev) =>
        prev.map((f) => (f.city === editingCity ? { ...f, feeSar } : f)),
      );
      setEditingCity(null);
      setFeeValue("");
    } catch (err) {
      console.error("Failed to update delivery fee", err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelHeader
          title={t({ ar: "التسليم الذاتي و رمز OTP", en: "Self-Delivery & OTP" })}
          hint={t({
            ar: "طلبات يستلمها العميل من المحل — تتطلب تحقق OTP لإغلاق الطلب وتحفيز الدفعة",
            en: "Orders the customer picks up in-store — OTP verification closes the order and triggers the payout",
          })}
          action={
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-muted-foreground">
                <Truck className="size-3.5" aria-hidden />
                <span dir="ltr">
                  {activeOrders.filter((o) => o.status !== "completed").length} /{" "}
                  {activeOrders.length}
                </span>
              </span>
              <TabsValue tab={tab} onTabChange={setTab} t={t} dir={dir} />
            </div>
          }
        />
        {tab === "dispatch" ? (
          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
            {activeOrders.length === 0 ? (
              <p className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm font-semibold text-muted-foreground">
                {t({ ar: "لا توجد طلبات تسليم ذاتي", en: "No self-delivery orders" })}
              </p>
            ) : (
              activeOrders.map((order) => (
                <article
                  key={order.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground" dir="ltr">
                      {orderNumber(order.id)}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="text-sm">
                    <p className="font-semibold text-foreground">{order.customerName}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden />
                        {t(order.city)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3.5" aria-hidden />
                        <span dir="ltr">{order.customerPhone}</span>
                      </span>
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-card p-3 text-xs">
                    <p className="font-semibold text-foreground">{t(" من الطلب")}</p>
                    {order.items.map((part: any) => (
                      <div key={part.partNumber} className="flex justify-between gap-2 text-xs">
                        <span>{t(part.partNumber)}</span>
                        <span dir="ltr">
                          ×{part.quantity} · {part.unitPriceSar} SAR
                        </span>
                      </div>
                    ))}
                    <div className="mt-2 font-bold text-foreground">
                      {t("المبلغ الإجمالي")}
                      <span dir="ltr">{order.totalSar.toLocaleString("en-US")} SAR</span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2">
                    {order.status === "otp_generated" ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{t("كود التسليم:")}</span>
                        <span dir="ltr" className="font-mono text-primary">
                          {order.handoverOtp || "-"}
                        </span>
                      </div>
                    ) : (
                      <OtpButton order={order} onClick={() => setOtpTarget(order)} />
                    )}
                    {order.status === "completed" ? (
                      <span className="text-sm text-emerald-600">
                        {t("تم التسليم")}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {t("في الانتظار")}
                      </span>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        ) : (
          <DeliveryFeesPanel
            t={t}
            dir={dir}
            fees={fees}
            loading={feeLoading}
            editingCity={editingCity}
            feeValue={feeValue}
            setEditingCity={setEditingCity}
            setFeeValue={setFeeValue}
            onSaveFee={handleSaveFee}
          />
        )}

        <OtpModal order={activeOrder} onClose={() => setOtpTarget(null)} />
      </Panel>
    </div>
  );
}

function TabsValue({
  tab,
  onTabChange,
  t,
  dir,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  t: (key: { ar: string; en: string }) => string;
  dir: "ltr" | "rtl";
}) {
  return (
    <div
      className="flex gap-1 rounded-lg border border-border"
      role="tablist"
      aria-label={t({ ar: "تبويبات التسليم", en: "Delivery tabs" })}
    >
      <button
        role="tab"
        aria-selected={tab === "dispatch"}
        onClick={() => onTabChange("dispatch")}
        className={cn(
          "px-3 py-1.5 text-xs font-medium transition-colors",
          tab === "dispatch"
            ? "bg-primary text-primary-foreground"
            : "bg-background text-foreground hover:bg-muted",
        )}
      >
        {t({ ar: "طلبات", en: "Orders" })}
      </button>
      <button
        role="tab"
        aria-selected={tab === "fees"}
        onClick={() => onTabChange("fees")}
        className={cn(
          "px-3 py-1.5 text-xs font-medium transition-colors",
          tab === "fees"
            ? "bg-primary text-primary-foreground"
            : "bg-background text-foreground hover:bg-muted",
        )}
      >
        {t({ ar: "رسوم التوصيل", en: "Delivery Fees" })}
      </button>
    </div>
  );
}

function DeliveryFeesPanel({
  t,
  dir,
  fees,
  loading,
  editingCity,
  feeValue,
  setEditingCity,
  setFeeValue,
  onSaveFee,
}: {
  t: (key: { ar: string; en: string }) => string;
  dir: "ltr" | "rtl";
  fees: DeliveryFee[];
  loading: boolean;
  editingCity: string | null;
  feeValue: string;
  setEditingCity: (city: string | null) => void;
  setFeeValue: (value: string) => void;
  onSaveFee: (e: React.FormEvent) => void;
}) {
  return (
    <div className="p-4 space-y-4">
      {loading ? (
        <p className="col-span-full text-center text-sm text-muted-foreground">
          {t({ ar: "جارٍ التحميل…", en: "Loading…" })}
        </p>
      ) : (
        <>
          <form onSubmit={onSaveFee} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
            <NativeFeeSelect
              cities={fees.map((f) => f.city)}
              value={editingCity ?? ""}
              onChange={(city) => setEditingCity(city || null)}
              t={t}
            />
            <InputFee
              value={feeValue}
              onChange={(e) => setFeeValue(e.target.value)}
              placeholder={t({ ar: "الرسوم بالريال", en: "Fee in SAR" })}
              t={t}
            />
            <ButtonSave
              disabled={!editingCity || !feeValue}
              t={t}
            >
              {t({ ar: "حفظ", en: "Save" })}
            </ButtonSave>
          </form>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
                <th className="px-4 py-3 text-start">{t({ ar: "المدينة", en: "City" })}</th>
                <th className="px-4 py-3 text-start">{t({ ar: "الرسوم (SAR)", en: "Fee (SAR)" })}</th>
                <th className="px-4 py-3 text-start">{t({ ar: "الإجراء", en: "Action" })}</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr key={fee.city} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{fee.city}</td>
                  <td className="px-4 py-3 font-bold text-foreground" dir="ltr">
                    {fee.feeSar.toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-3">
                    <ButtonEdit
                      onClick={() => {
                        setEditingCity(fee.city);
                        setFeeValue(String(fee.feeSar));
                      }}
                      t={t}
                    >
                      {t({ ar: "تعديل", en: "Edit" })}
                    </ButtonEdit>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function NativeFeeSelect({
  cities,
  value,
  onChange,
  t,
}: {
  cities: string[];
  value: string;
  onChange: (value: string) => void;
  t: (key: { ar: string; en: string }) => string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-border px-3 py-2 text-sm"
    >
      {cities.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </select>
  );
}

function InputFee({
  value,
  onChange,
  placeholder,
  t,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  t: (key: { ar: string; en: string }) => string;
}) {
  return (
    <input
      type="number"
      min={0}
      step={0.01}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="rounded border border-border px-3 py-2 text-sm dir-ltr"
      dir="ltr"
    />
  );
}

function ButtonSave({
  disabled,
  children,
  t,
}: {
  disabled: boolean;
  children: React.ReactNode;
  t: (key: { ar: string; en: string }) => string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="rounded border border-border bg-background px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}

function ButtonEdit({
  onClick,
  children,
  t,
}: {
  onClick: () => void;
  children: React.ReactNode;
  t: (key: { ar: string; en: string }) => string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-border bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
    >
      {children}
    </button>
  );
}