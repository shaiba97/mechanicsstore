"use client";

import * as React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  fetchCatalog,
  type BackendBrand,
  type BackendCar,
  type BackendCategory,
  type CatalogSource,
} from "@/lib/api";
import { fetchStoreOrders } from "@/lib/orders";
import { storeSocket, type SocketStatus } from "@/lib/socket";
import { useAuth } from "@/components/providers/auth-provider";

export type SectionId =
  | "dashboard"
  | "orders"
  | "inventory"
  | "delivery"
  | "earnings"
  | "reviews"
  | "profile"
  | "settings";

const SECTION_IDS: readonly SectionId[] = [
  "dashboard",
  "orders",
  "inventory",
  "delivery",
  "earnings",
  "reviews",
  "profile",
  "settings",
];

export function parseSectionId(raw: string | null): SectionId | null {
  if (!raw) return null;
  return SECTION_IDS.includes(raw as SectionId) ? (raw as SectionId) : null;
}

type StoreStats = {
  todaySalesSar: number;
  pendingOrders: number;
  lowStock: number;
  completedWeek: number;
};

type StoreDataContextValue = {
  section: SectionId;
  setSection: (section: SectionId) => void;
  orders: any[];
  setOrders: (updater: (prev: any[]) => any[]) => void;
  inventory: any[]; // InventoryPart[] kept for compatibility; loaded live elsewhere
  brands: BackendBrand[];
  cars: BackendCar[];
  categories: BackendCategory[];
  catalogSource: CatalogSource;
  socketStatus: SocketStatus;
  alerts: number;
  stats: StoreStats;
  setOrderStatus: (orderId: string, status: string) => void;
  verifyOtp: (orderId: string, code: string) => boolean;
  updateStock: (partId: string, qty: number) => void;
};

const StoreDataContext = createContext<StoreDataContextValue | undefined>(undefined);

export function StoreDataProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: authStatus } = useAuth();
  const section = React.useMemo(
    () => parseSectionId(searchParams.get("section")) ?? "dashboard",
    [searchParams],
  );
  const [orders, setOrders] = React.useState<any[]>([]);
  const [inventory, setInventory] = React.useState<any[]>([]);
  const [brands, setBrands] = React.useState<BackendBrand[]>([]);
  const [cars, setCars] = React.useState<BackendCar[]>([]);
  const [categories, setCategories] = React.useState<BackendCategory[]>([]);
  const [catalogSource, setCatalogSource] = React.useState<CatalogSource>("loading");
  const [socketStatus, setSocketStatus] = React.useState<SocketStatus>("disconnected");
  const [alerts, setAlerts] = React.useState(0);
  const [stats, setStats] = React.useState<StoreStats>({
    todaySalesSar: 0,
    pendingOrders: 0,
    lowStock: 0,
    completedWeek: 0,
  });

  // --- Live order fetch once the auth session is ready ---
  React.useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    fetchStoreOrders()
      .then((res) => {
        if (cancelled || !res) return;
        setOrders(res.orders);
        setStats({
          todaySalesSar: res.orders.filter(
            (o) => o.status === "completed" || o.status === "otp_generated",
          ).reduce((sum, o) => sum + (o.grandTotalSar ?? o.totalSar), 0),
          pendingOrders:
            res.statusCounts["pending"] +
            res.statusCounts["store_preparing"] +
            res.statusCounts["delivery_assigned"] +
            res.statusCounts["otp_generated"],
          lowStock: 0,
          completedWeek: res.statusCounts["completed"],
        });
      })
      .catch(() => {
        // handled inside fetchStoreOrders; defensive only
      });
    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  // --- Socket connection (real WS; fall back to 30s polling if disconnected) ---
  React.useEffect(() => {
    storeSocket.start();
    const unsubscribe = storeSocket.subscribe((event) => {
      if (event.type === "order:new") {
        setOrders((prev) =>
          prev.some((order) => order.id === event.order.id) ? prev : [event.order, ...prev],
        );
        setAlerts((count) => count + 1);
        return;
      }
      if (event.type === "order:status") {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === event.orderId ? { ...order, status: event.status } : order,
          ),
        );
        return;
      }
      if (event.type === "inventory:update") {
        // inventory update handled separately; ignore for now
      }
    });
    const unsubscribeStatus = storeSocket.subscribeStatus(setSocketStatus);
    return () => {
      unsubscribe();
      unsubscribeStatus();
      storeSocket.stop();
    };
  }, []);

  // --- Polling fallback when socket is down ---
  React.useEffect(() => {
    if (socketStatus === "connected" || authStatus !== "authenticated") return;
    const poll = setInterval(() => {
      fetchStoreOrders()
        .then((res) => {
          if (!res) return;
          setOrders(res.orders);
          setStats({
            todaySalesSar: res.orders.filter(
              (o) => o.status === "completed" || o.status === "otp_generated",
            ).reduce((sum, o) => sum + (o.grandTotalSar ?? o.totalSar), 0),
            pendingOrders:
              res.statusCounts["pending"] +
              res.statusCounts["store_preparing"] +
              res.statusCounts["delivery_assigned"] +
              res.statusCounts["otp_generated"],
            lowStock: 0,
            completedWeek: res.statusCounts["completed"],
          });
        })
        .catch(() => {
          // handled inside fetchStoreOrders; defensive only
        });
    }, 30_000);
    return () => clearInterval(poll);
  }, [socketStatus, authStatus]);

  React.useEffect(() => {
    let cancelled = false;
    const loadCatalog = (attempt: number) => {
      fetchCatalog()
        .then(({ brands: brandRows, cars: carRows, categories: categoryRows, source }) => {
          if (cancelled) return;
          setBrands(brandRows);
          setCars(carRows);
          setCategories(categoryRows);
          setCatalogSource(source);
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt < 3) {
            setTimeout(() => {
              if (!cancelled) loadCatalog(attempt + 1);
            }, attempt * 2000);
            return;
          }
          console.warn("Catalog unavailable; catalog-dependent views will be empty");
        });
    };
    loadCatalog(0);
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSectionChange = React.useCallback((next: SectionId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    if (next === "orders" || next === "delivery") {
      setAlerts(0);
    }
  }, [pathname, router, searchParams]);

  const setOrderStatus = React.useCallback((orderId: string, status: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );
  }, []);

  const verifyOtp = React.useCallback((orderId: string, code: string): boolean => {
    return /^\d{4}$/.test(code);
  }, []);

  const updateStock = React.useCallback((partId: string, qty: number) => {
    // no-op: stock managed on backend
  }, []);

  return (
    <StoreDataContext.Provider
      value={{
        section,
        setSection: handleSectionChange,
        orders,
        setOrders,
        inventory,
        brands,
        cars,
        categories,
        catalogSource,
        socketStatus,
        alerts,
        stats,
        setOrderStatus,
        verifyOtp,
        updateStock,
      }}
    >
      {children}
    </StoreDataContext.Provider>
  );
}

export function useStoreData(): StoreDataContextValue {
  const context = useContext(StoreDataContext);
  if (!context) {
    throw new Error("useStoreData must be used within a StoreDataProvider");
  }
  return context;
}