import { getAccessToken, refreshSession } from "@/lib/auth";
import type { Bilingual } from "@/lib/i18n";

export type DataSource = "backend" | "mock";
export type CatalogSource = DataSource | "loading";

export type BackendBrand = {
  id: string;
  code: string;
  name: Bilingual;
  logoUrl: string;
  active: boolean;
};

export type BackendCar = {
  id: string;
  model: Bilingual;
  year: number;
  brandId: string;
  active: boolean;
};

export type BackendCategory = {
  id: string;
  name: Bilingual;
  active: boolean;
};

type Collection<T> = { rows: T[]; source: DataSource };

type CollectionResponse<T> = { count?: number; results?: unknown } | T[];

function parseBilingual(raw: unknown): Bilingual | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.ar !== "string" || !record.ar.trim()) return null;
  if (typeof record.en !== "string" || !record.en.trim()) return null;
  return { ar: record.ar, en: record.en };
}

function parseRows(payload: CollectionResponse<unknown>): unknown[] | null {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.results)) return payload.results;
  return null;
}

function parseBrand(raw: unknown): BackendBrand | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const name = parseBilingual(record.name);
  if (typeof record.id !== "string" || !name) return null;
  if (typeof record.code !== "string" || !record.code) return null;
  return {
    id: record.id,
    code: record.code,
    name,
    logoUrl: typeof record.logoUrl === "string" ? record.logoUrl : "",
    active: typeof record.active === "boolean" ? record.active : true,
  };
}

function parseCar(raw: unknown): BackendCar | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const model = parseBilingual(record.model);
  if (typeof record.id !== "string" || !model) return null;
  if (typeof record.brandId !== "string" || !record.brandId) return null;
  if (typeof record.year !== "number") return null;
  return {
    id: record.id,
    model,
    year: record.year,
    brandId: record.brandId,
    active: typeof record.active === "boolean" ? record.active : true,
  };
}

function parseCategory(raw: unknown): BackendCategory | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const name = parseBilingual(record.name);
  if (typeof record.id !== "string" || !name) return null;
  return {
    id: record.id,
    name,
    active: typeof record.active === "boolean" ? record.active : true,
  };
}

async function fetchCollection<T>(
  resource: "brands" | "cars" | "categories",
  parse: (raw: unknown) => T | null,
): Promise<Collection<T>> {
  try {
    const response = await fetch(`/api/backend/${resource}?pageSize=500`);
    if (!response.ok) {
      throw new Error(`catalog request failed: ${response.status}`);
    }
    const payload = (await response.json()) as CollectionResponse<unknown>;
    const rows = parseRows(payload);
    if (!rows) {
      throw new Error("unexpected catalog payload");
    }
    const parsed = rows
      .map(parse)
      .filter((row): row is T => row !== null);
    if (rows.length > 0 && parsed.length === 0) {
      throw new Error("catalog schema mismatch");
    }
    return { rows: parsed, source: "backend" };
  } catch (error) {
    throw error;
  }
}

export async function fetchCatalog(): Promise<{
  brands: BackendBrand[];
  cars: BackendCar[];
  categories: BackendCategory[];
  source: DataSource;
}> {
  const [brands, cars, categories] = await Promise.all([
    fetchCollection("brands", parseBrand),
    fetchCollection("cars", parseCar),
    fetchCollection("categories", parseCategory),
  ]);
  return { brands: brands.rows, cars: cars.rows, categories: categories.rows, source: "backend" };
}

export type StorePayout = {
  id: string;
  dateLabel: string;
  amountSar: number;
  status: "pending" | "paid";
};

export type StoreProfile = {
  name: { ar: string; en: string };
  commissionRate: number;
  iban: string;
  crNumber: string;
  vatNumber: string;
  city: { ar: string; en: string };
  phone: string;
  email: string;
  address: { ar: string; en: string };
  bank: string;
};

export type WeeklySalesEntry = {
  day: string;
  sar: number;
};

