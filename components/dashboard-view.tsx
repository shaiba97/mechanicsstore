"use client";

import { ArrowLeft, ArrowRight, Check, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { KpiCards } from "@/components/kpi-cards";
import { OrderStatusBadge } from "@/components/order-table";
import { Panel, PanelHeader } from "@/components/panel";
import { useStoreData } from "@/components/store-data-provider";
import { useLocale } from "@/hooks/use-locale";
import { isLowStock, orderNumber } from "@/lib/data";

export function DashboardView() {
  const { orders, inventory, brands, cars, categories, catalogSource, setSection } =
    useStoreData();
  const { t, locale } = useLocale();
  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight;

  const recentOrders = orders.slice(0, 5);
  const lowStock = inventory.filter(isLowStock).slice(0, 6);
  const inventoryBrands = new Set(inventory.map((part) => part.brand.toLowerCase()));

  const activeBrands = brands.filter((brand) => brand.active);
  const activeCars = cars.filter((car) => car.active);
  const activeCategories = categories.filter((category) => category.active);
  const brandById = new Map(brands.map((brand) => [brand.id, brand]));

  const coverageHint =
    catalogSource === "loading"
      ? t({ ar: "جاري تحميل الكتالوج…", en: "Loading catalog…" })
      : t({
          ar: "مزامنة مباشرة من نظام المحل",
          en: "Live from the shop system",
        });

  return (
    <div className="flex flex-col gap-4">
      <KpiCards />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title={t({ ar: "أحدث الطلبات", en: "Recent Orders" })}
            hint={t({
              ar: "بث لحظي من عملائك",
              en: "Live stream from your customers",
            })}
            action={
              <button
                type="button"
                onClick={() => setSection("orders")}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                {t({ ar: "عرض الكل", en: "View all" })}
                <ArrowIcon className="size-3.5" aria-hidden />
              </button>
            }
          />
          <ul className="divide-y divide-border/70">
            {recentOrders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {order.customerName}
                    <span className="ms-2 text-xs font-medium text-muted-foreground">
                      {t(order.vehicle)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span dir="ltr">{orderNumber(order.id)}</span> · {t(order.city)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-bold text-foreground" dir="ltr">
                    {order.totalSar.toLocaleString("en-US")} SAR
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader
            title={t({ ar: "مخزون يحتاج متابعة", en: "Stock Needs Attention" })}
            hint={t({
              ar: "قطع وصلت للحد الأدنى",
              en: "Parts at or below threshold",
            })}
            action={
              <button
                type="button"
                onClick={() => setSection("inventory")}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                {t({ ar: "إدارة المخزون", en: "Manage inventory" })}
                <ArrowIcon className="size-3.5" aria-hidden />
              </button>
            }
          />
          <ul className="divide-y divide-border/70">
            {lowStock.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm font-semibold text-muted-foreground">
                {t({
                  ar: "كل المخزون ضمن الحدود الآمنة",
                  en: "All stock is within safe limits",
                })}
              </li>
            ) : (
              lowStock.map((part) => (
                <li
                  key={part.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {t(part.name)}
                    </p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {part.partNumber} · {part.brand}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    <TriangleAlert className="size-3" aria-hidden />
                    <span dir="ltr">
                      {part.qty}/{part.threshold}
                    </span>
                  </span>
                </li>
              ))
            )}
          </ul>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title={t({ ar: "نطاق الكتالوج", en: "Catalog Coverage" })}
          hint={coverageHint}
        />
        <div className="grid gap-5 p-4 lg:grid-cols-3">
          <section>
            <h3 className="mb-2.5 flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>{t({ ar: "العلامات", en: "Brands" })}</span>
              <span dir="ltr">
                {activeBrands.length}
              </span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeBrands.length === 0 ? (
                <p className="text-xs font-medium text-muted-foreground">
                  {t({ ar: "لا توجد علامات", en: "No brands" })}
                </p>
              ) : (
                activeBrands.map((brand) => {
                  const stocked =
                    inventoryBrands.has(brand.code.toLowerCase()) ||
                    inventoryBrands.has(brand.name.en.toLowerCase());
                  return (
                    <span
                      key={brand.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold",
                        stocked
                          ? "border-primary/40 bg-primary/5 text-primary"
                          : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {stocked ? <Check className="size-3.5" aria-hidden /> : null}
                      {t(brand.name)}
                      <span className="font-medium opacity-70" dir="ltr">
                        {brand.code}
                      </span>
                    </span>
                  );
                })
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-2.5 flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>{t({ ar: "المركبات المدعومة", en: "Supported Vehicles" })}</span>
              <span dir="ltr">{activeCars.length}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeCars.length === 0 ? (
                <p className="text-xs font-medium text-muted-foreground">
                  {t({ ar: "لا توجد مركبات", en: "No vehicles" })}
                </p>
              ) : (
                activeCars.map((car) => {
                  const brand = brandById.get(car.brandId);
                  return (
                    <span
                      key={car.id}
                      title={brand ? t(brand.name) : undefined}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground"
                    >
                      {brand ? (
                        <span className="font-medium text-muted-foreground" dir="ltr">
                          {brand.code} ·
                        </span>
                      ) : null}
                      {t(car.model)}{" "}
                      <span className="font-medium text-muted-foreground" dir="ltr">
                        {car.year}
                      </span>
                    </span>
                  );
                })
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-2.5 flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>{t({ ar: "الفئات", en: "Categories" })}</span>
              <span dir="ltr">{activeCategories.length}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeCategories.length === 0 ? (
                <p className="text-xs font-medium text-muted-foreground">
                  {t({ ar: "لا توجد فئات", en: "No categories" })}
                </p>
              ) : (
                activeCategories.map((category) => (
                  <span
                    key={category.id}
                    className="inline-flex items-center rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground"
                  >
                    {t(category.name)}
                  </span>
                ))
              )}
            </div>
          </section>
        </div>
      </Panel>
    </div>
  );
}
