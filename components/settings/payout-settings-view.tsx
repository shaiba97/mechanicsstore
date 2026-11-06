"use client";

import * as React from "react";
import { Banknote, CheckCircle2, AlertCircle } from "lucide-react";
import { Panel, PanelHeader } from "@/components/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/hooks/use-locale";
import { fetchBankAccount, saveBankAccount } from "@/lib/store";
import type { BankAccountFieldError } from "@/lib/store";
import type { Bilingual } from "@/lib/i18n";

const KSA_BANKS: { code: string; label: Bilingual }[] = [
  { code: "Al Rajhi Bank", label: { ar: "مصرف الراجحي", en: "Al Rajhi Bank" } },
  { code: "Saudi National Bank (SNB)", label: { ar: "البنك الأهلي السعودي", en: "Saudi National Bank (SNB)" } },
  { code: "Riyad Bank", label: { ar: "بنك الرياض", en: "Riyad Bank" } },
  { code: "SABB", label: { ar: "ساب", en: "SABB" } },
  { code: "Alinma Bank", label: { ar: "البنك الإنماء", en: "Alinma Bank" } },
  { code: "Al Bilad Bank", label: { ar: "بنك البلاد", en: "Al Bilad Bank" } },
  { code: "Arab National Bank", label: { ar: "البنك العربي الوطني", en: "Arab National Bank" } },
  { code: "Bank Al-Jazira", label: { ar: "بنك الجزيرة", en: "Bank Al-Jazira" } },
  { code: "Emirates NBD KSA", label: { ar: "بنك الإمارات دبي الوطني - السعودية", en: "Emirates NBD KSA" } },
  { code: "Bank Al-Tadamon", label: { ar: "بنك التضامن", en: "Bank Al-Tadamon" } },
];

function ibanChecksumOk(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  if (!/^SA\d{22}$/.test(cleaned)) return false;
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const digit = Number.isNaN(Number(ch)) ? ch.charCodeAt(0) - 55 : Number(ch);
    remainder = (remainder * 10 + digit) % 97;
  }
  return remainder === 1;
}

type FieldErrorState = {
  bankName?: string;
  accountHolderName?: string;
  iban?: string;
};

function errorText(code: string): Bilingual {
  const map: Record<string, Bilingual> = {
    bank_required: { ar: "اختر البنك.", en: "Select a bank." },
    unknown_bank: { ar: "البنك غير معتمد.", en: "Bank not recognized." },
    holder_required: { ar: "أدخل اسم صاحب الحساب.", en: "Enter account holder name." },
    holder_mismatch: {
      ar: "اسم صاحب الحساب غير متطابق مع سجل المتجر.",
      en: "Holder name does not match store records.",
    },
    iban_required: { ar: "أدخل الآيبان.", en: "Enter IBAN." },
    iban_format: { ar: "يجب أن يبدأ الآيبان بـ SA ويتكون من 24 رمزاً.", en: "IBAN must start with SA and contain 24 characters." },
    iban_checksum: { ar: "رقم الآيبان غير صالح.", en: "Invalid IBAN checksum." },
  };
  return map[code] ?? { ar: "خطأ في الحقل.", en: "Field error." };
}

