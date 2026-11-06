export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  storeId: string | null;
  authProvider: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  storeName: string;
  crNumber: string;
  accepted_terms: boolean;
  terms_version: string;
};

const REFRESH_TOKEN_KEY = "store.refreshToken";
const SESSION_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

function persistRefreshToken(token: string, remember: boolean): void {
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(REFRESH_TOKEN_KEY, token);
}

function readRestoreToken(): { token: string; remember: boolean } | null {
  if (typeof window === "undefined") return null;
  const local = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  if (local) return { token: local, remember: true };
  const session = window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
  if (session) return { token: session, remember: false };
  return null;
}

function clearStoredTokens(): void {
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export type StoredSession = { tokens: AuthResponse; remember: boolean };

export function storeSession(response: AuthResponse, remember: boolean): void {
  accessToken = response.accessToken;
  persistRefreshToken(response.refreshToken, remember);
}

export function clearSession(): void {
  accessToken = null;
  if (typeof window === "undefined") return;
  clearStoredTokens();
}

export function readStoredRefreshToken(): { token: string; remember: boolean } | null {
  return readRestoreToken();
}

type RequestInitLite = {
  method?: "GET" | "POST";
  body?: unknown;
};

async function request(path: string, init: RequestInitLite = {}): Promise<Response> {
  const headers = new Headers({ accept: "application/json" });
  if (init.body !== undefined) {
    headers.set("content-type", "application/json");
  }
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }
  return fetch(`/api/auth/${path}`, {
    method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    if (typeof data.message === "string") return data.message;
    if (Array.isArray(data.message)) return data.message[0] ?? "";
  } catch {
    return "";
  }
  return "";
}

let refreshInFlight: Promise<AuthResponse | null> | null = null;

export async function refreshSession(): Promise<AuthResponse | null> {
  if (refreshInFlight) return refreshInFlight;
  const stored = readRestoreToken();
  if (!stored) return null;
  const attempt = (async () => {
    try {
      const res = await request("refresh", { body: { refreshToken: stored.token } });
      if (!res.ok) return null;
      try {
        const data = (await res.json()) as AuthResponse;
        if (!data.accessToken || !data.refreshToken || !data.user) return null;
        storeSession(data, stored.remember);
        return data;
      } catch {
        return null;
      }
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  refreshInFlight = attempt;
  return attempt;
}

export async function restoreSession(): Promise<AuthResponse | null> {
  return refreshSession();
}

export type MappedError = { ar: string; en: string; detail: string };

function mapStatusToBilingual(status: number, detail: string): MappedError {
  const messages: Record<number, MappedError> = {
    400: {
      ar: "بيانات غير صحيحة، تحقق من الحقول.",
      en: "Invalid data, please check your fields.",
      detail,
    },
    401: {
      ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      en: "Invalid email or password.",
      detail,
    },
    409: {
      ar: "البريد الإلكتروني مسجّل بالفعل.",
      en: "This email is already registered.",
      detail,
    },
    429: {
      ar: "محاولات كثيرة جدًا، انتظر قليلًا ثم أعد المحاولة.",
      en: "Too many attempts, please wait a moment and try again.",
      detail,
    },
    502: {
      ar: "خدمة المصادقة غير متاحة حاليًا.",
      en: "The authentication service is currently unavailable.",
      detail,
    },
  };
  return (
    messages[status] ?? {
      ar: "حدث خطأ غير متوقع، حاول مرة أخرى.",
      en: "An unexpected error occurred, please try again.",
      detail,
    }
  );
}

export async function login(
  email: string,
  password: string,
  remember: boolean,
): Promise<{ ok: true; data: AuthResponse; remember: boolean } | { ok: false; status: number; error: MappedError }> {
  const res = await request("login", { body: { email, password } });
  if (res.ok) {
    try {
      const data = (await res.json()) as AuthResponse;
      if (!data.accessToken || !data.refreshToken || !data.user) {
        return { ok: false, status: 502, error: mapStatusToBilingual(502, "") };
      }
      return { ok: true, data, remember };
    } catch {
      return { ok: false, status: 502, error: mapStatusToBilingual(502, "") };
    }
  }
  if (res.status === 401 && (await refreshSession())) {
    const retry = await request("login", { body: { email, password } });
    if (retry.ok) {
      const data = (await retry.json()) as AuthResponse;
      return { ok: true, data, remember };
    }
  }
  const detail = await parseError(res);
  return { ok: false, status: res.status, error: mapStatusToBilingual(res.status, detail) };
}

export async function register(
  payload: RegisterPayload,
): Promise<{ ok: true; data: AuthResponse } | { ok: false; status: number; error: MappedError }> {
  const res = await request("register", { body: payload });
  if (res.ok) {
    try {
      const data = (await res.json()) as AuthResponse;
      if (!data.accessToken || !data.refreshToken || !data.user) {
        return { ok: false, status: 502, error: mapStatusToBilingual(502, "") };
      }
      return { ok: true, data };
    } catch {
      return { ok: false, status: 502, error: mapStatusToBilingual(502, "") };
    }
  }
  const detail = await parseError(res);
  return { ok: false, status: res.status, error: mapStatusToBilingual(res.status, detail) };
}

export async function fetchMe(
  retry = true,
): Promise<{ ok: true; data: AuthUser } | { ok: false; status: number; error: MappedError }> {
  const res = await request("me");
  if (res.ok) {
    try {
      const data = (await res.json()) as { user: AuthUser };
      if (data.user) return { ok: true, data: data.user };
    } catch {
      return { ok: false, status: 502, error: mapStatusToBilingual(502, "") };
    }
  }
  if (res.status === 401 && retry && (await refreshSession())) {
    return fetchMe(false);
  }
  const detail = await parseError(res);
  return { ok: false, status: res.status, error: mapStatusToBilingual(res.status, detail) };
}

export async function logout(): Promise<void> {
  const stored = readRestoreToken();
  try {
    await request("logout", { body: { refreshToken: stored?.token ?? "" } });
  } catch {
    return;
  }
  clearSession();
}

export async function fetchProviders(): Promise<{ google: boolean; facebook: boolean }> {
  try {
    const res = await request("providers");
    if (!res.ok) return { google: false, facebook: false };
    const data = (await res.json()) as { google?: boolean; facebook?: boolean };
    return { google: Boolean(data.google), facebook: Boolean(data.facebook) };
  } catch {
    return { google: false, facebook: false };
  }
}

export function adoptRefreshToken(token: string): boolean {
  if (!token) return false;
  persistRefreshToken(token, true);
  return true;
}

export const SESSION_COOKIE_LIFETIME_MS = SESSION_COOKIE_MAX_AGE_MS;
