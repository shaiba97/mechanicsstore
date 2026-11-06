"use client";

import * as React from "react";
import { useLocale } from "@/hooks/use-locale";
import {
  fetchFinancialsSummary,
  fetchFlashReport,
  fetchStoreLedger,
  type FinancialPeriod,
  type FinancialRollup,
  type FinancialSummary,
  type FlashReport,
} from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/panel";

type PeriodOption = {
  id: FinancialPeriod;
  label: { ar: string; en: string };
};

const PERIODS: PeriodOption[] = [
  { id: "day", label: { ar: "يومي", en: "Daily Flash" } },
  { id: "week", label: { ar: "أسبوعي", en: "Weekly" } },
  { id: "month", label: { ar: "شهري", en: "Monthly" } },
  { id: "quarter", label: { ar: "ربع سنوي", en: "Quarterly" } },
  { id: "half", label: { ar: "نصف سنوي", en: "Half-Year" } },
  { id: "year", label: { ar: "سنوي", en: "Annual" } },
];

function formatMoney(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AccountingPeriodsView() {
  const { t, locale } = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const [period, setPeriod] = React.useState<FinancialPeriod>("month");
  const [summary, setSummary] = React.useState<FinancialSummary | null>(null);
  const [flash, setFlash] = React.useState<FlashReport | null>(null);
  const [escrowByStatus, setEscrowByStatus] = React.useState<{
    held: { count: number; amountSar: number };
    readyForPayout: { count: number; amountSar: number };
  } | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [summaryData, flashData, ledgerResult] = await Promise.all([
          fetchFinancialsSummary(period),
          fetchFlashReport(),
          fetchStoreLedger(),
        ]);
        if (!cancelled) {
          setSummary(summaryData);
          setFlash(flashData);
          setEscrowByStatus(ledgerResult.summary.ledger);
        }
      } catch (err) {
        console.error("Failed to load financials", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [period]);

  if (loading || !summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {t({ ar: "جارٍ التحميل…", en: "Loading…" })}
        </p>
      </div>
    );
  }

  const rollup: FinancialRollup[] = summary.rollup ?? [];

  return (
    <div className="flex flex-col gap-4" dir={dir} lang={locale}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-foreground">
            {t({ ar: "الفترات المحاسبية", en: "Accounting Periods" })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t({
              ar: "تجميع الإيرادات والعمولات وصافي المستحقات حسب الفترة المختارة.",
              en: "Aggregate revenue, commission, and net payouts by selected period.",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
            {t({ ar: "الفترة", en: "Period" })}
          </span>
          <div className="flex gap-1 rounded-xl border border-border bg-input/30 p-[3px]">
            {PERIODS.map((opt) => (
              <Button
                key={opt.id}
                variant={period === opt.id ? "default" : "ghost"}
                size="xs"
                onClick={() => setPeriod(opt.id)}
                className="rounded-lg text-xs font-medium"
              >
                {t(opt.label)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="p-4">
            <p className="text-xs font-bold text-muted-foreground">
              {t({ ar: "صافي مستحقات المتجر", en: "Net Store Payout" })}
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-600">
              <span dir="ltr">
                {formatMoney(summary.netPayoutSar)}{" "}
                <span className="text-xs font-bold">SAR</span>
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {summary.orderCount} {t({ ar: "طلب", en: "orders" })} · {summary.completedCount} {t({ ar: "مكتمل", en: "completed" })}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs font-bold text-muted-foreground">
              {t({ ar: "إجمالي المبيعات", en: "Gross Sales" })}
            </p>
            <p className="mt-1 text-2xl font-black text-foreground">
              <span dir="ltr">
                {formatMoney(summary.grossSalesSar)}{" "}
                <span className="text-xs font-bold">SAR</span>
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {t({ ar: "قيمة طلبات الفترة قبل العمولة", en: "Order value before platform commission" })}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs font-bold text-muted-foreground">
              {t({ ar: "العمولة المحصلة", en: "Platform Commission" })}
            </p>
            <p className="mt-1 text-2xl font-black text-indigo-600">
              <span dir="ltr">
                {formatMoney(summary.commissionSar)}{" "}
                <span className="text-xs font-bold">SAR</span>
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {t({ ar: "نسبة من قيمة الطلبات المكتملة", en: "Share of completed order value" })}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs font-bold text-muted-foreground">
              {t({ ar: "ضريبة القيمة المضافة", en: "ZATCA VAT Collected" })}
            </p>
            <p className="mt-1 text-2xl font-black text-foreground">
              <span dir="ltr">
                {formatMoney(summary.vatCollectedSar)}{" "}
                <span className="text-xs font-bold">SAR</span>
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              15% KSA VAT
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs font-bold text-muted-foreground">
              {t({ ar: "المبالغ المعلقة", en: "Escrow Held Balance" })}
            </p>
            <p className="mt-1 text-2xl font-black text-amber-600">
              <span dir="ltr">
                {formatMoney(summary.escrowHeldSar)}{" "}
                <span className="text-xs font-bold">SAR</span>
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {t({ ar: "حصلة التسليم", en: "delivery hold" })}
            </p>
          </div>
        </Card>
      </div>

      {period === "day" && flash && (
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="default" className="text-xs font-bold">
                {t({ ar: "تقرير الفلاش اليومي", en: "Daily Flash Report" })}
              </Badge>
              <span className="text-xs font-mono font-bold text-muted-foreground" dir="ltr">
                {flash.date}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-border bg-muted/50">
                <p className="text-xs font-bold text-muted-foreground">
                  {t({ ar: "التحصيل نقدًا ومدى", en: "Cash & Mada Inflow" })}
                </p>
                <p className="mt-1 text-xl font-black text-foreground">
                  <span dir="ltr">{formatMoney(flash.cashMadaInflowSar)} SAR</span>
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border bg-muted/50">
                <p className="text-xs font-bold text-muted-foreground">
                  {t({ ar: "الطلبات المسلمة", en: "Orders Fulfilled" })}
                </p>
                <p className="mt-1 text-xl font-black text-foreground" dir="ltr">
                  {flash.ordersFulfilled}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border bg-muted/50">
                <p className="text-xs font-bold text-muted-foreground">
                  {t({ ar: "عمليات التوصيل المعلقة", en: "Pending Dispatches" })}
                </p>
                <p className="mt-1 text-xl font-black text-amber-600" dir="ltr">
                  {flash.pendingDispatches}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border bg-muted/50">
                <p className="text-xs font-bold text-muted-foreground">
                  {t({ ar: "تنبيهات المخزون", en: "Inventory Alerts" })}
                </p>
                <p className="mt-1 text-xl font-black text-destructive" dir="ltr">
                  {flash.inventoryAlerts}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Panel>
        <PanelHeader
          title={t({ ar: "التسويات الاستحقاقية", en: "Accrual Accounting Adjustments" })}
          hint={t({
            ar: "تتبع الإيرادات والمصروفات لحظة حدوثها، نقدًا أو آجلًا.",
            en: "Track revenues and expenses when incurred — in cash and non-cash terms.",
          })}
        />
        <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="p-3 rounded-xl border border-border bg-muted/50">
            <p className="text-xs font-bold text-muted-foreground">
              {t({ ar: "الإيرادات المُكرّمة (استحقاقًا)", en: "Earned Revenue (Accrual)" })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t({
                ar: "قيمة الطلبات المُسلّمة فعليًا خلال الفترة.",
                en: "Value of orders delivered during the period.",
              })}
            </p>
            <p className="mt-2 text-lg font-black text-foreground">
              <span dir="ltr">
                {formatMoney(summary.accrual.earnedRevenueSar)}{" "}
                <span className="text-xs font-bold">SAR</span>
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {summary.completedCount} {t({ ar: "طلب مُسلّم", en: "delivered orders" })}
              {" · "}
              {summary.accrual.creditOrdersCount}               {t({ ar: "طلب آجل لم يُحصّل بعد", en: "COD delivered, not yet collected" })}
            </p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-muted/50">
            <p className="text-xs font-bold text-muted-foreground">
              {t({ ar: "الإيرادات المؤجلة (غير مُحقَّقة)", en: "Deferred Revenue (Unearned)" })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t({
                ar: "تحصيلات نقدية عن طلبات لم تُسلَّم بعد.",
                en: "Cash received for orders not yet delivered.",
              })}
            </p>
            <p className="mt-2 text-lg font-black text-foreground">
              <span dir="ltr">
                {formatMoney(summary.accrual.deferredRevenueSar)}{" "}
                <span className="text-xs font-bold">SAR</span>
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {summary.accrual.deferredOrdersCount}{" "}
              {t({ ar: "طلب قيد التنفيذ", en: "orders in fulfillment" })}
            </p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-muted/50">
            <p className="text-xs font-bold text-muted-foreground">
              {t({ ar: "التحصيل النقدي (نقدًا)", en: "Cash Collected (Cash Basis)" })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t({
                ar: "ما دخل فعليًا لدى المنصة عن هذه الفترة.",
                en: "Money actually received by the platform this period.",
              })}
            </p>
            <p className="mt-2 text-lg font-black text-foreground">
              <span dir="ltr">
                {formatMoney(summary.accrual.cashCollectedSar)}{" "}
                <span className="text-xs font-bold">SAR</span>
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {t({ ar: "دفعات بالبطاقات ومدى", en: "card & Mada payments" })}
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title={t({ ar: "ترحيل الفترات", en: "Period Roll-Up" })}
          hint={t({
            ar: "الشهور تُرحّل تلقائيًا إلى الأرباع والأنصاف والسنوات.",
            en: "Months roll up into quarters, halves, and the fiscal year automatically.",
          })}
        />
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
                <th className="px-4 py-3 text-start">{t({ ar: "الفترة", en: "Period" })}</th>
                <th className="px-4 py-3 text-start">{t({ ar: "النطاق", en: "Range" })}</th>
                <th className="px-4 py-3 text-end">{t({ ar: "صافي المستحقات", en: "Net Payout" })}</th>
                <th className="px-4 py-3 text-end">{t({ ar: "ضريبة القيمة المضافة", en: "VAT" })}</th>
                <th className="px-4 py-3 text-end">{t({ ar: "المعلق", en: "Escrow" })}</th>
              </tr>
            </thead>
            <tbody>
              {rollup.map((row) => (
                <tr key={row.label} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3 font-bold text-foreground">{row.label}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span dir="ltr">
                      {new Date(row.start).toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
                      {new Date(row.end).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-600 text-end">
                    <span dir="ltr">{formatMoney(row.netPayoutSar)}</span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <span dir="ltr">{formatMoney(row.vatCollectedSar)}</span>
                  </td>
                  <td className="px-4 py-3 text-end text-amber-600">
                    <span dir="ltr">{formatMoney(row.escrowHeldSar)}</span>
                  </td>
                </tr>
              ))}
              {rollup.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-sm text-muted-foreground">
                    {t({ ar: "لا توجد بيانات ترحيل", en: "No roll-up data available" })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title={t({ ar: "تحليل الاحتجاز حسب الحالة", en: "Escrow by Status" })}
          hint={t({
            ar: "مبالغ المدفوعات المحتجزة grouped حسب حالة السداد",
            en: "Escrow amounts grouped by payout status",
          })}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
            <p className="text-xs font-bold text-amber-800">
              {t({ ar: "محتجز", en: "Held" })}
            </p>
            <p className="mt-1 text-lg font-black text-amber-700">
              <span dir="ltr">
                {formatMoney(escrowByStatus?.held.amountSar ?? 0)} <span className="text-xs font-bold">SAR</span>
              </span>
            </p>
            <p className="text-[10px] text-amber-600">
              {escrowByStatus?.held.count ?? 0} {t({ ar: "طلب", en: "orders" })}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
            <p className="text-xs font-bold text-blue-800">
              {t({ ar: "جاهز للسداد", en: "Ready for Payout" })}
            </p>
            <p className="mt-1 text-lg font-black text-blue-700">
              <span dir="ltr">
                {formatMoney(escrowByStatus?.readyForPayout.amountSar ?? 0)} <span className="text-xs font-bold">SAR</span>
              </span>
            </p>
            <p className="text-[10px] text-blue-600">
              {escrowByStatus?.readyForPayout.count ?? 0} {t({ ar: "طلب", en: "orders" })}
            </p>
          </div>
        </div>
      </Panel>

      <div className="text-xs text-muted-foreground mt-2">
        {t({
          ar: "ملاحظة: ضريبة القيمة المضافة تُحسب بمعدل 15% (السعر القياسي لهيئة الزكاة والضريبة والجمارك).",
          en: "Note: VAT is calculated at the 15% KSA ZATCA standard rate.",
        })}
      </div>
    </div>
  );
}
