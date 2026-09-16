import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, Flame, Gift, Percent, Sparkles, Star, Tag, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { CouponDoc, OfferDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/offers")({
  component: OffersPage,
});

const DEFAULT_OFFERS: OfferDoc[] = [
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
    active: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
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
    active: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
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
    active: true,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
  },
];

function OffersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [offers, setOffers] = useState<OfferDoc[]>(DEFAULT_OFFERS);
  const [coupons, setCoupons] = useState<CouponDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial local cache check
    if (typeof window !== "undefined") {
      try {
        const localOffers = localStorage.getItem("rodrigo_custom_offers_v1");
        if (localOffers) {
          const parsed = JSON.parse(localOffers) as OfferDoc[];
          const filtered = parsed.filter((o) => o.active !== false);
          if (filtered.length > 0) setOffers(filtered);
        }
        const localCoupons = localStorage.getItem("rodrigo_custom_coupons_v1");
        if (localCoupons) {
          const parsedC = JSON.parse(localCoupons) as CouponDoc[];
          const filteredC = parsedC.filter((c) => c.active !== false);
          if (filteredC.length > 0) setCoupons(filteredC);
        }
      } catch (e) {
        console.warn("Error reading local cache for offers:", e);
      }
    }

    // Load Offers
    const unsubOffers = onSnapshot(
      collection(db, "offers"),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => ({ ...d.data(), id: d.id }) as OfferDoc)
            .filter((o) => o.active !== false)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          if (list.length > 0) setOffers(list);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    // Load active coupons
    const unsubCoupons = onSnapshot(
      collection(db, "coupons"),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => ({ ...d.data(), id: d.id }) as CouponDoc)
            .filter((c) => c.active !== false);
          setCoupons(list);
        }
      },
      (err) => console.warn("Coupons fetch error:", err)
    );

    return () => {
      unsubOffers();
      unsubCoupons();
    };
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const primaryCoupon = coupons.length > 0 ? coupons[0] : { code: "RODRIGO15", discount: 15 };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1">
        {/* ── Header ── */}
        <section className="hero-glow mesh-cyber-grid py-14 sm:py-20 border-b border-white/10">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-warn/15 border border-warn/30 px-4 py-1.5 text-xs font-black text-warn mb-4 shadow-[0_0_15px_rgba(234,88,12,0.3)]">
              <Flame className="size-3.5" />
              <span>عروض وباقات eFootball الحصرية</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 text-white">
              عروض وباقات <span className="gradient-text-esports">Rodrigo Division</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed mb-8 font-medium">
              وفر أكثر مع باقاتنا التنافسية المجمعة المصممة لتمنح حسابك أفضل تصنيف بأعلى سرعة وأقل تكلفة.
            </p>

            {/* Coupon Box */}
            <div className="mx-auto max-w-md rounded-3xl border-2 border-dashed border-primary/50 bg-primary/10 p-4 flex items-center justify-between shadow-[0_0_30px_rgba(139,92,246,0.2)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                  <Percent className="size-5" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400">
                    كوبون خصم إضافي ({primaryCoupon.discount}%):
                  </div>
                  <div className="font-mono text-base font-black text-cyan-300 tracking-wider" dir="ltr">
                    {primaryCoupon.code}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(primaryCoupon.code)}
                className="btn-primary rounded-2xl px-4 py-2.5 text-xs font-black shadow-md"
              >
                {copiedCode === primaryCoupon.code ? "تم النسخ ✓" : "نسخ الكوبون"}
              </button>
            </div>

            {/* Other Coupons Pill Strip if available */}
            {coupons.length > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-slate-400 font-bold">كوبونات أخرى متاحة:</span>
                {coupons.slice(1).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCopy(c.code)}
                    className="inline-flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 px-3 py-1 text-xs font-mono font-bold text-slate-200 hover:border-primary/50 hover:text-white transition"
                    title="اضغط لنسخ الكود"
                  >
                    <Tag className="size-3 text-cyan-400" />
                    <span>{c.code}</span>
                    <span className="text-[10px] text-amber-400 font-sans">({c.discount}%)</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Offers Grid ── */}
        <section className="py-14 sm:py-20 bg-[#090d16]">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-8 md:grid-cols-3 items-stretch">
              {offers.map((o) => (
                <div
                  key={o.id}
                  className={`card-3d relative flex flex-col justify-between rounded-[32px] p-7 transition duration-300 backdrop-blur-xl ${
                    o.highlight
                      ? "border-2 border-primary/70 bg-slate-900/80 shadow-[0_0_35px_rgba(139,92,246,0.25)] -translate-y-2 ring-1 ring-primary/40"
                      : "border border-white/10 bg-slate-900/50 shadow-xl hover:border-primary/40"
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`rounded-full px-3.5 py-1 text-xs font-black ${
                        o.highlight
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30"
                          : "bg-white/10 text-cyan-300 border border-white/10"
                      }`}
                    >
                      {o.badge || "باقة مميزة"}
                    </span>
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-black text-emerald-400">
                      {o.discount}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-black mb-2 text-white tracking-tight">{o.title}</h2>
                    <p className="text-xs text-slate-300 leading-relaxed mb-6 font-medium">
                      {o.desc}
                    </p>

                    {/* Features list */}
                    <ul className="space-y-3 mb-8 border-t border-b border-white/10 py-5">
                      {o.features?.map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-xs text-slate-200 font-medium">
                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Check className="size-2.5 stroke-[3]" />
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    {/* Price and duration */}
                    <div className="mb-5 flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                      <div>
                        <div className="flex items-baseline gap-1.5 font-black">
                          <span className="text-3xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">{o.price}</span>
                          <span className="text-xs text-slate-400">{o.currency}</span>
                          {o.oldPrice && (
                            <span className="text-xs text-slate-500 line-through mr-1 font-medium">
                              {o.oldPrice}
                            </span>
                          )}
                        </div>
                      </div>
                      {o.duration && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                          <Clock className="size-3.5 text-cyan-400" />
                          <span>{o.duration}</span>
                        </div>
                      )}
                    </div>

                    <Link
                      to="/order"
                      className="btn-cta w-full min-h-12 items-center justify-center rounded-2xl text-sm font-black flex shadow-lg transition hover:scale-[1.02]"
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

