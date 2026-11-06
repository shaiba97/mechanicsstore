"use client";

import * as React from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/auth-provider";
import { clearSession } from "@/lib/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SocialButtons, SocialDivider } from "@/components/auth/social-buttons";
import { useLocale } from "@/hooks/use-locale";
import TermsPage from "@/app/legal/terms/page";
import PrivacyPage from "@/app/legal/privacy/page";
import type { Bilingual } from "@/lib/i18n";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CR_PATTERN = /^[0-9]{1,20}$/;

const TERMS_VERSION = "v1.0";

const FIELD_KEYS = {
  "register-full-name": "fullName",
  "register-store-name": "storeName",
  "register-cr-number": "crNumber",
  "register-email": "email",
  "register-password": "password",
} as const;

type TextField = {
  id: string;
  label: { ar: string; en: string };
  placeholder: string;
  type: "text" | "email" | "password";
  autoComplete?: string;
  dir?: "ltr" | "rtl";
};

const registerSchema = z.object({
  fullName: z.string().min(2, { message: "fullName" }),
  storeName: z.string().min(2, { message: "storeName" }),
  crNumber: z.string().regex(CR_PATTERN, { message: "crNumber" }),
  email: z.string().email({ message: "email" }),
  password: z.string().min(8, { message: "password" }),
  accepted_terms: z
    .boolean()
    .refine((v) => v === true, { message: "termsAccepted" }),
});

const FIELD_MESSAGES: Record<string, Bilingual> = {
  fullName: { ar: "Enter your full name.", en: "Enter your full name." },
  storeName: { ar: "Enter store name.", en: "Enter store name." },
  crNumber: { ar: "CR number must be digits only.", en: "CR number must be digits only." },
  email: { ar: "Enter a valid email address.", en: "Enter a valid email address." },
  password: { ar: "Password must be at least 8 characters.", en: "Password must be at least 8 characters." },
  termsAccepted: {
    ar: "يجب الموافقة على الشروط والأحكام لاستكمال التسجيل",
    en: "You must accept the terms and conditions to complete registration",
  },
};

