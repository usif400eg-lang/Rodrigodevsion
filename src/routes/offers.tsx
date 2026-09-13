import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, Flame, Gift, Percent, Sparkles, Star, Tag, Zap } from "lucide-react";
import { useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/offers")({
  component: OffersPage,
});

const OFFERS = [
  {
    id: "bundle-div1",
    title: "باقة الديفيجن الأول الشاملة",
    badge: "الأكثر توفيراً 🔥",
    discount: "خصم 30%",
    price: "450",
    oldPrice: "650",
    currency: "ج.م",
    duration: "أقل من 12 ساعة",
    desc: "ارتقاء كامل من أي رتبة حالية حتى الوصول للديفيجن 1 مع ضمان الحفاظ على الرتبة وتأمين 5 انتصارات متتالية.",
    features: [
      "رفع مباشر ومضمون للديفيجن الأول",
      "لعب يدوي بواسطة أفضل مصنفي السيرفر",
      "تأمين جوائز الفعاليات الأسبوعية مجاناً",
      "متابعة لحظية ومباشرة للطلب",
    ],
    highlight: true,
  },
  {
    id: "bundle-legend",
    title: "باقة أساطير الـ Epic والـ Showtime",
    badge: "عرض خاص ⭐",
    discount: "خصم 25%",
    price: "350",
    oldPrice: "480",
    currency: "ج.م",
    duration: "خلال 6 ساعات",
    desc: "احصل على لاعب أحلامك المضمون بالإضافة إلى ضبط وتطوير الطاقات والمهارات التكتيكية بأفضل توزيعة احترافية.",
    features: [
      "ضمان استخراج لاعب الحزمة المستهدف",
      "تطوير طاقات اللاعب لأقصى تقييم ممكن (Max OVR)",
      "إضافة 5 مهارات خاصة (Skills) متناسقة مع مركزه",
      "ضمان تعويض كامل إن لم يظهر اللاعب",
    ],
    highlight: false,
  },
  {
    id: "bundle-season-finish",
    title: "باقة حسم الموسم والتصنيف العالمي",
    badge: "للمحترفين 🏆",
    discount: "خصم 20%",
    price: "590",
    oldPrice: "750",
    currency: "ج.م",
    duration: "24 ساعة قبل نهاية الموسم",
    desc: "تأمين موقعك ضمن قائمة Top 1000 أو Top 500 في الديفيجن الأول لحصد أفضل شارات وجوائز نهاية الموسم.",
    features: [
      "تثبيت النقاط والتصنيف العالي",
      "معدل فوز قياسي يفوق 95%",
      "فريق دعم مخصص لحسابك حتى إغلاق الموسم",
      "تقرير تحليلي لأداء الفريق ونقاط القوة",
    ],
    highlight: false,
  },
];

function OffersPage() {
  const [copied, setCopied] = useState(false);
  const couponCode = "RODRIGO15";

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1">
        {/* ── Header ── */}
        <section className="py-14 sm:py-20 bg-gradient-to-b from-surface via-bg to-bg border-b border-border/80">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-warn/10 border border-warn/20 px-4 py-1.5 text-xs font-extrabold text-warn mb-4">
              <Flame className="size-3.5" />
              <span>عروض وخصومات حصرية ولفترة محدودة</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              عروض وباقات <span className="text-primary">Rodrigo Divsion</span>
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-lg mx-auto leading-relaxed mb-8">
              وفر أكثر مع باقاتنا المجمعة المصممة لتمنح حسابك أفضل أداء بأقل تكلفة.
            </p>

            {/* Coupon Box */}
            <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
                  <Percent className="size-5" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-muted">كوبون خصم إضافي:</div>
                  <div className="font-mono text-base font-black text-primary tracking-wider" dir="ltr">
                    {couponCode}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-black text-white hover:bg-primary-strong transition shadow-sm"
              >
                {copied ? "تم النسخ ✓" : "نسخ الكوبون"}
              </button>
            </div>
          </div>
        </section>

        {/* ── Offers Grid ── */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-8 md:grid-cols-3 items-stretch">
              {OFFERS.map((o) => (
                <div
                  key={o.id}
                  className={`relative flex flex-col justify-between rounded-3xl bg-white p-7 transition duration-300 ${
                    o.highlight
                      ? "border-2 border-primary shadow-xl shadow-primary/10 -translate-y-2"
                      : "border border-border shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`rounded-full px-3.5 py-1 text-xs font-black ${
                        o.highlight
                          ? "bg-warn text-white shadow-sm"
                          : "bg-surface text-primary border border-primary/20"
                      }`}
                    >
                      {o.badge}
                    </span>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-extrabold text-emerald-700">
                      {o.discount}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-black mb-2 text-fg">{o.title}</h2>
                    <p className="text-xs text-muted leading-relaxed mb-6 font-medium">
                      {o.desc}
                    </p>

                    {/* Features list */}
                    <ul className="space-y-3 mb-8 border-t border-b border-border/60 py-5">
                      {o.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-xs text-fg font-medium">
                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <Check className="size-2.5 stroke-[3]" />
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    {/* Price and duration */}
                    <div className="mb-5 flex items-center justify-between rounded-2xl bg-surface p-4">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-primary">{o.price}</span>
                          <span className="text-xs font-bold text-muted">{o.currency}</span>
                          <span className="text-xs text-muted line-through mr-1 font-medium">
                            {o.oldPrice}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                        <Clock className="size-3.5 text-muted" />
                        <span>{o.duration}</span>
                      </div>
                    </div>

                    <Link
                      to="/order"
                      className={`w-full min-h-12 items-center justify-center rounded-2xl text-sm font-extrabold flex shadow-md transition ${
                        o.highlight
                          ? "bg-primary text-white hover:bg-primary-strong shadow-primary/25"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      اطلب هذا العرض الآن
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
