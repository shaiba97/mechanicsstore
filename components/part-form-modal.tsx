"use client";

import * as React from "react";
import { Plus, Trash2, Image, Upload } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/hooks/use-locale";
import type { BackendBrand, BackendCar, BackendCategory } from "@/lib/api";
import { uploadInventoryImage } from "@/lib/api";
import type {
  InventoryCondition,
  InventoryItem,
  InventoryItemInput,
} from "@/lib/inventory";

type CompatRow = { makeId: string; carId: string; yearFrom: string; yearTo: string };

type FormState = {
  partNameAr: string;
  partNameEn: string;
  partNumber: string;
  categoryId: string;
  brandId: string;
  condition: InventoryCondition;
  price: string;
  quantity: string;
  minStockAlert: string;
  imageUrl: string;
  isActive: boolean;
  model: string;
  yearFrom: string;
  yearTo: string;
  compat: CompatRow[];
};

type FieldErrors = Partial<
  Record<
    | "partNameAr"
    | "partNameEn"
    | "partNumber"
    | "price"
    | "quantity"
    | "minStockAlert"
    | "imageUrl",
    { ar: string; en: string }
  >
>;

const CONDITIONS: Array<{ value: InventoryCondition; ar: string; en: string; badge: boolean }> = [
  { value: "OEM_ORIGINAL", ar: "أصلي (OEM)", en: "OEM Original", badge: true },
  { value: "AFTERMARKET_COMMERCIAL", ar: "بعد السوق", en: "Aftermarket", badge: false },
  { value: "USED", ar: "مستعمل", en: "Used", badge: false },
];

function emptyForm(): FormState {
  return {
    partNameAr: "",
    partNameEn: "",
    partNumber: "",
    categoryId: "",
    brandId: "",
    condition: "AFTERMARKET_COMMERCIAL",
    price: "",
    quantity: "",
    minStockAlert: "2",
    imageUrl: "",
    isActive: true,
    model: "",
    yearFrom: "",
    yearTo: "",
    compat: [],
  };
}

function formFromItem(item: InventoryItem): FormState {
  return {
    partNameAr: item.partNameAr,
    partNameEn: item.partNameEn,
    partNumber: item.partNumber,
    categoryId: item.categoryId ?? "",
    brandId: item.brandId ?? "",
    condition: item.condition,
    price: String(item.price),
    quantity: String(item.quantity),
    minStockAlert: String(item.minStockAlert),
    imageUrl: item.imageUrl,
    isActive: item.isActive,
    model: item.model,
    yearFrom: String(item.yearFrom),
    yearTo: String(item.yearTo),
    compat: [],
  };
}

