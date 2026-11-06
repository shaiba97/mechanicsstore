"use client";

import * as React from "react";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/toast";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LocaleProvider, useLocale } from "@/hooks/use-locale";

function DirectionBridge({ children }: { children: React.ReactNode }) {
  const { dir } = useLocale();
  return <DirectionProvider direction={dir}>{children}</DirectionProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <DirectionBridge>
          <Toaster>{children}</Toaster>
        </DirectionBridge>
      </AuthProvider>
    </LocaleProvider>
  );
}
