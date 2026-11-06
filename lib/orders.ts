import { getAccessToken, refreshSession } from "@/lib/auth";
import type { Bilingual, StoreOrder } from "@/lib/data";

async function storeAuthFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const doFetch = (token: string | null) => {
    const headers = new Headers(init.headers);
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return fetch(path, { ...init, headers, credentials: "include" });
  };

  let res = await doFetch(getAccessToken());
  if (res.status === 401) {
    const session = await refreshSession();
    if (session) {
      res = await doFetch(getAccessToken());
    }
  }
  return res;
}

function toBilingual(raw: unknown): Bilingual {
  if (raw && typeof raw === "object") {
    const entry = raw as Record<string, unknown>;
    return {
      ar: typeof entry.ar === "string" ? entry.ar : "",
      en: typeof entry.en === "string" ? entry.en : "",
    };
  }
  if (typeof raw === "string") return { ar: raw, en: raw };
  return { ar: "", en: "" };
}

export function parseStoreOrder(raw: unknown): StoreOrder {
  const record =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  const items = Array.isArray(record.items) ? record.items : [];
  return {
    ...record,
    id: typeof record.id === "string" ? record.id : "",
    customerName:
      typeof record.customerName === "string" && record.customerName
        ? record.customerName
        : "Customer",
    phone: typeof record.customerPhone === "string" ? record.customerPhone : "",
    city: toBilingual(record.city),
    vin: "",
    vehicle: toBilingual(record.vehicle),
    parts: items.map((rawItem) => {
      const item =
        typeof rawItem === "object" && rawItem !== null
          ? (rawItem as Record<string, unknown>)
          : {};
      return {
        name: toBilingual(item.partName),
        partNumber: typeof item.partNumber === "string" ? item.partNumber : "",
        qty: typeof item.quantity === "number" ? item.quantity : 0,
        priceSar: typeof item.unitPriceSar === "number" ? item.unitPriceSar : 0,
      };
    }),
    compatibility: "match",
    status: record.status as StoreOrder["status"],
    delivery: "courier",
    otp: typeof record.handoverOtp === "string" ? record.handoverOtp : "",
    placedAt: typeof record.createdAt === "string" ? record.createdAt : "",
    totalSar: typeof record.totalSar === "number" ? record.totalSar : 0,
  };
}

export type StoreOrdersResult = {
  orders: StoreOrder[];
  count: number;
  statusCounts: Record<string, number>;
};

export async function fetchStoreOrders(
  statusFilter?: string
): Promise<StoreOrdersResult | null> {
  const params = new URLSearchParams();
  if (statusFilter) {
    params.append("status", statusFilter);
  }
  try {
    const res = await storeAuthFetch(`/api/store/orders?${params.toString()}`);
    if (!res.ok) {
      return null;
    }
    const payload: unknown = await res.json();
    const data =
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : {};
    const statusCounts =
      typeof data.statusCounts === "object" && data.statusCounts !== null
        ? (data.statusCounts as Record<string, number>)
        : {};
    return {
      orders: (Array.isArray(data.orders) ? data.orders : []).map(parseStoreOrder),
      count: typeof data.count === "number" ? data.count : 0,
      statusCounts,
    };
  } catch {
    return null;
  }
}

export async function advanceOrderStatus(
  orderId: string,
  targetStatus: string
): Promise<{ success: boolean; order: any; error?: string }> {
  try {
    const res = await storeAuthFetch(`/api/store/orders/${orderId}/status`, {
      method: "POST",
      body: JSON.stringify({ status: targetStatus }),
      headers: { "content-type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, order: undefined, error: data.error || "Unknown error" };
    }
    return { success: true, order: data.order };
  } catch {
    return { success: false, order: undefined, error: "Network error" };
  }
}

export async function verifyOrderOtp(
  orderId: string,
  code: string
): Promise<{ success: boolean; order: any; error?: string }> {
  try {
    const res = await storeAuthFetch(`/api/store/orders/${orderId}/verify-otp`, {
      method: "POST",
      body: JSON.stringify({ otp: code }),
      headers: { "content-type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, order: undefined, error: data.error || "Unknown error" };
    }
    return { success: true, order: data.order };
  } catch {
    return { success: false, order: undefined, error: "Network error" };
  }
}