export function PayoutSettingsView() {
  const { t, locale } = useLocale();
  const [account, setAccount] = React.useState<{
    bankName: string;
    accountHolderName: string;
    iban: string;
    isVerified: boolean;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<{
    kind: "none" | "saved" | "error";
    message?: string;
  }>({ kind: "none" });
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrorState>({});

  const [bankName, setBankName] = React.useState("");
  const [accountHolderName, setAccountHolderName] = React.useState("");
  const [iban, setIban] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await fetchBankAccount();
      if (!cancelled && result.ok) setAccount(result.data ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = React.useCallback((field: keyof FieldErrorState, value: string) => {
    if (field === "bankName") setBankName(value);
    else if (field === "accountHolderName") setAccountHolderName(value);
    else if (field === "iban") setIban(value);
    const next = { ...fieldErrors };
    delete next[field];
    setFieldErrors(next);
  }, [fieldErrors]);

  const validateClient = (): FieldErrorState => {
    const errors: FieldErrorState = {};
    if (!bankName) errors.bankName = "bank_required";
    if (!accountHolderName.trim()) errors.accountHolderName = "holder_required";
    const cleaned = iban.replace(/\s/g, "").toUpperCase();
    if (!cleaned) errors.iban = "iban_required";
    else if (!/^SA\d{22}$/.test(cleaned)) errors.iban = "iban_format";
    else if (!ibanChecksumOk(iban)) errors.iban = "iban_checksum";
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors = validateClient();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus({ kind: "error", message: t({ ar: "أكمل الحقول الناقصة.", en: "Please complete the missing fields." }) });
      return;
    }
    setSubmitting(true);
    setStatus({ kind: "none" });
    const result = await saveBankAccount({
      bankName,
      accountHolderName: accountHolderName.trim(),
      iban: iban.replace(/\s/g, "").toUpperCase(),
    });
    setSubmitting(false);
    if (result.ok) {
      setAccount({
        bankName: result.data.bankName,
        accountHolderName: result.data.accountHolderName,
        iban: result.data.iban,
        isVerified: result.data.isVerified,
      });
      setStatus({ kind: "saved" });
      setFieldErrors({});
    } else {
      const next: FieldErrorState = {};
      for (const error of (result.fieldErrors ?? [])) {
        if (!(error.field in next)) next[error.field] = error.code;
      }
      setFieldErrors(next);
      setStatus({
        kind: "error",
        message: result.failure.error.en ?? t({ ar: "فشل حفظ الحساب البنكي.", en: "Failed to save bank account." }),
      });
    }
  };

  const isComplete = !loading && account !== null;
  const verified = account?.isVerified === true;

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelHeader
          title={t({ ar: "الحساب البنكي للمدفوعات", en: "Payout Bank Account" })}
          hint={t({
            ar: "تُحوَّل إليه مبيعات المتجر المكتملة بعد انتهاء فترة الاحتجاز السبعة أيام.",
            en: "Completed order payouts are transferred here after the seven-day escrow window.",
          })}
          action={
            verified ? (
              <Badge variant="default" className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
                {t({ ar: "موثق", en: "Verified" })}
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <AlertCircle className="size-3.5" aria-hidden />
                {t({ ar: "تحت اعتماد الإدارة", en: "Pending admin verification" })}
              </Badge>
            )
          }
        />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">
              {t({ ar: "البنك", en: "Bank" })}
            </Label>
            <NativeSelect
              value={bankName}
              onChange={(e) => handleChange("bankName", e.target.value)}
              disabled={submitting}
              className={fieldErrors.bankName ? "border-destructive" : undefined}
            >
              <option value="">{t({ ar: "اختر البنك", en: "Select bank" })}</option>
              {KSA_BANKS.map((bank) => (
                <NativeSelectOption key={bank.code} value={bank.code}>
                  {t(bank.label)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {fieldErrors.bankName && (
              <p className="mt-1 text-[11px] font-medium text-destructive">
                {t(errorText(fieldErrors.bankName))}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">
              {t({ ar: "اسم صاحب الحساب", en: "Account holder name" })}
            </Label>
            <Input
              value={accountHolderName}
              onChange={(e) => handleChange("accountHolderName", e.target.value)}
              disabled={submitting}
              className={fieldErrors.accountHolderName ? "border-destructive" : undefined}
            />
            {fieldErrors.accountHolderName && (
              <p className="mt-1 text-[11px] font-medium text-destructive">
                {t(errorText(fieldErrors.accountHolderName))}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 xl:col-span-2">
            <Label className="text-sm font-semibold text-foreground">
              {t({ ar: "الآيبان (SA + 22 رقمًا)", en: "IBAN (SA + 22 digits)" })}
            </Label>
            <Input
              value={iban}
              onChange={(e) => handleChange("iban", e.target.value)}
              disabled={submitting}
              placeholder="SA0380000000608010167519"
              dir="ltr"
              className={fieldErrors.iban ? "border-destructive" : undefined}
            />
            {fieldErrors.iban && (
              <p className="mt-1 text-[11px] font-medium text-destructive">
                {t(errorText(fieldErrors.iban))}
              </p>
            )}
          </div>
          <div className="xl:col-span-3 flex items-end gap-2">
            <Button type="submit" disabled={submitting || !isComplete}>
              {submitting ? t({ ar: "جاري الحفظ...", en: "Saving..." }) : t({ ar: "حفظ الحساب", en: "Save bank account" })}
            </Button>
          </div>
          {status.kind === "saved" && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 text-sm">
              <CheckCircle2 className="size-4" aria-hidden />
              {t({ ar: "تم حفظ الحساب البنكي.", en: "Bank account saved." })}
            </div>
          )}
          {status.kind === "error" && status.message && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-destructive text-sm">
              <AlertCircle className="size-4" aria-hidden />
              {t(status.message)}
            </div>
          )}
          {!verified && isComplete && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
              {t({
                ar: "سيتم تنفيذ المدفوعات بعد اعتماد الحساب من قبل إدارة المنصة.",
                en: "Payouts will be executed after the platform verifies this account.",
              })}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