export type WeeklySalesResult = {
  weeklySales: WeeklySalesEntry[];
  commissionRate: number;
};

export type FinancialPeriod = "day" | "week" | "month" | "quarter" | "half" | "year";

export type FinancialRollup = {
  label: string;
  start: string;
  end: string;
  netPayoutSar: number;
  vatCollectedSar: number;
  escrowHeldSar: number;
};

export type FinancialAccrual = {
  cashCollectedSar: number;
  creditSalesSar: number;
  deferredRevenueSar: number;
  earnedRevenueSar: number;
  creditOrdersCount: number;
  deferredOrdersCount: number;
};

export type FinancialSummary = {
  period: FinancialPeriod;
  rangeStart: string;
  rangeEnd: string;
  grossSalesSar: number;
  commissionSar: number;
  netPayoutSar: number;
  vatCollectedSar: number;
  escrowHeldSar: number;
  orderCount: number;
  completedCount: number;
  accrual: FinancialAccrual;
  rollup?: FinancialRollup[];
};

export type FlashReport = {
  date: string;
  cashMadaInflowSar: number;
  ordersFulfilled: number;
  pendingDispatches: number;
  inventoryAlerts: number;
};

export type DeliveryFee = {
  city: string;
  feeSar: number;
};

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const send = (token: string | null) =>
    fetch(`/api/store/${path}`, {
      credentials: "include",
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
  let res = await send(getAccessToken());
  if (res.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await send(getAccessToken());
    }
  }
  if (!res.ok) throw new Error(`store API request failed: ${res.status}`);
  return res.json();
}

export async function fetchStorePayouts(): Promise<StorePayout[]> {
  const payload = await fetchJson<
    | {
        id: string;
        status: "held" | "paid";
        storePayoutAmount?: number;
        payoutDueAt?: string | null;
        paidAt?: string | null;
        createdAt?: string;
      }[]
    | { results?: {
        id: string;
        status: string;
        storePayoutAmount?: number;
        payoutDueAt?: string | null;
        paidAt?: string | null;
        createdAt?: string;
      }[] }
  >("payouts");
  const rows = Array.isArray(payload) ? payload : payload?.results ?? [];
  return rows.map((entry) => ({
    id: entry.id,
    dateLabel:
      entry.status === "paid" && entry.paidAt
        ? entry.paidAt
        : (entry.payoutDueAt ?? entry.createdAt ?? ""),
    amountSar: typeof entry.storePayoutAmount === "number" ? entry.storePayoutAmount : 0,
    status: entry.status === "paid" ? "paid" : "pending",
  }));
}

export type LedgerStatus =
  | "held"
  | "ready_for_payout"
  | "processing"
  | "paid"
  | "failed";

export type LedgerRow = {
  id: string;
  orderId: string;
  orderReference: string;
  totalAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  storePayoutAmount: number;
  status: LedgerStatus;
  payoutStatus: LedgerStatus;
  payoutDueAt: string | null;
  paidAt: string | null;
  gatewayTransactionId: string;
  createdAt: string;
};

export type LedgerBucket = {
  count: number;
  amountSar: number;
};

export type LedgerSummary = {
  ledger: {
    held: LedgerBucket;
    readyForPayout: LedgerBucket;
    processing: LedgerBucket;
    paid: LedgerBucket;
    failed: LedgerBucket;
  };
};

export async function fetchStoreLedger(
  status?: LedgerStatus,
): Promise<{ rows: LedgerRow[]; summary: LedgerSummary }> {
  const payload = await fetchJson<{
    results?: unknown[];
    summary?: unknown;
  }>(
    status
      ? `payouts?status=${encodeURIComponent(status)}`
      : "payouts",
  );
  const rows: LedgerRow[] = Array.isArray(payload.results)
    ? payload.results.filter(isLedgerRow)
    : [];
  const summary = parseLedgerSummary(payload.summary);
  return { rows, summary };
}

