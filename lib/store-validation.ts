import { z } from "zod";
import type { Bilingual } from "@/lib/i18n";

export type ProfileInput = z.infer<typeof profileSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;

const optionalText = z.union([z.string(), z.literal("")]).optional();

export const profileSchema = z.object({
  ownerFullName: optionalText,
  nationalId: optionalText,
  mobilePhone: optionalText.refine((value) => !value || value.startsWith("+966"), {
    message: "Mobile phone must start with +966.",
  }),
  contactEmail: optionalText.refine(
    (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    { message: "Invalid email address." },
  ),
  commercialNameAr: optionalText,
  commercialNameEn: optionalText,
  crNumber: optionalText.refine((value) => !value || /^\d{10}$/.test(value), {
    message: "CR number must be 10 digits.",
  }),
  vatNumber: optionalText.refine((value) => !value || /^\d{15}$/.test(value), {
    message: "VAT number must be 15 digits.",
  }),
  city: optionalText,
  region: optionalText,
  addressStreet: optionalText,
  buildingNumber: optionalText,
  postalCode: optionalText,
});

export const settingsSchema = z.object({
  bankName: optionalText,
  accountHolderName: optionalText,
  iban: optionalText.refine((value) => !value || /^SA\d{22}$/.test(value), {
    message: "IBAN must start with SA followed by 22 digits.",
  }),
});

export const FIELD_ERRORS: Record<string, Bilingual> = {
  mobilePhone: {
    ar: "رقم الجوال يجب أن يبدأ بـ +966",
    en: "Mobile phone must start with +966.",
  },
  crNumber: {
    ar: "رقم السجل التجاري يجب أن يتكون من 10 أرقام.",
    en: "CR number must be 10 digits.",
  },
  vatNumber: {
    ar: "الرقم الضريبي يجب أن يتكون من 15 رقما.",
    en: "VAT number must be 15 digits.",
  },
  iban: {
    ar: "الآيبان يجب أن يبدأ بـ SA متبوعا بـ 22 رقما.",
    en: "IBAN must start with SA followed by 22 digits.",
  },
  contactEmail: {
    ar: "البريد الإلكتروني غير صحيح.",
    en: "Invalid email address.",
  },
};

export function fieldErrorMessage(
  field: string,
  locale: "ar" | "en",
  fallback?: string,
): string {
  const mapped = FIELD_ERRORS[field];
  if (mapped) return mapped[locale];
  return fallback ?? "";
}

export function zodFieldError(
  error: z.ZodError,
  field: string,
  locale: "ar" | "en",
): string {
  const issue = error.issues.find((item) => item.path[0] === field);
  if (!issue) return "";
  return fieldErrorMessage(field, locale, issue.message);
}

export function formErrorMessage(error: unknown, locale: "ar" | "en"): string {
  if (error instanceof z.ZodError) {
    const first = error.issues[0];
    if (!first) {
      return locale === "ar" ? "تحقق من الحقول المدخلة." : "Please check the form fields.";
    }
    const mapped = FIELD_ERRORS[String(first.path[0])];
    if (mapped) return mapped[locale];
    return first.message;
  }
  return locale === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.";
}
