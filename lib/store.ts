import { getAccessToken, refreshSession } from "@/lib/auth";
import type { Bilingual } from "@/lib/i18n";

export type StoreStatus = "active" | "under_review" | "action_required";
export type KycDocType = "cr" | "vat" | "iqama";
export type KycDocStatus = "uploaded" | "verified" | "rejected" | "action_needed";

export type StoreProfile = {
  id: string;
  storeId: string | null;
  ownerFullName: string;
  nationalId: string;
  mobilePhone: string;
  contactEmail: string;
  commercialNameAr: string;
  commercialNameEn: string;
  crNumber: string;
  vatNumber: string;
  city: string;
  region: string;
  addressStreet: string;
  buildingNumber: string;
  postalCode: string;
  status: StoreStatus;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoreSettings = {
  id: string;
  storeId: string | null;
  bankName: string;
  accountHolderName: string;
  iban: string;
  stripeConnected: boolean;
  currency: string;
  updatedAt: string;
};

export type KycDocument = {
  id: string;
  storeId: string | null;
  docType: KycDocType;
  fileName: string;
  contentType: string;
  status: KycDocStatus;
  uploadedAt: string;
  verifiedAt: string | null;
};

export type StoreError = { status: number; error: Bilingual; detail: string };
export type StoreResult<T> =
  | { ok: true; data: T }
  | { ok: false; failure: StoreError };

export type ProfileInput = {
  ownerFullName?: string;
  nationalId?: string;
  mobilePhone?: string;
  contactEmail?: string;
  commercialNameAr?: string;
  commercialNameEn?: string;
  crNumber?: string;
  vatNumber?: string;
  city?: string;
  region?: string;
  addressStreet?: string;
  buildingNumber?: string;
  postalCode?: string;
};

export type SettingsInput = {
  bankName?: string;
  accountHolderName?: string;
  iban?: string;
};

export const DOC_TYPE_LABELS: Record<KycDocType, Bilingual> = {
  cr: { ar: "السجل التجاري", en: "Commercial Registration" },
  vat: { ar: "الشهادة الضريبية (ZATCA)", en: "VAT Certificate" },
  iqama: { ar: "هوية المالك / الإقامة", en: "Owner National ID / Iqama" },
};

export const DOC_STATUS_LABELS: Record<KycDocStatus, Bilingual> = {
  uploaded: { ar: "تم الرفع", en: "Uploaded" },
  verified: { ar: "معتمد", en: "Verified" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  action_needed: { ar: "يحتاج تحديث", en: "Action Needed" },
};

function genericError(status: number, detail: string): StoreError {
  const messages: Record<number, Bilingual> = {
    400: { ar: "تأكد من صحة الحقول المدخلة.", en: "Please check the form fields." },
    401: { ar: "انتهت صلاحية الجلسة، أعد تسجيل الدخول.", en: "Session expired, please sign in again." },
    403: { ar: "ليس لديك صلاحية لهذا الإجراء.", en: "You do not have permission for this action." },
    404: { ar: "غير موجود.", en: "Not found." },
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

function mapStatus(status: number, detail: string): StoreError {
  const lower = detail.toLowerCase();
  if (status === 400) {
    if (/cr number/i.test(lower)) {
      return {
        status,
        error: { ar: "رقم السجل التجاري غير صالح (10 أرقام).", en: "Invalid CR number (10 digits)." },
        detail,
      };
    }
    if (/vat number/i.test(lower)) {
      return {
        status,
        error: { ar: "الرقم الضريبي غير صالح (15 رقما).", en: "Invalid VAT number (15 digits)." },
        detail,
      };
    }
    if (/iban/i.test(lower)) {
      return {
        status,
        error: { ar: "الآيبان غير صالح (SA متبوع بـ 22 رقما).", en: "Invalid IBAN (SA + 22 digits)." },
        detail,
      };
    }
    if (/mobile phone/i.test(lower)) {
      return {
        status,
        error: { ar: "رقم الجوال يجب أن يبدأ بـ +966.", en: "Mobile phone must start with +966." },
        detail,
      };
    }
    if (/email/i.test(lower)) {
      return {
        status,
        error: { ar: "البريد الإلكتروني غير صحيح.", en: "Invalid email address." },
        detail,
      };
    }
  }
  return genericError(status, detail);
}

export function parseStoreProfile(raw: unknown): StoreProfile | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  return {
    id: typeof record.id === "string" ? record.id : "",
    storeId: typeof record.storeId === "string" ? record.storeId : null,
    ownerFullName: typeof record.ownerFullName === "string" ? record.ownerFullName : "",
    nationalId: typeof record.nationalId === "string" ? record.nationalId : "",
    mobilePhone: typeof record.mobilePhone === "string" ? record.mobilePhone : "",
    contactEmail: typeof record.contactEmail === "string" ? record.contactEmail : "",
    commercialNameAr: typeof record.commercialNameAr === "string" ? record.commercialNameAr : "",
    commercialNameEn: typeof record.commercialNameEn === "string" ? record.commercialNameEn : "",
    crNumber: typeof record.crNumber === "string" ? record.crNumber : "",
    vatNumber: typeof record.vatNumber === "string" ? record.vatNumber : "",
    city: typeof record.city === "string" ? record.city : "",
    region: typeof record.region === "string" ? record.region : "",
    addressStreet: typeof record.addressStreet === "string" ? record.addressStreet : "",
    buildingNumber: typeof record.buildingNumber === "string" ? record.buildingNumber : "",
    postalCode: typeof record.postalCode === "string" ? record.postalCode : "",
    status:
      record.status === "active" ||
      record.status === "under_review" ||
      record.status === "action_required"
        ? (record.status as StoreStatus)
        : "action_required",
    isVerified: typeof record.isVerified === "boolean" ? record.isVerified : false,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : "",
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
  };
}

export function parseStoreSettings(raw: unknown): StoreSettings | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  return {
    id: typeof record.id === "string" ? record.id : "",
    storeId: typeof record.storeId === "string" ? record.storeId : null,
    bankName: typeof record.bankName === "string" ? record.bankName : "",
    accountHolderName: typeof record.accountHolderName === "string" ? record.accountHolderName : "",
    iban: typeof record.iban === "string" ? record.iban : "",
    stripeConnected: typeof record.stripeConnected === "boolean" ? record.stripeConnected : false,
    currency: typeof record.currency === "string" ? record.currency : "SAR",
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
  };
}

export function parseKycDocument(raw: unknown): KycDocument | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  return {
    id: typeof record.id === "string" ? record.id : "",
    storeId: typeof record.storeId === "string" ? record.storeId : null,
    docType:
      record.docType === "cr" || record.docType === "vat" || record.docType === "iqama"
        ? (record.docType as KycDocType)
        : "cr",
    fileName: typeof record.fileName === "string" ? record.fileName : "",
    contentType: typeof record.contentType === "string" ? record.contentType : "",
    status:
      record.status === "uploaded" ||
      record.status === "verified" ||
      record.status === "rejected" ||
      record.status === "action_needed"
        ? (record.status as KycDocStatus)
        : "uploaded",
    uploadedAt: typeof record.uploadedAt === "string" ? record.uploadedAt : "",
    verifiedAt:
      typeof record.verifiedAt === "string" ? record.verifiedAt : null,
  };
}

type RequestResult = { status: number; payload: unknown };

async function authorizedRequest(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<RequestResult | null> {
  const send = async (token: string | null): Promise<Response> => {
    const headers = new Headers({ accept: "application/json" });
    if (body !== undefined) headers.set("content-type", "application/json");
    if (token) headers.set("authorization", `Bearer ${token}`);
    return fetch(`/api/store/${path}`, {
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

function rows<T>(parse: (raw: unknown) => T | null, payload: unknown): T[] {
  if (typeof payload === "object" && payload !== null) {
    const results = (payload as Record<string, unknown>).results;
    if (Array.isArray(results)) {
      return results.map(parse).filter((row): row is T => row !== null);
    }
    return [parse(payload)].filter((row): row is T => row !== null);
  }
  return [];
}

export async function fetchStoreProfile(): Promise<StoreResult<StoreProfile>> {
  const result = await authorizedRequest("profile", "GET");
  if (!result || result.status >= 400) {
    const status = result?.status ?? 502;
    return {
      ok: false,
      failure: mapStatus(status, parseErrorDetail(result?.payload) || ""),
    };
  }
  const item = parseStoreProfile(result.payload);
  if (!item) {
    return { ok: false, failure: genericError(502, "Unexpected payload.") };
  }
  return { ok: true, data: item };
}

export async function updateStoreProfile(
  input: ProfileInput,
): Promise<StoreResult<StoreProfile>> {
  const result = await authorizedRequest("profile", "PUT", input);
  if (!result || result.status >= 400) {
    const status = result?.status ?? 502;
    return {
      ok: false,
      failure: mapStatus(status, parseErrorDetail(result?.payload) || ""),
    };
  }
  const item = parseStoreProfile(result.payload);
  if (!item) {
    return { ok: false, failure: genericError(502, "Unexpected payload.") };
  }
  return { ok: true, data: item };
}

export async function fetchStoreSettings(): Promise<StoreResult<StoreSettings>> {
  const result = await authorizedRequest("settings", "GET");
  if (!result || result.status >= 400) {
    const status = result?.status ?? 502;
    return {
      ok: false,
      failure: mapStatus(status, parseErrorDetail(result?.payload) || ""),
    };
  }
  const item = parseStoreSettings(result.payload);
  if (!item) {
    return { ok: false, failure: genericError(502, "Unexpected payload.") };
  }
  return { ok: true, data: item };
}

export async function updateStoreSettings(
  input: SettingsInput,
): Promise<StoreResult<StoreSettings>> {
  const result = await authorizedRequest("settings", "PUT", input);
  if (!result || result.status >= 400) {
    const status = result?.status ?? 502;
    return {
      ok: false,
      failure: mapStatus(status, parseErrorDetail(result?.payload) || ""),
    };
  }
  const item = parseStoreSettings(result.payload);
  if (!item) {
    return { ok: false, failure: genericError(502, "Unexpected payload.") };
  }
  return { ok: true, data: item };
}

export async function fetchKycDocuments(): Promise<StoreResult<KycDocument[]>> {
  const result = await authorizedRequest("documents", "GET");
  if (!result || result.status >= 400) {
    const status = result?.status ?? 502;
    return {
      ok: false,
      failure: mapStatus(status, parseErrorDetail(result?.payload) || ""),
    };
  }
  return { ok: true, data: rows(parseKycDocument, result.payload) };
}

export async function uploadKycDocument(
  docType: KycDocType,
  fileName: string,
  contentType: string,
  fileDataBase64: string,
): Promise<StoreResult<KycDocument>> {
  const result = await authorizedRequest("documents", "POST", {
    docType,
    fileName,
    contentType,
    fileData: fileDataBase64,
  });
  if (!result || result.status >= 400) {
    const status = result?.status ?? 502;
    return {
      ok: false,
      failure: mapStatus(status, parseErrorDetail(result?.payload) || ""),
    };
  }
  const item = parseKycDocument(result.payload);
  if (!item) {
    return { ok: false, failure: genericError(502, "Unexpected payload.") };
  }
  return { ok: true, data: item };
}

export type BankAccount = {
  id: string;
  bankName: string;
  accountHolderName: string;
  iban: string;
  isVerified: boolean;
};

function parseBankAccount(raw: unknown): BankAccount | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  return {
    id: typeof record.id === "string" ? record.id : "",
    bankName: typeof record.bankName === "string" ? record.bankName : "",
    accountHolderName:
      typeof record.accountHolderName === "string" ? record.accountHolderName : "",
    iban: typeof record.iban === "string" ? record.iban : "",
    isVerified: typeof record.isVerified === "boolean" ? record.isVerified : false,
  };
}

export async function fetchBankAccount(): Promise<StoreResult<BankAccount | null>> {
  const result = await authorizedRequest("bank-account", "GET");
  if (!result || result.status >= 400) {
    if (result?.status === 404) {
      return { ok: true, data: null };
    }
    const status = result?.status ?? 502;
    return {
      ok: false,
      failure: mapStatus(status, parseErrorDetail(result?.payload) || ""),
    };
  }
  const item = parseBankAccount(result.payload);
  if (!item) {
    return { ok: false, failure: genericError(502, "Unexpected payload.") };
  }
  return { ok: true, data: item };
}

export type BankAccountFieldError = {
  field: "bankName" | "accountHolderName" | "iban";
  code: string;
};

export async function saveBankAccount(input: {
  bankName: string;
  accountHolderName: string;
  iban: string;
}): Promise<StoreResult<BankAccount> & { fieldErrors?: BankAccountFieldError[] }> {
  const result = await authorizedRequest("bank-account", "POST", {
    bankName: input.bankName,
    accountHolderName: input.accountHolderName,
    iban: input.iban,
  });
  if (!result || result.status >= 400) {
    const status = result?.status ?? 502;
    const payload = result?.payload as Record<string, unknown> | undefined;
    const fieldErrors = parseBankAccountFieldErrors(payload);
    return {
      ok: false,
      failure: mapStatus(status, parseErrorDetail(payload) || ""),
      ...(fieldErrors.length ? { fieldErrors } : {}),
    };
  }
  const item = parseBankAccount(result.payload);
  if (!item) {
    return { ok: false, failure: genericError(502, "Unexpected payload.") };
  }
  return { ok: true, data: item };
}

const BANK_ACCOUNT_FIELDS: BankAccountFieldError["field"][] = [
  "bankName",
  "accountHolderName",
  "iban",
];

function parseBankAccountFieldErrors(
  payload: Record<string, unknown> | undefined,
): BankAccountFieldError[] {
  const errors = payload?.errors;
  if (!Array.isArray(errors)) return [];
  return errors.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const record = entry as Record<string, unknown>;
    const field =
      typeof record.field === "string" ? record.field : "";
    const code = typeof record.code === "string" ? record.code : "";
    if (!code) return [];
    const canonical = BANK_ACCOUNT_FIELDS.find((candidate) =>
      candidate.toLowerCase() === field.toLowerCase(),
    );
    if (!canonical) return [];
    return [{ field: canonical, code }];
  });
}
