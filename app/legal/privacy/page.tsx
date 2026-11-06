"use client";

import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { useLocale } from "@/hooks/use-locale";

const sections: LegalSection[] = [
  {
    id: "introduction",
    title: { ar: "1. مقدمة", en: "1. Introduction" },
    body: [
      {
        ar:
          "تشرح سياسة الخصوصية هذه كيف تقوم منصة ميكانيكا لقطع الغيار بجمع واستخدام وحماية وحفظ بيانات التجار («المتجر») في المملكة العربية السعودية.",
        en:
          "This Privacy Policy explains how the Mechanics Spare Parts Platform collects, uses, protects, and retains merchant data («the Store») in the Kingdom of Saudi Arabia.",
      },
      {
        ar: "بإنشاء حساب المتجر، فإنك توافق على جمع ومعالجة بياناتك وفقاً لهذه السياسة ونظام حماية البيانات الشخصية (PDPL).",
        en:
          "By creating a store account, you agree to the collection and processing of your data in accordance with this policy and the Personal Data Protection Law (PDPL).",
      },
    ],
  },
  {
    id: "pdpl",
    title: { ar: "2. الامتثال لـ PDPL وساما", en: "2. PDPL & SAMA Compliance" },
    body: [
      {
        ar:
          "تلتزم المنصة بأنظمة حماية البيانات الشخصية السعودية (PDPL) وأنظمة البنك المركزي السعودي (ساما) المتعلقة بحماية البيانات المالية والمصرفية للمتاجر.",
        en:
          "The Platform complies with the Saudi Personal Data Protection Law (PDPL) and SAMA regulations concerning the protection of merchants' financial and banking data.",
      },
      {
        ar: "يتم تخزين بيانات المتجر (رقم الهوية الوطنية / الإقامة، السجل التجاري، تفاصيل الآيبان) في بيئات مؤمنة مع تشفير البيانات الحساسة أثناء النقل والتخزين.",
        en:
          "Merchant data (Owner National ID / Iqama, Commercial Registration, IBAN details) is stored in secure environments with sensitive data encrypted in transit and at rest.",
      },
    ],
  },
  {
    id: "collection",
    title: { ar: "3. نطاق جمع البيانات", en: "3. Data Collection Scope" },
    body: [
      {
        ar:
        "تجمع المنصة معلومات الكيان التجاري (اسم المتجر، السجل التجاري، رقم الضريبة)، وموقع المستودع الفعلي (الإحداثيات)، وتفاصيل الحساب البنكي اللازمة لمعالجة المدفوعات عبر مada أو Stripe أو Moyasar.",
        en:
        "The Platform collects business entity information (store name, CR, tax number), physical warehouse location coordinates, and bank details required for payment processing via Mada, Stripe, or Moyasar.",
      },
    ],
  },
  {
    id: "sharing",
    title: { ar: "4. قيود مشاركة البيانات", en: "4. Data Sharing Restrictions" },
    body: [
      {
        ar:
          "لا يتم بيع بيانات المتجر أو مشاركتها مع أي طرف ثالث، باستثناء الحالات المطلوبة قانوناً: الفوترة الإلكترونية لـ ZATCA، بوابات الدفع، والسلطات الرسمية السعودية.",
        en:
        "Merchant data is never sold or shared with any third party, except as required by law: ZATCA electronic invoicing, payment gateways, and official Saudi authorities.",
      },
    ],
  },
  {
    id: "rights",
    title: { ar: "5. حقوقك والاحتفاظ بالبيانات", en: "5. Your Rights & Retention" },
    body: [
      {
        ar:
          "يحق للمتجر الوصول إلى بياناته، طلب تصحيحها، أو طلب حذفها وفقاً لأنظمة PDPL، باستثناء البيانات التي يتعين على المنصة الاحتفاظ بها للامتثال الضريبي أو التنظيمي.",
        en:
        "The Store has the right to access its data, request correction, or request deletion in accordance with PDPL, except data the Platform must retain for tax or regulatory compliance.",
      },
      {
        ar: "يتم الاحتفاظ بالبيانات طوال فترة نشاط الحساب وبعده للمدة التي تتطلبها الأنظمة السارية في المملكة العربية السعودية.",
        en:
        "Data is retained for the duration of account activity and for the period required by applicable laws in the Kingdom of Saudi Arabia.",
      },
    ],
  },
  {
    id: "contact",
    title: { ar: "6. التواصل", en: "6. Contact" },
    body: [
      {
        ar: "لأي استفسارات حول هذه السياسة أو ممارسة حقوقك، يرجى التواصل مع دعم المنصة من خلال لوحة التحكم.",
        en: "For any questions about this policy or to exercise your rights, please contact Platform support through the dashboard.",
      },
    ],
  },
];

export default function PrivacyPage() {
  const { locale } = useLocale();
  return (
    <LegalDocument
      title={{ ar: "سياسة الخصوصية وسرية البيانات", en: "Privacy Policy - Spare Parts Store" }}
      sections={sections}
      compliance={true}
      backLabel={{ ar: "العودة إلى التسجيل", en: "Back to Registration" }}
    />
  );
}