function isLedgerRow(raw: unknown): raw is LedgerRow {
  if (typeof raw !== "object" || raw === null) return false;
  const record = raw as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.status === "string" &&
    (record.storePayoutAmount === undefined ||
      typeof record.storePayoutAmount === "number")
  );
}

function parseLedgerSummary(raw: unknown): LedgerSummary {
  const fallback: LedgerBucket = { count: 0, amountSar: 0 };
  const empty: LedgerSummary = {
    ledger: {
      held: fallback,
      readyForPayout: fallback,
      processing: fallback,
      paid: fallback,
      failed: fallback,
    },
  };
  if (typeof raw !== "object" || raw === null) return empty;
  const ledger = (raw as { ledger?: unknown }).ledger;
  if (typeof ledger !== "object" || ledger === null) return empty;
  const parseBucket = (value: unknown): LedgerBucket =>
    typeof value === "object" && value !== null
      ? {
          count: typeof (value as { count?: unknown }).count === "number" ? (value as { count: number }).count : 0,
          amountSar:
            typeof (value as { amountSar?: unknown }).amountSar === "number"
              ? (value as { amountSar: number }).amountSar
              : 0,
        }
      : { count: 0, amountSar: 0 };
  const buckets = ledger as Record<string, unknown>;
  const summary: LedgerSummary = {
    ledger: {
      held: parseBucket(buckets.held),
      readyForPayout: parseBucket(buckets.readyForPayout),
      processing: parseBucket(buckets.processing),
      paid: parseBucket(buckets.paid),
      failed: parseBucket(buckets.failed),
    },
  };
  return summary;
}

export async function fetchStoreProfile(): Promise<StoreProfile> {
  return fetchJson<StoreProfile>("profile");
}

export async function fetchStoreWeeklySales(): Promise<WeeklySalesResult> {
  const payload = await fetchJson<{
    daily?: Array<{ date?: string; revenueSar?: number }>;
    commissionRate?: number;
  }>("earnings");
  if (!Array.isArray(payload.daily)) return { weeklySales: [], commissionRate: 0 };
  const weeklySales: WeeklySalesEntry[] = payload.daily.map((entry) => ({
    day: typeof entry.date === "string" ? entry.date : "",
    sar: typeof entry.revenueSar === "number" ? entry.revenueSar : 0,
  }));
  const commissionRate =
    typeof payload.commissionRate === "number" ? payload.commissionRate : 0;
  return { weeklySales, commissionRate };
}

export async function fetchDeliveryFees(): Promise<DeliveryFee[]> {
  const payload = await fetchJson<
    | { cities?: Array<Record<string, unknown>> }
    | DeliveryFee[]
  >("delivery-fees");
  const cities: Array<Record<string, unknown>> = Array.isArray(payload) ? payload : payload?.cities ?? [];
  const fees: DeliveryFee[] = [];
  for (const entry of cities) {
    const city =
      typeof entry.city === "string"
        ? entry.city
        : typeof entry.slug === "string"
          ? entry.slug
          : typeof entry.name === "string"
            ? entry.name
            : "";
    const fee = Number(entry.fee ?? entry.feeSar ?? entry.defaultFee ?? 0);
    fees.push({ city, feeSar: Number.isFinite(fee) ? fee : 0 });
  }
  return fees;
}

export async function updateDeliveryFee(
  city: string,
  feeSar: number,
): Promise<void> {
  await fetchJson("delivery-fees", {
    method: "PUT",
    body: JSON.stringify({ city, feeSar }),
  });
}

export async function uploadInventoryImage(
  file: File,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`/api/inventory/images`, {
    credentials: "include",
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`image upload failed: ${res.status}`);
  return res.json();
}

async function financialFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return fetchJson<T>(`financials/${path}`, init);
}

export async function fetchFinancialsSummary(
  period: FinancialPeriod,
): Promise<FinancialSummary> {
  return financialFetch<FinancialSummary>(`summary?period=${period}`);
}

export async function fetchFlashReport(): Promise<FlashReport> {
  return financialFetch<FlashReport>("flash-report");
}
