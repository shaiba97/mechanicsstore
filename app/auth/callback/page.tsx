"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/hooks/use-locale";
import { adoptRefreshToken, clearSession, restoreSession } from "@/lib/auth";

function CallbackInner() {
  const { t } = useLocale();
  const { status } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const oauthError = params.get("error") !== null;
  const missingRefresh = !oauthError && !params.get("refresh_token");

  const derivedError =
    oauthError || missingRefresh
      ? t({
          ar: oauthError
            ? "فشل تسجيل الدخول عبر مزود الخدمة، حاول مرة أخرى أو استخدم البريد وكلمة المرور."
            : "رابط غير صالح، أعد المحاولة من صفحة تسجيل الدخول.",
          en: oauthError
            ? "Sign-in with the provider failed, try again or use email and password."
            : "Invalid link, please try again from the sign-in page.",
        })
      : null;

  React.useEffect(() => {
    if (derivedError || status === "authenticated") {
      router.replace(status === "authenticated" && !derivedError ? "/" : "/auth/login");
      return;
    }
    const refreshToken = params.get("refresh_token") ?? "";
    if (!adoptRefreshToken(refreshToken)) {
      clearSession();
      router.replace("/auth/login");
      return;
    }
    let cancelled = false;
    restoreSession().then((session) => {
      if (cancelled) return;
      if (session) {
        router.replace("/");
        return;
      }
      clearSession();
      router.replace("/auth/login");
    });
    return () => {
      cancelled = true;
    };
  }, [derivedError, params, router, status]);

  if (derivedError) {
    return (
      <AuthLayout
        title={t({ ar: "تعذّر إكمال تسجيل الدخول", en: "Couldn't complete sign-in" })}
        subtitle={t({
          ar: "حدث خلل أثناء التحقق من بيانات حسابك.",
          en: "Something went wrong while verifying your account.",
        })}
        footer={
          <a href="/auth/login" className="font-bold text-primary underline-offset-4 hover:underline">
            {t({ ar: "العودة إلى صفحة تسجيل الدخول", en: "Back to sign in" })}
          </a>
        }
      >
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive"
        >
          {derivedError}
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t({ ar: "جارٍ إكمال تسجيل الدخول", en: "Completing sign-in" })}
      subtitle={t({
        ar: "لحظة واحدة، نتحقق من بيانات حسابك.",
        en: "One moment, verifying your account.",
      })}
      footer={
        <a href="/auth/login" className="font-bold text-primary underline-offset-4 hover:underline">
          {t({ ar: "العودة إلى صفحة تسجيل الدخول", en: "Back to sign in" })}
        </a>
      }
    >
      <div className="flex items-center justify-center gap-3 py-6">
        <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm font-bold text-foreground">
          {t({ ar: "جارٍ التحقق…", en: "Verifying…" })}
        </span>
      </div>
    </AuthLayout>
  );
}

export default function AuthCallbackPage() {
  return (
    <React.Suspense fallback={null}>
      <CallbackInner />
    </React.Suspense>
  );
}
