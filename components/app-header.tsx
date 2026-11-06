"use client";

import { Bell, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { LocaleToggle } from "@/components/locale-toggle";
import { SocketBadge } from "@/components/socket-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { NAV_ITEMS } from "@/components/store-sidebar";
import { useStoreData } from "@/components/store-data-provider";
import { useLocale } from "@/hooks/use-locale";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.charAt(0) ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? "" : "";
  return `${first}${second}`.toUpperCase();
}

function roleLabel(role: string, t: (v: { ar: string; en: string }) => string): string {
  if (role === "STORE_ADMIN") return t({ ar: "مدير المتجر", en: "Store Admin" });
  if (role === "STORE_MANAGER") return t({ ar: "مسؤول المتجر", en: "Store Manager" });
  return t({ ar: "مندوب توصيل", en: "Driver" });
}

export function AppHeader({ className }: { className?: string }) {
  const { section, setSection, alerts } = useStoreData();
  const { user, logout, status } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const activeItem = NAV_ITEMS.find((item) => item.id === section) ?? NAV_ITEMS[0];

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-5 border-b border-border bg-card px-4 md:px-6",
        className,
      )}
    >
      <h1 className="min-w-0 flex-1 truncate text-base font-bold text-foreground">
        {t(activeItem.label)}
      </h1>

      {status === "authenticated" && user ? (
        <div className="flex shrink-0 items-center gap-4">
          <SocketBadge className="hidden sm:inline-flex" />

          <LocaleToggle />

          <button
            type="button"
            onClick={() => setSection("orders")}
            aria-label={t({ ar: "تنبيهات الطلبات الجديدة", en: "New order alerts" })}
            className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Bell className="size-4" aria-hidden />
            {alerts > 0 ? (
              <span className="absolute -top-1.5 -end-1.5 flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[10px] leading-none font-bold text-primary-foreground">
                {alerts > 9 ? "9+" : alerts}
              </span>
            ) : null}
          </button>

          <div
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5",
            )}
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground"
              title={user.email}
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="size-8 rounded-full object-cover" />
              ) : (
                initialsOf(user.fullName)
              )}
            </span>
            <div className="hidden sm:flex flex-col items-end sm:items-start gap-0.5 leading-none">
              <p className="truncate text-xs font-bold text-foreground">{user.fullName}</p>
              <p className="truncate text-[10px] font-bold text-muted-foreground">
                {roleLabel(user.role, t)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label={t({ ar: "تسجيل الخروج", en: "Sign out" })}
              title={t({ ar: "تسجيل الخروج", en: "Sign out" })}
              className="ml-1.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <LogOut className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <a
          href="/auth/login"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-4xl bg-primary px-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/80 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <UserRound className="size-4" aria-hidden />
          {t({ ar: "تسجيل الدخول", en: "Sign in" })}
        </a>
      )}
    </header>
  );
}
