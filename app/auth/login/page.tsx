"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SocialButtons, SocialDivider } from "@/components/auth/social-buttons";
import { useLocale } from "@/hooks/use-locale";
import { clearSession } from "@/lib/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginPage() {
  const { t, locale } = useLocale();
  const { login, status } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [forgotHint, setForgotHint] = React.useState(false);

  React.useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const emailInvalid = email.length > 0 && !EMAIL_PATTERN.test(email.trim());
  const passwordInvalid = password.length > 0 && password.length < 8;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setErrorText(null);
    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrorText(t({ ar: "أدخل بريدًا إلكترونيًا صحيحًا.", en: "Enter a valid email address." }));
      return;
    }
    if (password.length < 8) {
      setErrorText(
        t({ ar: "كلمة المرور يجب أن تكون 8 أحرف على الأقل.", en: "Password must be at least 8 characters." }),
      );
      return;
    }
    setBusy(true);
    clearSession();
    const result = await login(email.trim().toLowerCase(), password, remember);
    setBusy(false);
    if (result.ok) {
      router.replace("/");
      return;
    }
    setErrorText(t(result.error));
  };

  return (
    <AuthLayout
      title={t({ ar: "تسجيل الدخول", en: "Sign in" })}
      subtitle={t({ ar: "أهلًا بعودتك، أدخل بياناتك للمتابعة.", en: "Welcome back, enter your credentials to continue." })}
      footer={
        <span>
          {t({ ar: "ليس لديك حساب؟ ", en: "Don't have an account? " })}
          <a
            href="/auth/register"
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            {t({ ar: "إنشاء حساب جديد", en: "Create a new account" })}
          </a>
        </span>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4" dir={locale === "ar" ? "rtl" : "ltr"}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-xs font-bold text-foreground">
            {t({ ar: "البريد الإلكتروني", en: "Email" })}
          </label>
          <Input
            id="login-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            placeholder="store@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={emailInvalid ? "true" : undefined}
            disabled={busy}
          />
          {emailInvalid ? (
            <p className="text-[11px] font-bold text-destructive">
              {t({ ar: "صيغة البريد الإلكتروني غير صحيحة.", en: "Email format is invalid." })}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-xs font-bold text-foreground">
              {t({ ar: "كلمة المرور", en: "Password" })}
            </label>
            <button
              type="button"
              onClick={() => setForgotHint((value) => !value)}
              className="text-xs font-bold text-primary underline-offset-4 hover:underline"
            >
              {t({ ar: "نسيت كلمة المرور؟", en: "Forgot password?" })}
            </button>
          </div>
          <Input
            id="login-password"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={passwordInvalid ? "true" : undefined}
            disabled={busy}
          />
          {passwordInvalid ? (
            <p className="text-[11px] font-bold text-destructive">
              {t({ ar: "كلمة المرور قصيرة جدًا.", en: "Password is too short." })}
            </p>
          ) : null}
          {forgotHint ? (
            <p className="rounded-xl bg-muted p-2.5 text-[11px] leading-relaxed text-muted-foreground">
              {t({
                ar: "إعادة تعيين كلمة المرور تتم عبر الدعم: support@mechanics.sa — أرسل لنا بريدك ورقم السجل التجاري.",
                en: "Password resets are handled by support: support@mechanics.sa — send us your email and CR number.",
              })}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="login-remember"
            checked={remember}
            onCheckedChange={(checked) => setRemember(checked)}
            disabled={busy}
          />
          <label
            htmlFor="login-remember"
            className="cursor-pointer text-xs font-bold text-foreground"
          >
            {t({ ar: "تذكرني على هذا الجهاز", en: "Remember me on this device" })}
          </label>
        </div>

        {errorText ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive"
          >
            {errorText}
          </p>
        ) : null}

        <Button type="submit" disabled={busy} className="h-10 w-full font-bold">
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t({ ar: "جارٍ تسجيل الدخول…", en: "Signing in…" })}
            </span>
          ) : (
            t({ ar: "تسجيل الدخول", en: "Sign in" })
          )}
        </Button>

        <SocialDivider />
        <SocialButtons />
      </form>
    </AuthLayout>
  );
}
