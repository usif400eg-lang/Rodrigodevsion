import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

const CLAUSES = [
  {
    icon: Lock,
    title: "1. حماية بيانات تسجيل الدخول (Konami ID)",
    desc: "بيانات حسابك (البريد الإلكتروني وكلمة المرور) يتم التعامل معها بأقصى درجات السرية التامة. لا يتم تخزين كلمات المرور كنصوص واضحة في أي سجلات عامة، ولا يطلع عليها سوى اللاعب المحترف المخصص لطلبك أثناء مدة اللعب فقط.",
  },
  {
    icon: Database,
    title: "2. المعلومات التي نقوم بجمعها",
    desc: "نقوم بجمع الحد الأدنى من المعلومات اللازمة لإتمام وتأكيد طلبك: الاسم أو اللقب، رقم الواتساب لمتابعة التحديثات، والديفيجن أو اللاعب المستهدف. لا نطلب أي بيانات بنكية أو بطاقات ائتمانية حساسة على موقعنا.",
  },
  {
    icon: UserCheck,
    title: "3. عدم مشاركة أو بيع البيانات",
    desc: "نلتزم التزاماً قاطعاً بعدم بيع أو تأجير أو مشاركة أي من بيانات عملائنا مع أي جهة تسويقية أو طرف ثالث تحت أي ظرف من الظروف.",
  },
  {
    icon: ShieldCheck,
    title: "4. مسح الجلسة بعد إنجاز الخدمة",
    desc: "بمجرد وصول حسابك للهدف المطلوب (مثل الديفيجن 1 أو الحصول على اللاعب)، يقوم اللاعب المحترف بتسجيل الخروج الفوري ومسح أي بيانات مؤقتة مرتبطة بالجلسة.",
  },
];

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1">
        {/* ── Header ── */}
        <section className="py-14 sm:py-20 bg-gradient-to-b from-surface via-bg to-bg border-b border-border/80">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-extrabold text-primary mb-4">
              <ShieldCheck className="size-3.5" />
              <span>خصوصية وسرية بياناتك أمانة</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              سياسة الخصوصية
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-lg mx-auto leading-relaxed">
              توضح هذه السياسة كيفية تعاملنا مع بياناتك وحمايتها بما يضمن أعلى درجات الخصوصية والأمان لحسابك.
            </p>
          </div>
        </section>

        {/* ── Content ── */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 space-y-6">
            {CLAUSES.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={i}
                  className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm flex items-start gap-5"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black mb-2 text-fg">
                      {c.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted leading-relaxed font-medium">
                      {c.desc}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Practical Advice */}
            <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
              <h3 className="text-base font-extrabold mb-3 text-fg">
                نصائح أمان لحساب Konami ID الخاص بك:
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-muted font-medium list-disc list-inside leading-relaxed">
                <li>قم بتغيير كلمة المرور فور إعلامك باكتمال تنفيذ الطلب.</li>
                <li>تأكد من أن بريدك الإلكتروني المرتبط بحساب Konami محمي وموثق بكلمة مرور قوية.</li>
                <li>لا تشارك كود التحقق الثنائي (2FA) إلا مع قناة الدعم الرسمية الخاصة بـ Rodrigo Divsion.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
