"use client";

import * as React from "react";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { cn } from "cn";
import { InventoryTable } from "@/components/inventory-table";
import { PartFormModal } from "@/components/part-form-modal";
import { Panel, PanelHeader } from "@/components/panel";
import { useStoreData } from "@/components/store-data-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/hooks/use-locale";
import type { InventoryItem, InventoryItemInput } from "@/lib/inventory";
import {
  bulkStock,
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryItems,
  updateInventoryItem,
} from "@/lib/inventory";
import { storeSocket } from "@/lib/socket";

type LoadStatus = "loading" | "ready" | "error";

const EMPTY_ITEMS: InventoryItem[] = [];

export function InventoryView() {
  const { brands, cars, categories } = useStoreData();
  const { t, dir } = useLocale();

  const [items, setItems] = React.useState<InventoryItem[]>(EMPTY_ITEMS);
  const [status, setStatus] = React.useState<LoadStatus>("loading");
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [stockFilter, setStockFilter] = React.useState("all");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setStatus("loading");
    const result = await fetchInventoryItems();
    if (result.ok) {
      setItems(result.data);
      setStatus("ready");
      return;
    }
    setStatus("error");
    toast.add({
      title: t(result.failure.error),
      description: result.failure.detail || undefined,
      type: "error",
    });
  }, [t]);

  React.useEffect(() => {
    let cancelled = false;
    fetchInventoryItems().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setItems(result.data);
        setStatus("ready");
        return;
      }
      setStatus("error");
      toast.add({
        title: t(result.failure.error),
        description: result.failure.detail || undefined,
        type: "error",
      });
    }).catch(() => {
      if (cancelled) return;
      setStatus("error");
    });
    return () => {
      cancelled = true;
    };
  }, [t]);

  React.useEffect(() => {
    const unsubscribe = storeSocket.subscribe((event) => {
      if (event.type !== "inventory:update") return;
      setItems((prev) =>
        prev.map((item) =>
          item.id === event.partId ? { ...item, quantity: event.qty } : item,
        ),
      );
    });
    return unsubscribe;
  }, []);

  const showToastFailure = React.useCallback(
    (failure: { error: { ar: string; en: string }; detail: string }) => {
      toast.add({
        title: t(failure.error),
        description: failure.detail || undefined,
        type: "error",
      });
    },
    [t],
  );

  const handleStockChange = React.useCallback(
    async (item: InventoryItem, quantity: number) => {
      const previous = item.quantity;
      setBusyId(item.id);
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, quantity } : row)),
      );
      const result = await bulkStock([{ id: item.id, quantity }]);
      if (!result.ok) {
        setItems((prev) =>
          prev.map((row) => (row.id === item.id ? { ...row, quantity: previous } : row)),
        );
        showToastFailure(result.failure);
        setBusyId(null);
        return;
      }
      const updated = result.data.find((row) => row.id === item.id);
      if (updated) {
        setItems((prev) => prev.map((row) => (row.id === item.id ? updated : row)));
      }
      setBusyId(null);
    },
    [showToastFailure],
  );

  const handleToggleActive = React.useCallback(
    async (item: InventoryItem, next: boolean) => {
      const previous = item.isActive;
      setBusyId(item.id);
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, isActive: next } : row)),
      );
      const result = await updateInventoryItem(item.id, { isActive: next });
      if (!result.ok) {
        setItems((prev) =>
          prev.map((row) => (row.id === item.id ? { ...row, isActive: previous } : row)),
        );
        showToastFailure(result.failure);
        setBusyId(null);
        return;
      }
      setItems((prev) => prev.map((row) => (row.id === item.id ? result.data : row)));
      setBusyId(null);
      toast.add({
        title: t(
          next
            ? { ar: "تم تفعيل القطعة", en: "Part activated" }
            : { ar: "تم تعطيل القطعة", en: "Part deactivated" },
        ),
        type: "success",
      });
    },
    [showToastFailure, t],
  );

  const handleFormSubmit = React.useCallback(
    async (input: InventoryItemInput): Promise<boolean> => {
      if (editingItem) {
        const result = await updateInventoryItem(editingItem.id, input);
        if (!result.ok) {
          showToastFailure(result.failure);
          return false;
        }
        setItems((prev) => prev.map((row) => (row.id === editingItem.id ? result.data : row)));
        toast.add({
          title: t({ ar: "تم حفظ التعديلات", en: "Changes saved" }),
          type: "success",
        });
        setEditingItem(null);
        return true;
      }
      const result = await createInventoryItem(input);
      if (!result.ok) {
        showToastFailure(result.failure);
        return false;
      }
      setItems((prev) => [result.data, ...prev]);
      toast.add({
        title: t({ ar: "تمت إضافة القطعة", en: "Part created" }),
        type: "success",
      });
      return true;
    },
    [editingItem, showToastFailure, t],
  );

  const handleDelete = React.useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteInventoryItem(deleteTarget.id);
    setDeleting(false);
    if (!result.ok) {
      showToastFailure(result.failure);
      setDeleteTarget(null);
      return;
    }
    setItems((prev) => prev.filter((row) => row.id !== deleteTarget.id));
    toast.add({
      title: t({ ar: "تم حذف القطعة", en: "Part deleted" }),
      type: "success",
    });
    setDeleteTarget(null);
  }, [deleteTarget, showToastFailure, t]);

  const filteredItems = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter && item.categoryId !== categoryFilter) return false;
      if (stockFilter === "low" && item.quantity > item.minStockAlert) return false;
      if (stockFilter === "out" && item.quantity !== 0) return false;
      if (!query) return true;
      return (
        item.partNumber.toLowerCase().includes(query) ||
        item.partNameAr.toLowerCase().includes(query) ||
        item.partNameEn.toLowerCase().includes(query)
      );
    });
  }, [items, search, categoryFilter, stockFilter]);

  const lowCount = items.filter((item) => item.quantity <= item.minStockAlert).length;

  return (
    <Panel>
      <PanelHeader
        title={t({ ar: "مخزون القطع", en: "Parts Inventory" })}
        hint={t({
          ar: "إدارة الأجزاء والأسعار والتنبيهات وحالة التوفر",
          en: "Manage parts, pricing, alerts, and availability",
        })}
        action={
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold",
              lowCount > 0
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            <span dir="ltr">
              {items.length} {t({ ar: "قطعة", en: "parts" })} · {lowCount}{" "}
              {t({ ar: "منخفض", en: "low" })}
            </span>
          </span>
        }
      />
      <div className="grid gap-4 p-4">
        <div
          className="flex flex-wrap items-end gap-2"
          dir={dir}
        >
          <div className="grid w-full max-w-xs gap-1.5">
            <Label htmlFor="inventory-search">{t({ ar: "بحث", en: "Search" })}</Label>
            <Input
              id="inventory-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t({ ar: "اسم القطعة أو رقم OEM…", en: "Part name or OEM number…" })}
            />
          </div>
          <div className="grid w-44 gap-1.5">
            <Label htmlFor="inventory-category">{t({ ar: "الفئة", en: "Category" })}</Label>
            <NativeSelect
              id="inventory-category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <NativeSelectOption value="">{t({ ar: "كل الفئات", en: "All categories" })}</NativeSelectOption>
              {categories.map((category) => (
                <NativeSelectOption key={category.id} value={category.id}>
                  {t(category.name)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid w-40 gap-1.5">
            <Label htmlFor="inventory-stock">{t({ ar: "حالة المخزون", en: "Stock" })}</Label>
            <NativeSelect
              id="inventory-stock"
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
            >
              <NativeSelectOption value="all">{t({ ar: "الكل", en: "All" })}</NativeSelectOption>
              <NativeSelectOption value="low">{t({ ar: "منخفض", en: "Low stock" })}</NativeSelectOption>
              <NativeSelectOption value="out">{t({ ar: "نفد", en: "Out of stock" })}</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t({ ar: "تحديث القائمة", en: "Refresh list" })}
              onClick={() => void load()}
            >
              <RefreshCw className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setModalOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden />
              {t({ ar: "إضافة قطعة جديدة", en: "Add New Part" })}
            </Button>
          </div>
        </div>

        {status === "loading" ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            <span className="text-sm">{t({ ar: "جارٍ تحميل المخزون…", en: "Loading inventory…" })}</span>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <span className="text-sm font-bold text-destructive">
              {t({ ar: "تعذر تحميل المخزون", en: "Failed to load inventory" })}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="size-4" aria-hidden />
              {t({ ar: "إعادة المحاولة", en: "Retry" })}
            </Button>
          </div>
        ) : null}

        {status === "ready" && filteredItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <span className="text-sm font-bold text-foreground">
              {t({ ar: "لا توجد قطع", en: "No parts found" })}
            </span>
            <span className="text-xs text-muted-foreground">
              {t({
                ar: "أضف قطعتك الأولى أو عدّل عوامل التصفية.",
                en: "Add your first part or adjust the filters.",
              })}
            </span>
          </div>
        ) : null}

        {status === "ready" && filteredItems.length > 0 ? (
          <InventoryTable
            items={filteredItems}
            busyId={busyId}
            onStockChange={(item, quantity) => void handleStockChange(item, quantity)}
            onToggleActive={(item, next) => void handleToggleActive(item, next)}
            onEdit={(item) => {
              setEditingItem(item);
              setModalOpen(true);
            }}
            onDeleteTrigger={setDeleteTarget}
          />
        ) : null}
      </div>

      <PartFormModal
        key={editingItem?.id ?? "new"}
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={editingItem}
        brands={brands}
        cars={cars}
        categories={categories}
        onSubmit={handleFormSubmit}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t({ ar: "حذف القطعة؟", en: "Delete this part?" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t({
                ar: `سيتم حذف "${deleteTarget?.partNameAr ?? ""}" (${deleteTarget?.partNumber ?? ""}) نهائيًا. لا يمكن التراجع عن هذا الإجراء.`,
                en: `"${deleteTarget?.partNameEn ?? ""}" (${deleteTarget?.partNumber ?? ""}) will be deleted permanently. This action cannot be undone.`,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t({ ar: "إلغاء", en: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleting
                ? t({ ar: "جارٍ الحذف…", en: "Deleting…" })
                : t({ ar: "حذف", en: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}
