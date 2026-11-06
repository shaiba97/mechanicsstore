"use client";

import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { useLocale } from "@/hooks/use-locale";

const sections: LegalSection[] = [
  {
    id: "general",
    title: { ar: "1. الأحكام العامة", en: "1. General Conditions" },
    body: [
      {
        ar:
          "هذه الشروط والأحكام ت govern استخدام منصة ميكانيكا لقطع الغيار automotiven («المنصة») من قبل التجار («المتجر») الراغبين في عرض وبيع قطع الغيار الخاصة بالسيارات في المملكة العربية السعودية.",
        en:
          "These Terms of Use govern the use of the Mechanics Spare Parts Platform («the Platform») by merchants («the Store») wishing to list and sell automotive spare parts in the Kingdom of Saudi Arabia.",
      },
      {
        ar: "بإنشاء حساب المتجر والموافقة على هذه الشروط، يلتزم المتجر بجميع الأحكام الواردة أدناه، بما في ذلك سياسات الخصوصية和平台 العمولة.",
        en:
          "By creating a store account and accepting these terms, the Store agrees to all provisions below, including the Privacy Policy and platform commission rules.",
      },
    ],
  },
  {
    id: "responsibilities",
    title: { ar: "2. مسؤوليات المتجر وقواعد السوق", en: "2. Merchant Responsibilities & Marketplace Rules" },
    body: [
      {
        ar:
          "يجب على المتجر إدراج قطع غيار أصلية (OEM) أو من Marktج بديلة بدقة، مع وصف حقيقي لتوافق القطعة مع موديلات السيارات، ومستويات المخزون المحدثة في الوقت الحقيقي، وصور أصلية للقطع المعروضة.",
        en:
          "The Store must list original (OEM) or aftermarket parts accurately, with a true description of part fitment for vehicle models, real-time stock levels, and authentic photos of the parts offered.",
      },
      {
        ar: "يمنع منعاً باتاً إدراج قطع مقلدة أو غير مطابقة للوصف، ويتحمل المتجر مسؤولية أي شكوى عميل ناتجة عن عدم دقة المعلومات أو عدم توفر القطعة.",
        en:
          "Listing counterfeit or misdescribed parts is strictly prohibited. The Store is responsible for any customer complaint resulting from inaccurate information or part unavailability.",
      },
    ],
  },
  {
    id: "compliance",
    title: { ar: "3. الامتثال القانوني في السعودية", en: "3. KSA Legal Compliance" },
    body: [
      {
        ar:
          "يجب على المتجرholding السجل التجاري (CR) ساري المفعول يتكون من 10 أرقام، والتسجيل في ضريبة القيمة المضافة (ZATCA) برقم ضريبي مكون من 15 رقماً، وإصدار الفواتير الإلكترونية وفقاً لأنظمة المملكة.",
        en:
          "The Store must hold a valid Commercial Registration (CR) of 10 digits, register for ZATCA VAT with a 15-digit tax number, and issue electronic invoices in accordance with KSA regulations.",
      },
      {
        ar: "يتحمل المتجر مسؤولية تجديد تراخيصه وضبطه 운영 وفقاً لأنظمة التجارة السعودية وقوانين حماية المستهلك.",
        en:
          "The Store is responsible for renewing its licenses and operating in accordance with Saudi trade laws and consumer protection regulations.",
      },
    ],
  },
  {
    id: "commission",
    title: { ar: "4. عمولة المنصة والتأجيل 7 أيام للدفعات", en: "4. Platform Commission & 7-Day Payout Escrow" },
    body: [
      {
        ar:
          "تقوم المنصة بخصم عمولة بنسبة 10% من قيمة كل طلب مكتمل قبل تحويل المبلغ إلى الحساب البنكي للمتجر.",
        en:
          "The Platform deducts a 10% commission fee from the value of each completed order before transferring the remaining amount to the Store's bank account.",
      },
      {
        ar:
          "يتم حجز المبالغ المستحقة للمتجر لمدة 7 أيام بعد تأكيد تسليم الطلب (استلام رمز OTP من العميل) قبل أهلية الدفع إلى الحساب البنكي السعودي (IBAN يبدأ بـ SA متبوعاً بـ 22 رقم).",
        en:
          "Amounts due to the Store are held for 7 days after delivery confirmation (customer 4-digit OTP receipt) before payout eligibility to the Store's Saudi IBAN (SA + 22 digits).",
      },
    ],
  },
  {
    id: "otp",
    title: { ar: "5. التسليم الذاتي ورمز OTP", en: "5. Self-Delivery & OTP Handover" },
    body: [
      {
        ar:
          "يلتزم سائق المتجر بجمع رمز الت확يك (OTP) المكون من 4 أرقام من العميل وتسليمه إلى المنصة قبل أن يصبح المبلغ مؤهلاً للدفع.",
        en:
          "The Store driver must collect the customer's 4-digit OTP code and submit it to the Platform before the amount becomes eligible for payout.",
      },
      {
        ar: "بدون تقديم رمز OTP صالح، لا يعتبر الطلب مسَلَماً ولا يستحق المتجر الدفعة المقابلة.",
        en:
          "Without a valid OTP, the order is not considered delivered and the Store is not entitled to the corresponding payout.",
      },
    ],
  },
  {
    id: "suspension",
    title: { ar: "6. الاحتيال والممارسات الخاطئة وتعليق الحساب", en: "6. Fraud, Misrepresentation & Account Suspension" },
    body: [
      {
        ar:
          "تحتسب المنصة إنهاء حساب المتجر فوراً في حالة بيع قطع مقلدة، أو استخدام علامات OEM مزيفة، أو التأخير المتكرر في التسليم، أو التلاعب برموز OTP.",
        en:
          "The Platform may terminate the Store account immediately upon selling counterfeit parts, using fake OEM tags, repeated delivery delays, or OTP manipulation.",
      },
      {
        ar: "قرارات الإنهاء نهائية وغير قابلة للاستئناف، ويبقى المتجر مسؤولاً عن أي مبالغ مستحقة للعملاء أو المنصة.",
        en:
          "Termination decisions are final and non-appealable. The Store remains liable for any amounts owed to customers or the Platform.",
      },
    ],
  },
];

export default function TermsPage() {
  const { locale } = useLocale();
  return (
    <LegalDocument
      title={{ ar: "شروط وأحكام استخدام متجر قطع الغيار", en: "Terms of Use - Spare Parts Store" }}
      sections={sections}
      compliance={false}
      backLabel={{ ar: "العودة إلى التسجيل", en: "Back to Registration" }}
    />
  );
}
