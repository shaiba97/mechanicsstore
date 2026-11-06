"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { DashboardView } from "@/components/dashboard-view";
import { DeliveryView } from "@/components/delivery-view";
import { InventoryView } from "@/components/inventory-view";
import { OrdersView } from "@/components/orders-view";
import { PayoutSettingsView } from "@/components/settings/payout-settings-view";
import { ProfileView } from "@/components/profile-view";
import { ReviewsView } from "@/components/reviews-view";
import { SalesView } from "@/components/sales-view";
import { useAuth } from "@/components/providers/auth-provider";
import {
  StoreDataProvider,
  useStoreData,
  type SectionId,
} from "@/components/store-data-provider";
import { MobileNav, StoreSidebar } from "@/components/store-sidebar";
import { clearSession } from "@/lib/auth";

const VIEWS: Record<SectionId, React.ComponentType> = {
  dashboard: DashboardView,
  orders: OrdersView,
  inventory: InventoryView,
  delivery: DeliveryView,
  earnings: SalesView,
  reviews: ReviewsView,
  profile: ProfileView,
  settings: PayoutSettingsView,
};

function ShellInner() {
  const { section } = useStoreData();
  const { user, status } = useAuth();
  const router = useRouter();
  const View = VIEWS[section];

  React.useEffect(() => {
    if (status === "guest") {
      clearSession();
      router.replace("/auth/login");
    }
  }, [status, router]);

  if (status !== "authenticated" || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <StoreSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <MobileNav />
        <main className="flex-1 p-4 md:p-6">
          <View />
        </main>
      </div>
    </div>
  );
}

export function StoreShell() {
  return (
    <React.Suspense fallback={null}>
      <StoreDataProvider>
        <ShellInner />
      </StoreDataProvider>
    </React.Suspense>
  );
}
