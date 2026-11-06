"use client";

import * as React from "react";
import { MapPin, Building2, CreditCard, ShieldCheck, Check, Copy, AlertTriangle } from "lucide-react";
import { Panel, PanelHeader } from "@/components/panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Field, FieldGroup, FieldLabel, FieldContent, FieldError } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/hooks/use-locale";
import { useAuth } from "@/components/providers/auth-provider";
import { formatSar } from "@/lib/format";
import {
  fetchStoreProfile,
  updateStoreProfile,
  fetchStoreSettings,
  fetchKycDocuments,
  uploadKycDocument,
  fetchBankAccount,
  saveBankAccount,
  type StoreProfile,
  type StoreSettings,
  type KycDocument,
  type KycDocType,
  type BankAccount,
  DOC_TYPE_LABELS,
  DOC_STATUS_LABELS,
} from "@/lib/store";
import { fetchStorePayouts, type StorePayout } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, settingsSchema, FIELD_ERRORS } from "@/lib/store-validation";
import type { z } from "zod";
import type { Bilingual } from "@/lib/i18n";

const CITIES: Bilingual[] = [
  { ar: "الرياض", en: "Riyadh" },
  { ar: "جدة", en: "Jeddah" },
  { ar: "الدمام", en: "Dammam" },
  { ar: "الخبر", en: "Khobar" },
  { ar: "مكة المكرمة", en: "Makkah" },
  { ar: "المدينة المنورة", en: "Madinah" },
  { ar: "أبها", en: "Abha" },
  { ar: "الطائف", en: "Taif" },
  { ar: "تبوك", en: "Tabuk" },
  { ar: "حائل", en: "Hail" },
  { ar: "نجران", en: "Najran" },
  { ar: "جيزان", en: "Jizan" },
  { ar: "القطيف", en: "Qatif" },
  { ar: "الأحساء", en: "Al-Ahsa" },
];

