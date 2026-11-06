"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel, PanelHeader } from "@/components/panel";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale } from "@/hooks/use-locale";
import {
  fetchStoreLedger,
  fetchStoreWeeklySales,
  type LedgerRow,
  type WeeklySalesEntry,
} from "@/lib/api";

const LEDGER_STYLES: Record<
  LedgerRow["status"],
  { className: string; label: { ar: string; en: string } }
> = {
  held: {
    className: "border-amber-200 bg-amber-50 text-amber-700",
    label: { ar: "محتجز", en: "Held" },
  },
  ready_for_payout: {
    className: "border-blue-200 bg-blue-50 text-blue-700",
    label: { ar: "جاهز للسداد", en: "Ready for Payout" },
  },
  processing: {
    className: "border-slate-200 bg-slate-50 text-slate-700",
    label: { ar: "جارٍ التنفيذ", en: "Processing" },
  },
  paid: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    label: { ar: "مدفوع", en: "Paid" },
  },
  failed: {
    className: "border-destructive/20 bg-destructive/50 text-destructive",
    label: { ar: "فشل", en: "Failed" },
  },
} as const;

export function EarningsView() {
  const { t, locale } = useLocale();
  const [weeklySales, setWeeklySales] = React.useState<WeeklySalesEntry[]>([]);
  const [commissionRate, setCommissionRate] = React.useState<number>(0);
  const [ledger, setLedger] = React.useState<LedgerRow[]>([]);
  const [summary, setSummary] = React.useState<{
    held: { count: number; amountSar: number };
    readyForPayout: { count: number; amountSar: number };
    processing: { count: number; amountSar: number };
    paid: { count: number; amountSar: number };
    failed: { count: number; amountSar: number };
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [sales, ledgerResult] = await Promise.all([
          fetchStoreWeeklySales(),
          fetchStoreLedger(),
        ]);
        if (!cancelled) {
          setWeeklySales(sales.weeklySales);
          setCommissionRate(sales.commissionRate);
          setLedger(ledgerResult.rows);
          setSummary(ledgerResult.summary.ledger);
        }
      } catch (err) {
        console.error("Failed to load earnings data", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const weekTotal = weeklySales.reduce((sum, day) => sum + day.sar, 0);
  const commission = weekTotal * commissionRate;
  const netEarnings = weekTotal - commission;
  const paidTotal = summary?.paid.amountSar ?? 0;
  const escrowHeld = (summary?.held.amountSar ?? 0) + (summary?.readyForPayout.amountSar ?? 0);

  const formatMoney = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const chartData = weeklySales.map((day) => ({
    day: t(day.day),
    sar: day.sar,
  }));

  const totals = ledger.reduce(
    (acc, row) => ({
      gross: acc.gross + row.totalAmount,
      commission: acc.commission + row.commissionAmount,
      net: acc.net + row.storePayoutAmount,
    }),
    { gross: 0, commission: 0, net: 0 },
  );

  const payoutDate = (row: LedgerRow) => {
    if (row.paidAt) return row.paidAt;
    if (row.payoutDueAt) return row.payoutDueAt;
    return row.createdAt;
  };

  return (
    <div className="flex flex-col gap-4">
      {loading && (
        <p className="col-span-full text-center text-sm text-muted-foreground">
          {t({ ar: "جارٍ التحميل…", en: "Loading…" })}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            id: "net",
            label: { ar: "صافي الأرباح (الأسبوع)", en: "Net Earnings (Week)" },
            value: netEarnings,
            tone: "text-emerald-600",
          },
          {
            id: "paid",
            label: { ar: "تم الدفع", en: "Paid Outs" },
            value: paidTotal,
            tone: "text-emerald-600",
          },
          {
            id: "escrow",
            label: { ar: "تحت الاحتجاز", en: "Escrow Held" },
            value: escrowHeld,
            tone: "text-amber-600",
          },
        ].map((entry) => (
          <div key={entry.id} className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <p className="text-xs font-semibold text-muted-foreground">{t(entry.label)}</p>
            <p className={`mt-1.5 text-2xl font-black ${entry.tone}`}>
              <span dir="ltr">
                {formatMoney(entry.value)}{" "}
                <span className="text-sm font-bold">SAR</span>
              </span>
            </p>
          </div>
        ))}
      </div>

      <Panel>
        <PanelHeader
          title={t({ ar: "المبيعات اليومية", en: "Daily Sales" })}
          hint={t({ ar: "آخر 7 أيام", en: "Last 7 days" })}
        />
        <div className="p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis
                dataKey="day"
                reversed={locale === "ar"}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                orientation={locale === "ar" ? "right" : "left"}
                width={48}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value) => [
                  `${formatMoney(Number(value))} SAR`,
                  t({ ar: "المبيعات", en: "Sales" }),
                ]}
              />
              <Bar dataKey="sar" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title={t({ ar: "سجل المدفوعات", en: "Payout Ledger" })}
          hint={t({
            ar: "حول رصيد المتجر إلى حسابك البنكي",
            en: "Ledger of store payouts and their escrow status",
          })}
        />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeader className="px-4 py-3 text-start">{t({ ar: "الطلب", en: "Order" })}</TableHeader>
                <TableHeader className="px-4 py-3 text-start">{t({ ar: "التاريخ", en: "Date" })}</TableHeader>
                <TableHeader className="px-4 py-3 text-end">{t({ ar: "الإجمالي", en: "Gross" })}</TableHeader>
                <TableHeader className="px-4 py-3 text-end">{t({ ar: "العمولة", en: "Commission" })}</TableHeader>
                <TableHeader className="px-4 py-3 text-end">{t({ ar: "الصافي", en: "Net" })}</TableHeader>
                <TableHeader className="px-4 py-3 text-start">{t({ ar: "الحالة", en: "Status" })}</TableHeader>
                <TableHeader className="px-4 py-3 text-end">{t({ ar: "مستحق في", en: "Due" })}</TableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((row) => {
                const style = LEDGER_STYLES[row.status];
                return (
                  <TableRow key={row.id} className="border-b border-border/70 last:border-0">
                    <TableCell className="px-4 py-3 font-bold text-foreground" dir="ltr">
                      {row.orderReference}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground" dir="ltr">
                      {payoutDate(row).slice(0, 10)}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-bold text-foreground text-end" dir="ltr">
                      <span dir="ltr">{formatMoney(row.totalAmount)}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end" dir="ltr">
                      <span dir="ltr">{formatMoney(row.commissionAmount)}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-bold text-foreground text-end" dir="ltr">
                      <span dir="ltr">{formatMoney(row.storePayoutAmount)}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${style.className}`}
                      >
                        {t(style.label)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground text-end" dir="ltr">
                      <span dir="ltr">{row.payoutDueAt ? row.payoutDueAt.slice(0, 10) : "—"}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {ledger.length > 0 && (
                <TableRow className="border-t border-border font-bold text-muted-foreground bg-muted/30">
                  <TableCell colSpan={2} className="px-4 py-3 text-start" />
                  <TableCell className="px-4 py-3 text-end" dir="ltr">
                    <span dir="ltr">{formatMoney(totals.gross)}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-end" dir="ltr">
                    <span dir="ltr">{formatMoney(totals.commission)}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-end" dir="ltr">
                    <span dir="ltr">{formatMoney(totals.net)}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3" />
                  <TableCell className="px-4 py-3" />
                </TableRow>
              )}
            </TableBody>
          </Table>
          {ledger.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground text-center">
              {t({ ar: "لا توجد مدفوعات بعد", en: "No payouts yet" })}
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}
