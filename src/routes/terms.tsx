import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, FileText, HelpCircle, ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

const SECTIONS = [
  {
    id: "general",
    title: "1. المقدمة وقبول الشروط",
    content: `باستخدامك لمنصة Rodrigo Divsion وطلبك لأي من خدماتنا (رفع الديفيجن، ضمان اللاعبين، أو تطوير الطاقات)، فإنك تقر وتوافق على الالتزام الكامل بهذه الشروط والأحكام. إذا كنت لا توافق على أي بند منها، يرجى عدم تقديم أي طلب.`,
  },
  {
    id: "services",
    title: "2. آلية تقديم وتنفيذ الخدمات",
    content: `• يتم تنفيذ جميع خدمات اللعب بواسطة لاعبين محترفين ومعتمدين بشكل يدوي 100% دون أي برامج طرف ثالث أو أدوات غير مصرح بها.
• تبدأ مدة التنفيذ فور تأكيد الدفع واستلام بيانات الحساب الصحيحة.
• الأوقات المحددة للخدمات هي أوقات تقديرية قد تتأثر بظروف صيانة سيرفرات Konami أو تحديثات اللعبة الطارئة.`,
  },
  {
    id: "account-safety",
    title: "3. سرية وأمان بيانات الحساب (Konami ID)",
    content: `• يلتزم فريق Rodrigo Divsion بالحفاظ على سرية بياناتك (البريد الإلكتروني وكلمة المرور) وعدم مشاركتها مع أي طرف ثالث.
• يتم استخدام بيانات الحساب لغرض إنجاز الخدمة المطلوبة حصراً، ويتم تسجيل الخروج الفوري فور الانتهاء.
• يُنصح العميل بتغيير كلمة المرور الخاصة بحسابه بعد استلامه لطلبه كإجراء أمان روتيني إضافي.`,
  },
  {
    id: "refund",
    title: "4. سياسة الإلغاء واسترجاع الأموال",
    content: `• يحق للعميل استرجاع كامل المبلغ إذا لم يبدأ العمل على طلبه خلال المدة المحددة ولم تكن هناك أسباب قاهرة.
• في حال تعذر الوصول إلى الديفيجن أو الهدف المطلوب لأسباب تعود للفريق، يحصل العميل على تعويض كامل أو استرداد نسبي حسب ما تم إنجازه.
• لا يمكن إلغاء الطلب أو استرداد المبلغ بعد بدء اللاعب المحترف في خوض المباريات بالفعل.`,
  },
  {
    id: "customer-obligations",
    title: "5. التزامات العميل",
    content: `• يلتزم العميل بعدم تسجيل الدخول إلى حسابه أثناء فترة سريان تنفيذ الطلب لتفادي قطع الاتصال على اللاعب المحترف وإلغاء المباريات.
• تزويدنا ببيانات صحيحة ودقيقة لوسائل التواصل (الواتساب) لمتابعة التحديثات وأكواد التحقق الثنائي (2FA) إن وجدت.`,
  },
];

function TermsPage() {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1">
        {/* ── Header ── */}
        <section className="py-14 sm:py-20 bg-gradient-to-b from-surface via-bg to-bg border-b border-border/80">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-extrabold text-primary mb-4">
              <FileText className="size-3.5" />
              <span>اتفاقية الاستخدام القانونية</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              الشروط والأحكام
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-lg mx-auto leading-relaxed">
              آخر تحديث: سبتمبر 2026 • توضح هذه الاتفاقية الحقوق والالتزامات المتبادلة لضمان تجربة آمنة وموثوقة.
            </p>
          </div>
        </section>

        {/* ── Content ── */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 space-y-8">
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 flex items-start gap-4">
              <ShieldCheck className="size-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="text-base font-extrabold text-primary mb-1">
                  ضمان الأمان واللعب اليدوي النظيف
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed font-medium">
                  نحن في Rodrigo Divsion نطبق مبدأ الشفافية المطلقة. جميع خدمات رفع الحسابات وضمان اللاعبين تتم بنزاهة واحتراف بواسطة أمهر اللاعبين وبدون أي مخاطرة على حسابك.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {SECTIONS.map((sec) => (
                <div
                  key={sec.id}
                  className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm"
                >
                  <h2 className="text-lg sm:text-xl font-black mb-4 text-fg">
                    {sec.title}
                  </h2>
                  <div className="text-xs sm:text-sm text-muted leading-relaxed font-medium whitespace-pre-line">
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Questions Note */}
            <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 text-center">
              <HelpCircle className="size-8 text-primary mx-auto mb-3" />
              <h3 className="text-base font-extrabold mb-2">لديك سؤال أو استفسار حول الشروط؟</h3>
              <p className="text-xs text-muted max-w-md mx-auto mb-6">
                فريق الدعم الفني متواجد للإجابة عن أي استفسارات قانونية أو توضيح أي نقطة غير واضحة.
              </p>
              <Link
                to="/contact"
                className="btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-7 text-xs font-extrabold shadow-sm"
              >
                تواصل مع الدعم الفني
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