const BANKS: Bilingual[] = [
  { ar: "البنك الأهلي السعودي", en: "Saudi National Bank" },
  { ar: "مصرف الراجحي", en: "Al Rajhi Bank" },
  { ar: "بنك الرياض", en: "Riyad Bank" },
  { ar: "البنك السعودي الفرنسي", en: "Saudi French Bank" },
  { ar: "بنك البلاد", en: "Bank AlBilad" },
  { ar: "بنك الجزيرة", en: "Bank AlJazira" },
  { ar: "البنك السعودي للاستثمار", en: "SAIB" },
  { ar: "مصرف الإنماء", en: "Al Inma Bank" },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function StatusBadge({ status }: { status: StoreProfile["status"] }) {
  const { t } = useLocale();
  const map: Record<StoreProfile["status"], { label: Bilingual; variant: "default" | "destructive" | "secondary" }> = {
    active: { label: { ar: "نشط", en: "Active" }, variant: "default" },
    under_review: { label: { ar: "قيد المراجعة", en: "Under Review" }, variant: "secondary" },
    action_required: { label: { ar: "يتطلب إجراء", en: "Action Required" }, variant: "destructive" },
  };
  const cfg = map[status] ?? map.action_required;
  return <Badge variant={cfg.variant}>{t(cfg.label)}</Badge>;
}

function DocStatusBadge({ status }: { status: KycDocument["status"] }) {
  const { t } = useLocale();
  const labels = DOC_STATUS_LABELS[status];
  const variant: "default" | "destructive" | "secondary" | "outline" =
    status === "verified" ? "default" :
    status === "rejected" || status === "action_needed" ? "destructive" :
    "secondary";
  return <Badge variant={variant}>{t(labels)}</Badge>;
}

export function ProfileView() {
  const { t, locale } = useLocale();
  const [profile, setProfile] = React.useState<StoreProfile | null>(null);
  const [settings, setSettings] = React.useState<StoreSettings | null>(null);
  const [kyc, setKyc] = React.useState<KycDocument[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [uploading, setUploading] = React.useState<Record<KycDocType, boolean>>({ cr: false, vat: false, iqama: false });
  const [selectedFile, setSelectedFile] = React.useState<Record<KycDocType, File | null>>({ cr: null, vat: null, iqama: null });
  const [ibanCopied, setIbanCopied] = React.useState(false);
  const [reAuthBusy, setReAuthBusy] = React.useState(false);
  const [bankAccount, setBankAccount] = React.useState<BankAccount | null>(null);
  const [payouts, setPayouts] = React.useState<StorePayout[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [p, s, d, ba] = await Promise.all([
      fetchStoreProfile(),
      fetchStoreSettings(),
      fetchKycDocuments(),
      fetchBankAccount(),
    ]);
    if (p.ok) setProfile(p.data);
    else toast.add({ title: t({ ar: "خطأ", en: "Error" }), description: p.failure.error[locale], type: "error" });
    if (s.ok) setSettings(s.data);
    else toast.add({ title: t({ ar: "خطأ", en: "Error" }), description: s.failure.error[locale], type: "error" });
    if (d.ok) setKyc(d.data);
    else toast.add({ title: t({ ar: "خطأ", en: "Error" }), description: d.failure.error[locale], type: "error" });
    if (ba.ok) setBankAccount(ba.data);
    try {
      const pr = await fetchStorePayouts();
      if (pr.length > 0) setPayouts(pr);
    } catch {
      // payout history is optional for this load
    }
    setLoading(false);
  }, [locale, t]);

  React.useEffect(() => {
    load();
  }, [load]);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      ownerFullName: "",
      nationalId: "",
      mobilePhone: "",
      contactEmail: "",
      commercialNameAr: "",
      commercialNameEn: "",
      crNumber: "",
      vatNumber: "",
      city: "",
      region: "",
      addressStreet: "",
      buildingNumber: "",
      postalCode: "",
    },
  });

  const settingsForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      bankName: "",
      accountHolderName: "",
      iban: "",
    },
  });

  React.useEffect(() => {
    if (profile) {
      profileForm.reset({
        ownerFullName: profile.ownerFullName || "",
        nationalId: profile.nationalId || "",
        mobilePhone: profile.mobilePhone || "",
        contactEmail: profile.contactEmail || "",
        commercialNameAr: profile.commercialNameAr || "",
        commercialNameEn: profile.commercialNameEn || "",
        crNumber: profile.crNumber || "",
        vatNumber: profile.vatNumber || "",
        city: profile.city || "",
        region: profile.region || "",
        addressStreet: profile.addressStreet || "",
        buildingNumber: profile.buildingNumber || "",
        postalCode: profile.postalCode || "",
      });
    }
  }, [profile, profileForm]);

  React.useEffect(() => {
    if (settings) {
      settingsForm.reset({
        bankName: settings.bankName || "",
        accountHolderName: settings.accountHolderName || "",
        iban: settings.iban || "",
      });
    }
  }, [settings, settingsForm]);

  const onProfileSubmit = profileForm.handleSubmit(async (values) => {
    try {
      const res = await updateStoreProfile(values);
      if (!res.ok) {
        const detail = res.failure.detail;
        const match = Object.keys(FIELD_ERRORS).find((k) => detail.toLowerCase().includes(k.toLowerCase()));
        if (match) {
          profileForm.setError(match as any, { type: "server", message: FIELD_ERRORS[match as keyof typeof FIELD_ERRORS][locale] });
        } else {
          toast.add({ title: t({ ar: "فشل الحفظ", en: "Save Failed" }), description: res.failure.error[locale], type: "error" });
        }
        return;
      }
      setProfile(res.data);
      toast.add({ title: t({ ar: "تم الحفظ", en: "Saved" }), description: t({ ar: "تم تحديث الملف الشخصي بنجاح", en: "Profile updated successfully" }), type: "success" });
    } catch {
      toast.add({ title: t({ ar: "خطأ", en: "Error" }), description: t({ ar: "حدث خطأ أثناء الحفظ", en: "An error occurred while saving" }), type: "error" });
    }
  });

  const onSettingsSubmit = settingsForm.handleSubmit(async (values) => {
    try {
      const res = await saveBankAccount({
        bankName: values.bankName || "",
        accountHolderName: values.accountHolderName || "",
        iban: values.iban || "",
      });
      if (!res.ok) {
        const detail = res.failure.detail;
        const match = Object.keys(FIELD_ERRORS).find((k) => detail.toLowerCase().includes(k.toLowerCase()));
        if (match) {
          settingsForm.setError(match as any, { type: "server", message: FIELD_ERRORS[match as keyof typeof FIELD_ERRORS][locale] });
        } else {
          toast.add({ title: t({ ar: "فشل الحفظ", en: "Save Failed" }), description: res.failure.error[locale], type: "error" });
        }
        return;
      }
      setBankAccount(res.data);
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              bankName: res.data.bankName,
              accountHolderName: res.data.accountHolderName,
              iban: res.data.iban,
            }
          : prev,
      );
      toast.add({ title: t({ ar: "تم الحفظ", en: "Saved" }), description: t({ ar: "تم تحديث بيانات البنك بنجاح", en: "Bank details updated successfully" }), type: "success" });
    } catch {
      toast.add({ title: t({ ar: "خطأ", en: "Error" }), description: t({ ar: "حدث خطأ أثناء الحفظ", en: "An error occurred while saving" }), type: "error" });
    }
  });

  const getDoc = (type: KycDocType) => kyc.find((d) => d.docType === type);

  const handleReauth = async () => {
    setReAuthBusy(true);
    await new Promise((r) => setTimeout(r, 800));
    setReAuthBusy(false);
    toast.add({ title: t({ ar: "تم الإرسال", en: "Submitted" }), description: t({ ar: "تم إرسال الوثائق للمراجعة واستئناف النشاط", en: "Documents submitted for review and activity resumed" }), type: "success" });
  };

  const handleUpload = async (type: KycDocType) => {
    const file = selectedFile[type];
    if (!file) {
      toast.add({ title: t({ ar: "خطأ", en: "Error" }), description: t({ ar: "الرجاء اختيار ملف أولا", en: "Please select a file first" }), type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.add({ title: t({ ar: "خطأ", en: "Error" }), description: t({ ar: "الملف كبير جدا (الحد الأقصى 5 ميجابايت)", en: "File is too large (max 5MB)" }), type: "error" });
      return;
    }
    setUploading((p) => ({ ...p, [type]: true }));
    try {
      const base64 = await fileToBase64(file);
      const res = await uploadKycDocument(type, file.name, file.type, base64);
      if (!res.ok) {
        toast.add({ title: t({ ar: "فشل الرفع", en: "Upload Failed" }), description: res.failure.error[locale], type: "error" });
      } else {
        setKyc((prev) => {
          const exists = prev.find((d) => d.docType === type);
          if (exists) {
            return prev.map((d) => (d.docType === type ? res.data : d));
          }
          return [...prev, res.data];
        });
        setSelectedFile((p) => ({ ...p, [type]: null }));
        toast.add({ title: t({ ar: "تم الرفع", en: "Uploaded" }), description: t({ ar: "تم رفع المستند بنجاح", en: "Document uploaded successfully" }), type: "success" });
      }
    } catch {
      toast.add({ title: t({ ar: "خطأ", en: "Error" }), description: t({ ar: "فشل رفع الملف", en: "Failed to upload file" }), type: "error" });
    } finally {
      setUploading((p) => ({ ...p, [type]: false }));
    }
  };

  const copyIban = async () => {
    if (!settings?.iban) return;
    await navigator.clipboard.writeText(settings.iban.replace(/\s/g, ""));
    setIbanCopied(true);
    setTimeout(() => setIbanCopied(false), 1600);
  };

  if (loading && !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-muted-foreground">{t({ ar: "جاري التحميل...", en: "Loading..." })}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelHeader
          title={t({ ar: "الملف الشخصي للمتجر", en: "Store Profile" })}
          hint={t({ ar: "المعلومات المعتمدة الظاهرة للعملاء", en: "Verified information shown to customers" })}
          action={
            <div className="flex items-center gap-2">
              <StatusBadge status={profile?.status ?? "action_required"} />
              <Button variant="outline" onClick={() => setActiveTab("general")}>
                {t({ ar: "تحرير الملف", en: "Edit Profile" })}
              </Button>
            </div>
          }
        />
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">{t({ ar: "نظرة عامة", en: "Overview" })}</TabsTrigger>
              <TabsTrigger value="general">{t({ ar: "المعلومات العامة", en: "General Business Info" })}</TabsTrigger>
              <TabsTrigger value="address">{t({ ar: "العنوان", en: "Address" })}</TabsTrigger>
              <TabsTrigger value="bank">{t({ ar: "البنك والدفع", en: "Bank & Payout" })}</TabsTrigger>
              <TabsTrigger value="kyc">{t({ ar: "التحقق والمستندات", en: "Verification & Documents" })}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Building2 className="size-4" />
                      {t({ ar: "المعلومات الأساسية", en: "Basic Information" })}
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div><span className="text-muted-foreground">{t({ ar: "الاسم التجاري", en: "Commercial Name" })}:</span> <span className="font-semibold">{profile?.commercialNameAr || profile?.commercialNameEn || "-"}</span></div>
                      <div><span className="text-muted-foreground">{t({ ar: "رقم السجل", en: "CR Number" })}:</span> <span className="font-mono font-semibold" dir="ltr">{profile?.crNumber || "-"}</span></div>
                      <div><span className="text-muted-foreground">{t({ ar: "الرقم الضريبي", en: "VAT Number" })}:</span> <span className="font-mono font-semibold" dir="ltr">{profile?.vatNumber || "-"}</span></div>
                      <div><span className="text-muted-foreground">{t({ ar: "الهاتف", en: "Phone" })}:</span> <span dir="ltr">{profile?.mobilePhone || "-"}</span></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <MapPin className="size-4" />
                      {t({ ar: "العنوان", en: "Address" })}
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div>{profile?.addressStreet || "-"}</div>
                      <div>{[profile?.buildingNumber, profile?.city, profile?.region].filter(Boolean).join(" - ") || "-"}</div>
                      <div dir="ltr">{profile?.postalCode || "-"}</div>
                    </div>

                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <CreditCard className="size-4" />
                      {t({ ar: "الحساب البنكي", en: "Bank Account" })}
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div><span className="text-muted-foreground">{t({ ar: "البنك", en: "Bank" })}:</span> <span className="font-semibold">{settings?.bankName || "-"}</span></div>
                      <div><span className="text-muted-foreground">{t({ ar: "اسم المستفيد", en: "Account Holder" })}:</span> <span className="font-semibold">{settings?.accountHolderName || "-"}</span></div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{t({ ar: "IBAN", en: "IBAN" })}:</span>
                        <span className="font-mono font-semibold" dir="ltr">{settings?.iban || "-"}</span>
                        <Button variant="ghost" size="icon-sm" onClick={copyIban} aria-label={t({ ar: "نسخ", en: "Copy" })}>
                          {ibanCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <ShieldCheck className="size-3.5 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <form onSubmit={onProfileSubmit} className="space-y-4">
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="owner">{t({ ar: "الاسم الكامل للمالك", en: "Owner Full Name" })}</FieldLabel>
                        <FieldContent>
                          <Input id="owner" {...profileForm.register("ownerFullName")} />
                          <FieldError errors={[profileForm.formState.errors.ownerFullName]} />
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="national">{t({ ar: "الهوية الوطنية", en: "National ID" })}</FieldLabel>
                        <FieldContent>
                          <Input id="national" dir="ltr" {...profileForm.register("nationalId")} />
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="phone">{t({ ar: "الجوال", en: "Mobile Phone" })}</FieldLabel>
                        <FieldContent>
                          <Input id="phone" dir="ltr" placeholder="+9665..." {...profileForm.register("mobilePhone")} />
                          <FieldError errors={[profileForm.formState.errors.mobilePhone]} />
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="email">{t({ ar: "البريد الإلكتروني للتواصل", en: "Contact Email" })}</FieldLabel>
                        <FieldContent>
                          <Input id="email" type="email" dir="ltr" {...profileForm.register("contactEmail")} />
                          <FieldError errors={[profileForm.formState.errors.contactEmail]} />
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="comAr">{t({ ar: "الاسم التجاري (عربي)", en: "Commercial Name (AR)" })}</FieldLabel>
                        <FieldContent>
                          <Input id="comAr" {...profileForm.register("commercialNameAr")} />
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="comEn">{t({ ar: "الاسم التجاري (إنجليزي)", en: "Commercial Name (EN)" })}</FieldLabel>
                        <FieldContent>
                          <Input id="comEn" {...profileForm.register("commercialNameEn")} />
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="cr">{t({ ar: "رقم السجل التجاري", en: "CR Number" })}</FieldLabel>
                        <FieldContent>
                          <Input id="cr" dir="ltr" {...profileForm.register("crNumber")} />
                          <FieldError errors={[profileForm.formState.errors.crNumber]} />
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="vat">{t({ ar: "الرقم الضريبي", en: "VAT Number" })}</FieldLabel>
                        <FieldContent>
                          <Input id="vat" dir="ltr" {...profileForm.register("vatNumber")} />
                          <FieldError errors={[profileForm.formState.errors.vatNumber]} />
                        </FieldContent>
                      </Field>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                          {profileForm.formState.isSubmitting ? t({ ar: "جاري الحفظ...", en: "Saving..." }) : t({ ar: "حفظ التغييرات", en: "Save Changes" })}
                        </Button>
                      </div>
                    </FieldGroup>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="address" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <form onSubmit={onProfileSubmit} className="space-y-4">
                    <FieldGroup>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="city">{t({ ar: "المدينة", en: "City" })}</FieldLabel>
                          <FieldContent>
                            <NativeSelect id="city" value={profileForm.watch("city")} onChange={(e) => profileForm.setValue("city", e.target.value)}>
                              <option value="">{t({ ar: "اختر المدينة", en: "Select City" })}</option>
                              {CITIES.map((c) => (
                                <NativeSelectOption key={c.ar} value={c.en}>{t(c)}</NativeSelectOption>
                              ))}
                            </NativeSelect>
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="region">{t({ ar: "المنطقة", en: "Region" })}</FieldLabel>
                          <FieldContent>
                            <Input id="region" {...profileForm.register("region")} />
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="street">{t({ ar: "الشارع", en: "Street" })}</FieldLabel>
                          <FieldContent>
                            <Input id="street" {...profileForm.register("addressStreet")} />
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="building">{t({ ar: "رقم المبنى", en: "Building Number" })}</FieldLabel>
                          <FieldContent>
                            <Input id="building" dir="ltr" {...profileForm.register("buildingNumber")} />
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="postal">{t({ ar: "الرمز البريدي", en: "Postal Code" })}</FieldLabel>
                          <FieldContent>
                            <Input id="postal" dir="ltr" {...profileForm.register("postalCode")} />
                          </FieldContent>
                        </Field>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                          {profileForm.formState.isSubmitting ? t({ ar: "جاري الحفظ...", en: "Saving..." }) : t({ ar: "حفظ التغييرات", en: "Save Changes" })}
                        </Button>
                      </div>
                    </FieldGroup>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <form onSubmit={onSettingsSubmit} className="space-y-4">
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="bank">{t({ ar: "اسم البنك", en: "Bank Name" })}</FieldLabel>
                        <FieldContent>
                          <NativeSelect id="bank" value={settingsForm.watch("bankName")} onChange={(e) => settingsForm.setValue("bankName", e.target.value)}>
                            <option value="">{t({ ar: "اختر البنك", en: "Select Bank" })}</option>
                            {BANKS.map((b) => (
                              <NativeSelectOption key={b.ar} value={b.en}>{t(b)}</NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="holder">{t({ ar: "اسم صاحب الحساب", en: "Account Holder Name" })}</FieldLabel>
                        <FieldContent>
                          <Input id="holder" {...settingsForm.register("accountHolderName")} />
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="iban">{t({ ar: "IBAN", en: "IBAN" })}</FieldLabel>
                        <FieldContent>
                          <Input id="iban" dir="ltr" placeholder="SA..." {...settingsForm.register("iban")} />
                          <FieldError errors={[settingsForm.formState.errors.iban]} />
                        </FieldContent>
                      </Field>

                      <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <div>
                          <div className="font-semibold">{t({ ar: "بيانات الحساب البنكي", en: "Bank Account" })}</div>
                          <div className="text-muted-foreground">{t({ ar: "الحساب البنكي للمدفوعات", en: "Mada payout account" })}</div>
                        </div>
                        <Badge variant="secondary">
                          {bankAccount?.isVerified ? t({ ar: "مفعل", en: "Verified" }) : t({ ar: "قيد المراجعة", en: "Pending Verification" })}
                        </Badge>
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={settingsForm.formState.isSubmitting}>
                          {settingsForm.formState.isSubmitting ? t({ ar: "جاري الحفظ...", en: "Saving..." }) : t({ ar: "حفظ بيانات البنك", en: "Save Bank Details" })}
                        </Button>
                      </div>
                    </FieldGroup>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-semibold">{t({ ar: "سجل المدفوعات", en: "Payout History" })}</div>
                  {payouts.length === 0 ? (
                    <div className="mt-3 text-sm text-muted-foreground">{t({ ar: "لا توجد مدفوعات بعد", en: "No payouts yet" })}</div>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {payouts.map((payout) => (
                        <li key={payout.id} className="flex items-center justify-between rounded border p-2 text-sm">
                          <span dir="ltr">{payout.id}</span>
                          <span>{formatSar(payout.amountSar, locale)}</span>
                          <Badge variant={payout.status === "paid" ? "default" : "secondary"}>
                            {payout.status === "paid" ? t({ ar: "مدفوع", en: "Paid" }) : t({ ar: "قيد الانتظار", en: "Pending" })}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>



            <TabsContent value="kyc" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {(["cr", "vat", "iqama"] as KycDocType[]).map((type) => {
                    const doc = getDoc(type);
                    const label = DOC_TYPE_LABELS[type];
                    return (
                      <div key={type} className="grid grid-cols-1 gap-4 rounded-xl border p-4 md:grid-cols-[1fr_auto]">
                        <div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4" />
                            <span className="font-semibold">{t(label)}</span>
                            <DocStatusBadge status={doc?.status ?? "action_needed"} />
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {doc ? `${t({ ar: "تم الرفع:", en: "Uploaded:" })} ${new Date(doc.uploadedAt).toLocaleDateString(locale)} - ${doc.fileName}` : t({ ar: "لم يتم الرفع بعد", en: "Not uploaded yet" })}
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => setSelectedFile((p) => ({ ...p, [type]: e.target.files?.[0] ?? null }))}
                            />
                            <Button type="button" size="sm" onClick={() => handleUpload(type)} disabled={uploading[type] || !selectedFile[type]}>
                              {uploading[type] ? t({ ar: "جاري الرفع...", en: "Uploading..." }) : t({ ar: "رفع", en: "Upload" })}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4" />
                      <span className="text-sm font-semibold">{t({ ar: "مراجعة KYC مطلوبة", en: "KYC Review Required" })}</span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={(props, state) => (
                          <Button variant="outline" {...props}>
                            {t({ ar: "إعادة التقديم", en: "Resubmit" })}
                          </Button>
                        )}
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t({ ar: "إعادة التقديم للمراجعة", en: "Resubmit for Review" })}</AlertDialogTitle>
                          <AlertDialogDescription>{t({ ar: "سيتم إرسال المستندات المرفوعة حالياً للمراجعة واستئناف نشاط المتجر.", en: "Current uploaded documents will be sent for review and store activity will resume." })}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t({ ar: "إلغاء", en: "Cancel" })}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleReauth} disabled={reAuthBusy}>
                            {reAuthBusy ? t({ ar: "جاري الإرسال...", en: "Submitting..." }) : t({ ar: "إرسال", en: "Submit" })}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Panel>
    </div>
  );
}