export default function RegisterPage() {
  const { t, locale } = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const { register, status } = useAuth();
  const router = useRouter();
  const [values, setValues] = React.useState({
    fullName: "",
    storeName: "",
    crNumber: "",
    email: "",
    password: "",
  });
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [termsOpen, setTermsOpen] = React.useState(false);
  const [privacyOpen, setPrivacyOpen] = React.useState(false);

  React.useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const fields: TextField[] = [
    {
      id: "register-full-name",
      label: { ar: "الاسم الكامل", en: "Full Name" },
      placeholder: t({ ar: "مثال: Abdullah Alharbi", en: "e.g. Abdullah Alharbi" }),
      type: "text",
      autoComplete: "name",
    },
    {
      id: "register-store-name",
      label: { ar: "اسم المتجر", en: "Store Name" },
      placeholder: t({ ar: "مثال: Elite Spare Parts", en: "e.g. Elite Spare Parts" }),
      type: "text",
    },
    {
      id: "register-cr-number",
      label: { ar: "رقم السجل التجاري", en: "CR Number" },
      placeholder: "7000000000",
      type: "text",
      dir: "ltr",
      autoComplete: "off",
    },
    {
      id: "register-email",
      label: { ar: "البريد الإلكتروني", en: "Email" },
      placeholder: "store@example.com",
      type: "email",
      dir: "ltr",
      autoComplete: "email",
    },
    {
      id: "register-password",
      label: { ar: "كلمة المرور", en: "Password" },
      placeholder: t({ ar: "8 أحرف على الأقل", en: "At least 8 characters" }),
      type: "password",
      dir: "ltr",
      autoComplete: "new-password",
    },
  ];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const result = registerSchema.safeParse({ ...values, accepted_terms: termsAccepted });
    if (!result.success) {
      const firstField = String(result.error.issues[0]?.path[0] ?? "");
      setErrorText(t(FIELD_MESSAGES[firstField] ?? { ar: "خطأ في التحقق من البيانات", en: "Validation error" }));
      return;
    }
    setErrorText(null);
    setBusy(true);
    clearSession();
    const result2 = await register({
      fullName: values.fullName.trim(),
      storeName: values.storeName.trim(),
      crNumber: values.crNumber.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      accepted_terms: true,
      terms_version: TERMS_VERSION,
    });
    setBusy(false);
    if (result2.ok) {
      router.replace("/");
      return;
    }
    setErrorText(t(result2.error));
  };

  return (
    <AuthLayout
      title={t({ ar: "Creating a store account", en: "Create a store account" })}
      subtitle={t({
        ar: "Register your store to start receiving orders and managing spare parts.",
        en: "Register your store to start receiving orders and managing spare parts.",
      })}
      footer={
        <span>
          {t({ ar: "Already have an account?", en: "Already have an account? " })}
          <a
            href="/auth/login"
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            {t({ ar: "Sign in", en: "Sign in" })}
          </a>
        </span>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-3.5" dir={dir}>
        {fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-1.5">
            <label htmlFor={field.id} className="text-xs font-bold text-foreground">
              {t(field.label)}
            </label>
            <Input
              id={field.id}
              type={field.type}
              dir={field.dir}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              value={values[FIELD_KEYS[field.id as keyof typeof FIELD_KEYS]]}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  [FIELD_KEYS[field.id as keyof typeof FIELD_KEYS]]: event.target.value,
                }))
              }
              disabled={busy}
            />
          </div>
        ))}

        <div className="flex items-start gap-2 pt-1">
          <Checkbox
            id="register-terms"
            checked={termsAccepted}
            onCheckedChange={setTermsAccepted}
            required
            disabled={busy}
          />
          <div className="text-sm text-foreground leading-relaxed" dir={dir}>
            {locale === "ar" ? (
              <>
                أوافق على{" "}
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="inline text-primary underline-offset-4 hover:underline font-medium p-0 bg-none border-none cursor-pointer text-sm"
                >
                  شروط وأحكام الاستخدام
                </button>
                و{" "}
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(true)}
                  className="inline text-primary underline-offset-4 hover:underline font-medium p-0 bg-none border-none cursor-pointer text-sm"
                >
                  سياسة الخصوصية
                </button>
                الخاصة بمنصة قطع الغيار
              </>
            ) : (
              <>
                I agree to the Store{" "}
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="inline text-primary underline-offset-4 hover:underline font-medium p-0 bg-none border-none cursor-pointer text-sm"
                >
                  Terms of Use
                </button>
                and{" "}
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(true)}
                  className="inline text-primary underline-offset-4 hover:underline font-medium p-0 bg-none border-none cursor-pointer text-sm"
                >
                  Privacy Policy
                </button>
              </>
            )}
          </div>
        </div>

        {errorText ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive"
          >
            {errorText}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={busy || !termsAccepted}
          className="mt-1 h-10 w-full font-bold"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t({ ar: "Creating account…", en: "Creating account…" })}
            </span>
          ) : (
            t({ ar: "Create account", en: "Create account" })
          )}
        </Button>

        <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
          <DialogContent>
            <DialogTitle>{t({ ar: "شروط وأحكام الاستخدام", en: "Terms of Use" })}</DialogTitle>
            <DialogDescription>
              <TermsPage />
            </DialogDescription>
          </DialogContent>
        </Dialog>

        <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
          <DialogContent>
            <DialogTitle>{t({ ar: "سياسة الخصوصية", en: "Privacy Policy" })}</DialogTitle>
            <DialogDescription>
              <PrivacyPage />
            </DialogDescription>
          </DialogContent>
        </Dialog>

        <SocialDivider />
        <SocialButtons />
      </form>
    </AuthLayout>
  );
}