export function PartFormModal({
  open,
  onOpenChange,
  item,
  brands,
  cars,
  categories,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  brands: BackendBrand[];
  cars: BackendCar[];
  categories: BackendCategory[];
  onSubmit: (input: InventoryItemInput) => Promise<boolean>;
}) {
  const { t, dir } = useLocale();
  const [form, setForm] = React.useState<FormState>(() =>
    item ? formFromItem(item) : emptyForm(),
  );
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [imageUploading, setImageUploading] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const patch = (partial: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const filteredCars = React.useMemo(
    () => (form.brandId ? cars.filter((car) => car.brandId === form.brandId) : cars),
    [cars, form.brandId],
  );

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!form.partNameAr.trim()) {
      next.partNameAr = { ar: "الاسم بالعربية مطلوب.", en: "Arabic name is required." };
    }
    if (!form.partNameEn.trim()) {
      next.partNameEn = { ar: "الاسم بالإنجليزية مطلوب.", en: "English name is required." };
    }
    if (!form.partNumber.trim()) {
      next.partNumber = { ar: "رقم القطعة مطلوب.", en: "Part number is required." };
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      next.price = { ar: "السعر يجب أن يكون رقمًا غير سالب.", en: "Price must be a non-negative number." };
    }
    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      next.quantity = { ar: "الكمية يجب أن تكون عددًا صحيحًا.", en: "Quantity must be a whole number." };
    }
    const minStock = Number(form.minStockAlert);
    if (!Number.isInteger(minStock) || minStock < 0) {
      next.minStockAlert = { ar: "الحد الأدنى يجب أن يكون عددًا صحيحًا.", en: "Threshold must be a whole number." };
    }
    return next;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, imageUrl: { ar: "يرجى اختيار ملف صورة.", en: "Please select an image file." } }));
      return;
    }
    setImageUploading(true);
    try {
      const { url } = await uploadInventoryImage(file);
      patch({ imageUrl: url });
      setImagePreview(url);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.imageUrl;
        return next;
      });
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        imageUrl: { ar: "فشل رفع الصورة.", en: "Failed to upload image." },
      }));
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const price = Number(form.price);
    const quantity = Number(form.quantity);
    const minStock = Number(form.minStockAlert);
    setSubmitting(true);
    const compatibility = form.compat.flatMap((row) => {
      const yearFrom = Number(row.yearFrom);
      const yearTo = Number(row.yearTo);
      if (!row.makeId || !row.carId || !Number.isFinite(yearFrom) || !Number.isFinite(yearTo)) {
        return [];
      }
      const brand = brands.find((entry) => entry.id === row.makeId);
      const car = cars.find((entry) => entry.id === row.carId);
      if (!brand || !car || yearFrom > yearTo) return [];
      return [{ make: brand.name, model: car.model, yearFrom, yearTo }];
    });
    const success = await onSubmit({
      partNameAr: form.partNameAr.trim(),
      partNameEn: form.partNameEn.trim(),
      partNumber: form.partNumber.trim(),
      categoryId: form.categoryId || null,
      brandId: form.brandId || null,
      model: form.model,
      yearFrom: Number(form.yearFrom),
      yearTo: Number(form.yearTo),
      condition: form.condition,
      price,
      quantity,
      minStockAlert: minStock,
      compatibilityVins: compatibility,
      imageUrl: form.imageUrl.trim(),
      isActive: form.isActive,
    });
    setSubmitting(false);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {item
              ? t({ ar: "تعديل قطعة", en: "Edit Part" })
              : t({ ar: "إضافة قطعة جديدة", en: "Add New Part" })}
          </DialogTitle>
          <DialogDescription>
            {t({
              ar: "املأ بيانات القطعة الأساسية والأسعار والمخزون والتوافق.",
              en: "Fill in the part info, pricing, stock, and vehicle compatibility.",
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6" dir={dir}>
          <fieldset className="grid gap-3">
            <legend className="text-xs font-bold text-primary">
              {t({ ar: "أ. المعلومات الأساسية", en: "A. Basic Info" })}
            </legend>
            <div className="grid gap-1.5">
              <Label htmlFor="part-name-ar">{t({ ar: "الاسم بالعربية", en: "Arabic Name" })}</Label>
              <Input
                id="part-name-ar"
                value={form.partNameAr}
                onChange={(event) => patch({ partNameAr: event.target.value })}
                aria-invalid={Boolean(errors.partNameAr)}
              />
              {errors.partNameAr ? (
                <span className="text-xs text-destructive">{t(errors.partNameAr)}</span>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="part-name-en">{t({ ar: "الاسم بالإنجليزية", en: "English Name" })}</Label>
              <Input
                id="part-name-en"
                dir="ltr"
                value={form.partNameEn}
                onChange={(event) => patch({ partNameEn: event.target.value })}
                aria-invalid={Boolean(errors.partNameEn)}
              />
              {errors.partNameEn ? (
                <span className="text-xs text-destructive">{t(errors.partNameEn)}</span>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="part-number">{t({ ar: "رقم القطعة (OEM)", en: "Part Number (OEM)" })}</Label>
              <Input
                id="part-number"
                dir="ltr"
                value={form.partNumber}
                onChange={(event) => patch({ partNumber: event.target.value })}
                aria-invalid={Boolean(errors.partNumber)}
              />
              {errors.partNumber ? (
                <span className="text-xs text-destructive">{t(errors.partNumber)}</span>
              ) : null}
            </div>
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="text-xs font-bold text-primary">
              {t({ ar: "ب. التسعير والمخزون", en: "B. Pricing & Stock" })}
            </legend>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="part-price">{t({ ar: "السعر (SAR)", en: "Price (SAR)" })}</Label>
                <Input
                  id="part-price"
                  dir="ltr"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(event) => patch({ price: event.target.value })}
                  aria-invalid={Boolean(errors.price)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="part-quantity">{t({ ar: "الكمية", en: "Quantity" })}</Label>
                <Input
                  id="part-quantity"
                  dir="ltr"
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(event) => patch({ quantity: event.target.value })}
                  aria-invalid={Boolean(errors.quantity)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="part-min">{t({ ar: "حد التنبيه", en: "Low Alert" })}</Label>
                <Input
                  id="part-min"
                  dir="ltr"
                  type="number"
                  min={0}
                  value={form.minStockAlert}
                  onChange={(event) => patch({ minStockAlert: event.target.value })}
                  aria-invalid={Boolean(errors.minStockAlert)}
                />
              </div>
            </div>
            {(errors.price || errors.quantity || errors.minStockAlert) ? (
              <span className="text-xs text-destructive">
                {t(
                  [errors.price, errors.quantity, errors.minStockAlert].find(Boolean) ?? {
                    ar: "",
                    en: "",
                  },
                )}
              </span>
            ) : null}
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="text-xs font-bold text-primary">
              {t({ ar: "ج. التصنيف", en: "C. Categorization" })}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1.5">
                <Label>{t({ ar: "الفئة", en: "Category" })}</Label>
                <NativeSelect
                  value={form.categoryId}
                  onChange={(event) => patch({ categoryId: event.target.value })}
                >
                  <NativeSelectOption value="">{t({ ar: "بدون فئة", en: "None" })}</NativeSelectOption>
                  {categories.map((category) => (
                    <NativeSelectOption key={category.id} value={category.id}>
                      {t(category.name)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-1.5">
                <Label>{t({ ar: "الماركة", en: "Brand" })}</Label>
                <NativeSelect
                  value={form.brandId}
                  onChange={(event) => patch({ brandId: event.target.value })}
                >
                  <NativeSelectOption value="">{t({ ar: "بدون ماركة", en: "None" })}</NativeSelectOption>
                  {brands.map((brand) => (
                    <NativeSelectOption key={brand.id} value={brand.id}>
                      {t(brand.name)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>{t({ ar: "النوع", en: "Condition" })}</Label>
              <div className="inline-flex rounded-xl border border-border p-1" role="radiogroup">
                {CONDITIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={form.condition === option.value}
                    onClick={() => patch({ condition: option.value })}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                      form.condition === option.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {t({ ar: option.ar, en: option.en })}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="part-active">{t({ ar: "نشط", en: "Active" })}</Label>
              <Switch
                id="part-active"
                checked={form.isActive}
                onCheckedChange={(checked) => patch({ isActive: checked })}
              />
            </div>
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="text-xs font-bold text-primary">
              {t({ ar: "د. توافق المركبات", en: "D. Vehicle Compatibility" })}
            </legend>
            {form.compat.map((row, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-1.5">
                <NativeSelect
                  aria-label={t({ ar: "الماركة", en: "Make" })}
                  value={row.makeId}
                  onChange={(event) =>
                    setForm((prev) => {
                      const compat = [...prev.compat];
                      compat[index] = { ...row, makeId: event.target.value, carId: "" };
                      return { ...prev, compat };
                    })
                  }
                >
                  <NativeSelectOption value="">{t({ ar: "اختر الماركة", en: "Make" })}</NativeSelectOption>
                  {brands.map((brand) => (
                    <NativeSelectOption key={brand.id} value={brand.id}>
                      {t(brand.name)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <NativeSelect
                  aria-label={t({ ar: "الموديل", en: "Model" })}
                  value={row.carId}
                  disabled={!row.makeId}
                  onChange={(event) =>
                    setForm((prev) => {
                      const compat = [...prev.compat];
                      compat[index] = { ...row, carId: event.target.value };
                      return { ...prev, compat };
                    })
                  }
                >
                  <NativeSelectOption value="">{t({ ar: "الموديل", en: "Model" })}</NativeSelectOption>
                  {(row.makeId
                    ? cars.filter((car) => car.brandId === row.makeId)
                    : filteredCars
                  ).map((car) => (
                    <NativeSelectOption key={car.id} value={car.id}>
                      {t(car.model)} <span dir="ltr">{car.year}</span>
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <Input
                  aria-label={t({ ar: "من سنة", en: "Year from" })}
                  dir="ltr"
                  type="number"
                  min={1980}
                  max={2030}
                  className="h-9 w-16 px-1 text-center text-xs"
                  placeholder={t({ ar: "من", en: "From" })}
                  value={row.yearFrom}
                  onChange={(event) =>
                    setForm((prev) => {
                      const compat = [...prev.compat];
                      compat[index] = { ...row, yearFrom: event.target.value };
                      return { ...prev, compat };
                    })
                  }
                />
                <Input
                  aria-label={t({ ar: "إلى سنة", en: "Year to" })}
                  dir="ltr"
                  type="number"
                  min={1980}
                  max={2030}
                  className="h-9 w-16 px-1 text-center text-xs"
                  placeholder={t({ ar: "إلى", en: "To" })}
                  value={row.yearTo}
                  onChange={(event) =>
                    setForm((prev) => {
                      const compat = [...prev.compat];
                      compat[index] = { ...row, yearTo: event.target.value };
                      return { ...prev, compat };
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t({ ar: "إزالة التوافق", en: "Remove compatibility" })}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      compat: prev.compat.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  compat: [...prev.compat, { makeId: "", carId: "", yearFrom: "", yearTo: "" }],
                }))
              }
            >
              <Plus className="size-4" aria-hidden />
              {t({ ar: "إضافة توافق سيارة", en: "Add vehicle compatibility" })}
            </Button>
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="text-xs font-bold text-primary">
              {t({ ar: "ه. صورة القطعة", en: "E. Part Image" })}
            </legend>
            <div className="grid items-start gap-3">
              <label className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-6 text-sm text-muted-foreground hover:bg-muted/80 cursor-pointer">
                <Upload className="size-5" aria-hidden />
                <span>{t({ ar: "رفع صورة القطعة", en: "Upload part image" })}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  className="sr-only"
                />
              </label>
              {imageUploading && (
                <span className="text-xs text-muted-foreground">
                  {t({ ar: "جارٍ الرفع…", en: "Uploading…" })}
                </span>
              )}
              {imagePreview && (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={imagePreview}
                    alt={form.partNameEn}
                    className="w-24 h-24 rounded-lg object-cover border border-border"
                  />
                  <p className="text-[10px] text-muted-foreground truncate w-24">
                    {imagePreview}
                  </p>
                </div>
              )}
              {errors.imageUrl && (
                <span className="text-xs text-destructive">
                  {t(errors.imageUrl)}
                </span>
              )}
            </div>
          </fieldset>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t({ ar: "إلغاء", en: "Cancel" })}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? t({ ar: "جارٍ الحفظ…", en: "Saving…" })
                : item
                  ? t({ ar: "حفظ التعديلات", en: "Save Changes" })
                  : t({ ar: "إضافة القطعة", en: "Add Part" })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
