"use client";

import * as React from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useStoreData } from "@/components/store-data-provider";
import { useLocale } from "@/hooks/use-locale";
import { orderNumber, type StoreOrder } from "@/lib/data";

type ModalState = "idle" | "error" | "success";

function OtpForm({ order, onClose }: { order: StoreOrder; onClose: () => void }) {
  const { verifyOtp } = useStoreData();
  const { t } = useLocale();
  const [code, setCode] = React.useState("");
  const [state, setState] = React.useState<ModalState>("idle");

  React.useEffect(() => {
    if (state !== "success") return;
    const timer = setTimeout(onClose, 1600);
    return () => clearTimeout(timer);
  }, [state, onClose]);

  const handleVerify = () => {
    if (code.length !== 4) return;
    const matched = verifyOtp(order.id, code);
    setState(matched ? "success" : "error");
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-foreground" dir="ltr">
            {orderNumber(order.id)}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            {t(order.city)}
          </span>
        </div>
        <p className="mt-1 font-semibold text-foreground">{order.customerName}</p>
        <p className="text-xs text-muted-foreground">{t(order.vehicle)}</p>
      </div>

      {state === "success" ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-8" aria-hidden />
          </span>
          <p className="text-sm font-bold text-foreground">
            {t({ ar: "تم التسليم بنجاح", en: "Delivery completed" })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t({
              ar: "تم تحفيز دفعة العميل إلى حساب المتجر.",
              en: "The customer payout has been triggered to your store account.",
            })}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2">
          <InputOTP
            maxLength={4}
            value={code}
            onChange={(value) => {
              setCode(value);
              if (state === "error") setState("idle");
            }}
            onComplete={handleVerify}
            containerClassName="justify-center"
            aria-label={t({ ar: "رمز التحقق", en: "Verification code" })}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3].map((index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {state === "error" ? (
            <p className="text-xs font-bold text-red-600" role="alert">
              {t({
                ar: "رمز غير صحيح، تأكد من الرمز مع العميل.",
                en: "Incorrect code, check the code with the customer.",
              })}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t({
                ar: "يظهر الرمز في تطبيق العميل بعد تأكيد الاستلام.",
                en: "The code appears in the customer's app after confirming receipt.",
              })}
            </p>
          )}
        </div>
      )}

      <DialogFooter className="gap-2 sm:justify-between">
        <Button type="button" variant="ghost" onClick={onClose}>
          <X aria-hidden />
          {t({ ar: "إغلاق", en: "Close" })}
        </Button>
        {state !== "success" ? (
          <Button
            type="button"
            onClick={handleVerify}
            disabled={code.length !== 4}
            className="rounded-full"
          >
            {t({ ar: "تحقق وتسليم", en: "Verify & Deliver" })}
          </Button>
        ) : null}
      </DialogFooter>
    </>
  );
}

export function OtpModal({
  order,
  onClose,
}: {
  order: StoreOrder | null;
  onClose: () => void;
}) {
  const { t } = useLocale();

  return (
    <Dialog open={order !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t({ ar: "تأكيد تسليم الطلب", en: "Confirm Order Delivery" })}
          </DialogTitle>
          <DialogDescription>
            {t({
              ar: "اطلب من العميل إدخال رمز التحقق المكوّن من 4 أرقام لإتمام التسليم.",
              en: "Ask the customer for their 4-digit verification code to complete the delivery.",
            })}
          </DialogDescription>
        </DialogHeader>
        {order ? <OtpForm key={order.id} order={order} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

export function OtpButton({
  order,
  onClick,
  className,
}: {
  order: StoreOrder;
  onClick: () => void;
  className?: string;
}) {
  const { t } = useLocale();
  if (order.status === "completed") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700",
          className,
        )}
      >
        <CheckCircle2 className="size-3.5" aria-hidden />
        {t({ ar: "تم التحقق", en: "Verified" })}
      </span>
    );
  }
  return (
    <Button type="button" size="sm" className={cn("rounded-full", className)} onClick={onClick}>
      {t({ ar: "تحقق من OTP", en: "Verify OTP" })}
    </Button>
  );
}
