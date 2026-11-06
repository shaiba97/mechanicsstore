"use client";

import * as React from "react";
import { cn } from "cn";
import { Panel, PanelHeader } from "@/components/panel";
import { fetchJson } from "@/lib/api";
import { useLocale } from "@/hooks/use-locale";
import { useStoreData } from "@/components/store-data-provider";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";

type Review = {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  productId: string;
  productName: { ar: string; en: string };
  partNumber: string;
  orderItemId: string;
  createdAt: string;
};

export function ReviewsView() {
  const { t } = useLocale();
  const { orders } = useStoreData();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const productFilter = searchParams.get("product") || undefined;
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (productFilter) params.set("product", productFilter);
        const data = await fetchJson<Review[] | { results?: Review[] }>(
          `reviews${productFilter ? `?product=${encodeURIComponent(productFilter)}` : ""}`,
        );
        if (!cancelled) setReviews(Array.isArray(data) ? data : data.results ?? []);
      } catch (err) {
        toast.add({
          title: t({ ar: "خطأ", en: "Error" }),
          description: t({ ar: "فشل تحميل التقييمات", en: "Failed to load reviews" }),
          type: "error",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [productFilter, t]);

  // Build product options from order items
  const productOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const options: { value: string; label: { ar: string; en: string } }[] = [];
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.partNumber;
        if (!seen.has(key)) {
          seen.add(key);
          options.push({
            value: key,
            label: { ar: item.partName.ar, en: item.partName.en },
          });
        }
      }
    }
    return options;
  }, [orders]);

  const stars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

  const averageRating = React.useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelHeader
          title={t({ ar: "تقييمات المنتجات", en: "Product Reviews" })}
          hint={t({
            ar: "ملاحظات العملاء ومرئياتهم حول المنتجات",
            en: "Customer feedback and ratings for products",
          })}
        />
        <div className="p-4 flex flex-col sm:flex-row gap-2 sm:items-end">
          <select
            onChange={(e) => {
              const product = e.target.value;
              const params = new URLSearchParams(searchParams.toString());
              params.set("product", product);
              router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }}
            className="rounded border border-border px-3 py-2 text-sm"
          >
            <option value="">{t({ ar: "جميع المنتجات", en: "All Products" })}</option>
            {productOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label.en} ({opt.label.ar})
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">
            {t({ ar: "تصفية", en: "Filter" })} ·
            {reviews.length > 0 && (
              <span>{t({ ar: "تقييمات", en: "Reviews" })}: {reviews.length}</span>
            )}
          </span>
        </div>

        {loading && (
          <p className="col-span-full text-center text-sm text-muted-foreground">
            {t({ ar: "جارٍ التحميل…", en: "Loading…" })}
          </p>
        )}

        <div className="p-4 space-y-3">
          {reviews.length === 0 ? (
            <p className="col-span-full text-center text-sm text-muted-foreground">
              {t({ ar: "لا توجد تقييمات", en: "No reviews yet" })}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-foreground" dir="ltr">
                      {stars(review.rating)}
                    </span>
                    <span className="text-xs text-muted-foreground" dir="ltr">
                      ({review.rating} / 5)
                    </span>
                  </div>
                  <p className="font-medium text-foreground truncate">
                    {t({ ar: "العميل", en: "Customer" })}: {review.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t({ ar: "المنتج", en: "Product" })}:{" "}
                    {t(review.productName)} ({review.partNumber})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t({ ar: "التعليق", en: "Comment" })}: {review.comment || "-"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}