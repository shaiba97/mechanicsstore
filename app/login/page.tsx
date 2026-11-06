"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/use-locale";
import { useState } from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { locale, dir, t, setLocale } = useLocale();
  const router = useRouter();

  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = React.useState<boolean | null>(null);

  // Effect: apply dir to document element
  useEffect(() => {
    document.documentElement.dir = dir;
  }, [dir]);

  // Handle language switch
  const handleLanguageSwitch = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    setLocale(newLocale);
  };

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate successful login
      setSuccess(true);
      setIsSubmitting(false);

      // Redirect after successful login
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center p-4 dir={dir}"
      style={{ transition: "direction 0.3s ease" }}
    >
      {/* Language Switcher Header */}
      <div className="fixed top-4 left-4 md:top-6 md:left-6 flex items-center gap-2">
        <Button
          size="icon"
          onClick={handleLanguageSwitch}
          aria-label={locale === "en" ? "Switch to Arabic" : "Switch to English"}
          className="rounded-full p-2 bg-white/20 backdrop-blur-sm text-lg"
        >
          {locale === "en" ? "العربية" : "English"}
        </Button>
      </div>

      {/* Glassmorphic Login Card */}
      <div
        className="relative w-full max-w-md md:max-w-lg transform overflow-hidden rounded-3xl border border-border bg-card/90 backdrop-blur-xl shadow-2xl border-border"
        style={{ transition: "transform 0.3s ease" }}
      >
        {/* Gradient Background Layer */}
        <div
          className="absolute inset-0 -z-10 transform rotate-6 bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-500"
        ></div>

        {/* Card Content */}
        <div className="relative z-10 px-6 py-8">
          {/* Header with Language Toggle */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <h2 className="text-2xl font-extrabold text-foreground mb-2">
              {t({ ar: "تسجيل الدخول", en: "Sign In" })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t({
                ar: "أدخل بيانات الدخول للوصول إلى لوحة التحكم",
                en: "Enter your credentials to access the control panel",
              })}
            </p>

            {/* Language Toggle */}
            <div className="flex gap-2 mt-3">
              <Button
                size="icon"
                onClick={handleLanguageSwitch}
                aria-label={locale === "en" ? "Switch to Arabic" : "Switch to English"}
                className="rounded-full p-2 bg-white/20 backdrop-blur-sm"
              >
                {locale === "en" ? "العربية" : "English"}
              </Button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                {t({ ar: "البريد الإلكتروني", en: "Email" })}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t({ ar: "example@domain.com", en: "example@domain.com" })}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-placeholder placeholder-abg"
                style={{ direction: "ltr" }}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                {t({ ar: "كلمة المرور", en: "Password" })}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  placeholder={t({ ar: "••••••••", en: "••••••••" })}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-placeholder placeholder-pss"
                  style={{ direction: "ltr" }}
                />
                <Button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 bg-white/20 hover:bg-white/30 text-sm text-muted-foreground"
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                >
                  {isPasswordVisible ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                disabled={isSubmitting || !email || !password}
                className="w-full py-3 rounded-lg font-medium transition-colors hover:opacity-90"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin size-4 border-2 border-current border-white/30 rounded-full" />
                    {locale === "en" ? "Signing In" : "تسجيل الدخول"}
                  </span>
                ) : (
                  locale === "en" ? "Sign In" : "تسجيل الدخول"
                )}
              </Button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-center text-sm text-muted-foreground mt-1">
              {locale === "en" ? "Forgot password?" : "نسيت كلمة المرور?"}
            </div>
          </form>
        </div>
      </div>

      {/* Error/Success Banner */}
      {error && (
        <div
          className="fixed bottom-4 left-1/2 -left-1/2 max-w-md w-full p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-center text-sm animate-in fade-in-0 fade-in-duration-500"
        >
          {t({ ar: "خطأ", en: "Error" })}: {error}
        </div>
      )}

      {success && (
        <div
          className="fixed bottom-4 left-1/2 -left-1/2 max-w-md w-full p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-center text-sm animate-in fade-in-0 fade-in-duration-500"
        >
          {t({ ar: "نجح", en: "Success" })}! {t({ ar: "تم تسجيل الدخول", en: "Signed in successfully" })}
        </div>
      )}
    </div>
  );
}