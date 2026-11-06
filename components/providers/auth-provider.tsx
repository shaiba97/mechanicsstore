"use client";

import * as React from "react";
import {
  clearSession,
  getAccessToken,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  restoreSession,
  storeSession,
  type AuthUser,
  type MappedError,
  type RegisterPayload,
} from "@/lib/auth";
import { storeSocket } from "@/lib/socket";

type AuthStatus = "loading" | "authenticated" | "guest";

type LoginResult =
  | { ok: true }
  | { ok: false; status: number; error: MappedError };

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<LoginResult>;
  register: (payload: RegisterPayload) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [status, setStatus] = React.useState<AuthStatus>("loading");

  React.useEffect(() => {
    let cancelled = false;
    restoreSession().then((session) => {
      if (cancelled) return;
      if (session) {
        setUser(session.user);
        setStatus("authenticated");
        storeSocket.start();
        return;
      }
      clearSession();
      setStatus("guest");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = React.useCallback(
    async (email: string, password: string, remember: boolean): Promise<LoginResult> => {
      const result = await loginRequest(email, password, remember);
      if (result.ok) {
        storeSession(result.data, result.remember);
        setUser(result.data.user);
        setStatus("authenticated");
        storeSocket.start();
      }
      return result;
    },
    [],
  );

  const handleRegister = React.useCallback(async (payload: RegisterPayload): Promise<LoginResult> => {
    const result = await registerRequest(payload);
    if (result.ok) {
      storeSession(result.data, true);
      setUser(result.data.user);
      setStatus("authenticated");
      storeSocket.start();
    }
    return result;
  }, []);

  const handleLogout = React.useCallback(async () => {
    storeSocket.stop();
    await logoutRequest();
    setUser(null);
    setStatus("guest");
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: Boolean(user) && getAccessToken() !== null,
      isLoading: status === "loading",
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
    }),
    [user, status, handleLogin, handleRegister, handleLogout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return context;
}
