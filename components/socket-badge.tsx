"use client";

import { cn } from "cn";
import { useLocale } from "@/hooks/use-locale";
import { useStoreData } from "@/components/store-data-provider";
import type { SocketStatus } from "@/lib/socket";

const STATUS_STYLES: Record<SocketStatus, { dot: string; label: { ar: string; en: string } }> = {
  connected: {
    dot: "bg-emerald-500",
    label: { ar: "مباشر", en: "Live" },
  },
  connecting: {
    dot: "bg-amber-500 animate-pulse",
    label: { ar: "جاري الاتصال", en: "Connecting" },
  },
  disconnected: {
    dot: "bg-red-500",
    label: { ar: "غير متصل", en: "Offline" },
  },
};

export function SocketBadge({ className }: { className?: string }) {
  const { socketStatus } = useStoreData();
  const { t } = useLocale();
  const style = STATUS_STYLES[socketStatus];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold",
        className,
      )}
      title={t({ ar: "بث الطلبات اللحظي", en: "Live order stream" })}
    >
      <span className={cn("size-2 rounded-full", style.dot)} aria-hidden />
      {t(style.label)}
    </span>
  );
}
