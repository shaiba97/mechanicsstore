import { getAccessToken, refreshSession } from "@/lib/auth";
import type { Bilingual } from "@/lib/i18n";

export type InventoryCondition =
  | "OEM_ORIGINAL"
  | "AFTERMARKET_COMMERCIAL"
  | "USED";

export type CompatibilityEntry = {
  make: Bilingual;
  model: Bilingual;
  yearFrom: number;
  yearTo: number;
};

export type InventoryItem = {
  id: string;
  storeId: string | null;
  partNameAr: string;
  partNameEn: string;
  partNumber: string;
  categoryId: string | null;
  categoryName: Bilingual | null;
  brandId: string | null;
  brandName: Bilingual | null;
  model: string;
  yearFrom: number;
  yearTo: number;
  condition: InventoryCondition;
  price: number;
  quantity: number;
  minStockAlert: number;
  compatibilityVins: Array<string | CompatibilityEntry>;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InventoryItemInput = {
  partNameAr: string;
  partNameEn: string;
  partNumber: string;
  categoryId: string | null;
  brandId: string | null;
  model: string;
  yearFrom: number;
  yearTo: number;
  condition: InventoryCondition;
  price: number;
  quantity: number;
  minStockAlert: number;
  compatibilityVins: Array<string | CompatibilityEntry>;
  imageUrl: string;
  isActive: boolean;
};

export type InventoryError = { status: number; error: Bilingual; detail: string };

export type InventoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; failure: InventoryError };

function genericError(status: number, detail: string): InventoryError {
  const messages: Record<number, Bilingual> = {
    400: { ar: "تأكد من صحة الحقول المدخلة.", en: "Please check the form fields." },
    401: { ar: "انتهت صلاحية الجلسة، أعد تسجيل الدخول.", en: "Session expired, please sign in again." },
    403: { ar: "ليس لديك صلاحية لهذا الإجراء.", en: "You do not have permission for this action." },
    404: { ar: "القطعة غير موجودة.", en: "The part was not found." },
    409: { ar: "رقم القطعة مستخدم بالفعل.", en: "This part number is already in use." },
  };
  return {
    status,
    error: messages[status] ?? {
      ar: "تعذر إكمال العملية، حاول مرة أخرى.",
      en: "Could not complete the action, please try again.",
    },
    detail,
  };
}

function parseErrorDetail(raw: unknown): string {
  if (typeof raw !== "object" || raw === null) return "";
  const record = raw as Record<string, unknown>;
  const error = record.error as Record<string, unknown> | undefined;
  if (error) {
    if (typeof error.message === "string") return error.message;
    const details = error.details;
    if (details && typeof details === "object") {
      const first = Object.values(details as Record<string, unknown>)[0];
      if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    }
  }
  if (typeof record.detail === "string") return record.detail;
  return "";
}

function mapStatus(status: number, detail: string): InventoryError {
  if (status === 400 && /part number/i.test(detail)) {
    return {
      status,
      error: { ar: "رقم القطعة مستخدم بالفعل في هذا المتجر.", en: "This part number is already used in your store." },
      detail,
    };
  }
  return genericError(status, detail);
}

function parseBilingual(raw: unknown): Bilingual | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.ar !== "string" || !record.ar) return null;
  if (typeof record.en !== "string" || !record.en) return null;
  return { ar: record.ar, en: record.en };
}

function parseCompatibility(raw: unknown): Array<string | CompatibilityEntry> {
  if (!Array.isArray(raw)) return [];
  const entries: Array<string | CompatibilityEntry> = [];
  for (const entry of raw) {
    if (typeof entry === "string" && entry.trim()) {
      entries.push(entry);
      continue;
    }
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;
    const make = parseBilingual(record.make);
    const model = parseBilingual(record.model);
    const yearFrom = Number(record.yearFrom);
    const yearTo = Number(record.yearTo);
    if (make && model && Number.isFinite(yearFrom) && Number.isFinite(yearTo)) {
      entries.push({ make, model, yearFrom, yearTo });
    }
  }
  return entries;
}

export function parseInventoryItem(raw: unknown): InventoryItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.id !== "string" || !record.id) return null;
  if (typeof record.partNumber !== "string") return null;
  if (typeof record.price !== "number" || typeof record.quantity !== "number") return null;
  const condition = record.condition;
  if (condition !== "OEM_ORIGINAL" && condition !== "AFTERMARKET_COMMERCIAL" && condition !== "USED") {
    return null;
  }
  return {
    id: record.id,
    storeId: typeof record.storeId === "string" ? record.storeId : null,
    partNameAr: typeof record.partNameAr === "string" ? record.partNameAr : "",
    partNameEn: typeof record.partNameEn === "string" ? record.partNameEn : "",
    partNumber: record.partNumber,
    categoryId: typeof record.categoryId === "string" ? record.categoryId : null,
    categoryName: parseBilingual(record.categoryName),
    brandId: typeof record.brandId === "string" ? record.brandId : null,
    brandName: parseBilingual(record.brandName),
    model: typeof record.model === "string" ? record.model : "",
    yearFrom: typeof record.yearFrom === "number" ? record.yearFrom : 0,
    yearTo: typeof record.yearTo === "number" ? record.yearTo : 0,
    condition,
    price: record.price,
    quantity: record.quantity,
    minStockAlert: typeof record.minStockAlert === "number" ? record.minStockAlert : 2,
    compatibilityVins: parseCompatibility(record.compatibilityVins),
    imageUrl: typeof record.imageUrl === "string" ? record.imageUrl : "",
    isActive: typeof record.isActive === "boolean" ? record.isActive : true,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : "",
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
  };
}

type RequestResult = { status: number; payload: unknown };

async function authorizedRequest(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<RequestResult | null> {
  const send = async (token: string | null): Promise<Response> => {
    const headers = new Headers({ accept: "application/json" });
    if (body !== undefined) headers.set("content-type", "application/json");
    if (token) headers.set("authorization", `Bearer ${token}`);
    return fetch(`/api/inventory/${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  };

  let response = await send(getAccessToken());
  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await send(getAccessToken());
    }
  }
  if (response.status === 204) return { status: 204, payload: null };
  try {
    const payload = (await response.json()) as unknown;
    return { status: response.status, payload };
  } catch {
    return null;
  }
}

function itemRows(payload: unknown): InventoryItem[] {
  if (typeof payload === "object" && payload !== null) {
    const results = (payload as Record<string, unknown>).results;
    if (Array.isArray(results)) {
      return results
        .map(parseInventoryItem)
        .filter((row): row is InventoryItem => row !== null);
    }
  }
  return [];
}

function itemFromPayload(payload: unknown): InventoryItem | null {
  return parseInventoryItem(payload);
}

export async function fetchInventoryItems(): Promise<InventoryResult<InventoryItem[]>> {
  const result = await authorizedRequest("inventory", "GET");
  if (!result || result.status >= 400) {
    const status = result?.status ?? 502;
    return {
      ok: false,
      failure: mapStatus(status, parseErrorDetail(result?.payload) || (result ? "" : "Network unreachable.")),
    };
  }
  return { ok: true, data: itemRows(result.payload) };
}

export async function createInventoryItem(
  input: InventoryItemInput,
): Promise<InventoryResult<InventoryItem>> {
  const result = await authorizedRequest("inventory", "POST", input);
  if (!result || result.status >= 400) {
    const status = result?.status ?? 502;
    return {
      ok: false,
      failure: mapStatus(status, parseErrorDetail(result?.payload) || ""),
    };
  }
  const item = itemFromPayload(result.payload);
  if (!item) {
    return { ok: false, failure: genericError(502, "Unexpected payload.") };
  }
  return { ok: true, data: item };
}

export async function updateInventoryItem(
  id: string,
  patch: Partial<InventoryItemInput>,
): Promise<InventoryResult<InventoryItem>> {
  const result = await authorizedRequest(`inventory/${id}`, "PATCH", patch);
  if (!result || result.status >= 400) {
    const status = result?.status ?? 502;
    return {
      ok: false,
      failure: mapStatus(status, parseErrorDetail(result?.payload) || ""),
    };
  }
  const item = itemFromPayload(result.payload);
  if (!item) {
    return { ok: false, failure: genericError(502, "Unexpected payload.") };
  }
  return { ok: true, data: item };
}

export async function deleteInventoryItem(
  id: string,
): Promise<InventoryResult<null>> {
  const result = await authorizedRequest(`inventory/${id}`, "DELETE");
  if (!result || result.status !== 204) {
    const status = result?.status ?? 502;
    return {
      ok: false,
      failure: mapStatus(status, parseErrorDetail(result?.payload) || ""),
    };
  }
  return { ok: true, data: null };
}

export async function bulkStock(
  items: Array<{ id: string; quantity: number }>,
): Promise<InventoryResult<InventoryItem[]>> {
  const result = await authorizedRequest("inventory/bulk-stock", "PATCH", { items });
  if (!result || result.status >= 400) {
    const status = result?.status ?? 502;
    return {
      ok: false,
      failure: mapStatus(status, parseErrorDetail(result?.payload) || ""),
    };
  }
  if (typeof result.payload === "object" && result.payload !== null) {
    const updated = (result.payload as Record<string, unknown>).updated;
    if (Array.isArray(updated)) {
      return {
        ok: true,
        data: updated
          .map(parseInventoryItem)
          .filter((row): row is InventoryItem => row !== null),
      };
    }
  }
  return { ok: false, failure: genericError(502, "Unexpected payload.") };
}
