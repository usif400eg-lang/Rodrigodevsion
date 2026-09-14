import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SERVICES } from "@/lib/catalog";
import { db } from "@/lib/firebase";
import type { ServiceDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/services/$id")({
  component: ServiceDetailsPage,
});

const DEFAULT_REVIEWS = [
  {
    name: "عمر خالد",
    rating: 5,
    date: "منذ يومين",
    comment: "وصلني حسابي للديفيجن 1 في أقل من 5 ساعات وبدون أي هزيمة! احترافية وأمان غير طبيعي.",
  },
  {
    name: "مصطفى السيد",
    rating: 5,
    date: "منذ 4 أيام",
    comment: "ضمنت نيمار الإيبك من أول محاولة ووصلتني كل لقطات التفتيح أول بأول على الواتساب، شكراً كابتن رودريجو.",
  },
  {
    name: "كريم يوسف",
    rating: 5,
    date: "منذ أسبوع",
    comment: "تعامل في قمة الاحترام وسرعة فائقة في الرد والتسليم، أنصح أي لاعب يجرب بدون تردد.",
  },
];

function ServiceDetailsPage() {
  const { id } = Route.useParams();
  const [service, setService] = useState<ServiceDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const snap = await getDoc(doc(db, "services", id));
        if (snap.exists()) {
          const data = snap.data() as ServiceDoc;
          setService({
            ...data,
            id: snap.id,
            images: data.images ?? [],
          });
          return;
        }
      } catch (e) {
        console.warn("Firestore fetch error, checking default catalog:", e);
      }

      // Check default catalog
      const found = SERVICES.find((s) => s.id === id);
      if (found) {
        setService({
          ...found,
          featured: false,
          active: true,
          sortOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setLoading(false);
    };

    void fetchService();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-bg flex flex-col justify-between">
        <SiteHeader />
        <div className="py-24 text-center px-4">
          <h2 className="text-2xl font-black mb-3">الخدمة غير موجودة أو تم نقلها</h2>
          <p className="text-xs text-muted mb-6">يرجى العودة إلى كتالوج الخدمات وتصفح العروض المتاحة</p>
          <Link to="/services" className="btn-primary inline-flex min-h-11 items-center px-6 rounded-2xl text-xs font-bold">
            العودة للكتالوج
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1 py-10 sm:py-16 bg-gradient-to-b from-surface/40 via-bg to-bg">
        <div className="mx-auto max-w-5xl px-4">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs mb-6 text-muted font-bold">
            <Link to="/" className="hover:text-primary">الرئيسية</Link>
            <span>/</span>
            <Link to="/services" className="hover:text-primary">الخدمات</Link>
            <span>/</span>
            <span className="text-primary">{service.name}</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 items-start">
            
            {/* Left/Main Column: Image & Details (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Full Width Showcase Image */}
              <div className="relative w-full aspect-[16/10] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md flex items-center justify-center">
                <img
                  src={service.images?.[0] || "/badges/div-1.svg"}
                  alt={service.name}
                  className="size-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-white/40 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />

                {service.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-xs font-black text-white shadow-lg shadow-orange-500/30">
                      <span>⭐</span>
                      <span>{service.badge}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Service Info and Description */}
              <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm">
                <h1 className="text-2xl sm:text-3xl font-black text-fg mb-3">
                  {service.name}
                </h1>
                <p className="text-sm text-muted leading-relaxed font-medium mb-6">
                  {service.description}
                </p>

                {/* Guarantees List */}
                <div className="grid gap-3 sm:grid-cols-2 pt-6 border-t border-border">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-fg">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>لعب يدوي نظيف 100% بدون أي مودات</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-fg">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>أمان وسرية تامة لحساب Konami ID</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-fg">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>متابعة تقدم الطلب مباشرة على الموقع</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-fg">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>ضمان استرجاع كامل المبلغ عند التعذر</span>
                  </div>
                </div>
              </div>

              {/* Customer Reviews Section */}
              <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-5 text-primary" />
                    <h2 className="text-lg font-black text-fg">تقييمات وآراء العملاء</h2>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                    <span className="text-xs font-black text-fg mr-1">5.0 (48 تقييم)</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {DEFAULT_REVIEWS.map((rev, idx) => (
                    <div key={idx} className="rounded-2xl border border-border/80 bg-surface/50 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-fg">{rev.name}</span>
                        <span className="text-[10px] text-muted">{rev.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="size-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs text-muted leading-relaxed font-medium">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Pricing & Order Box (5 cols) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              
              <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-lg space-y-6">
                <div>
                  <span className="text-xs font-bold text-muted">سعر الخدمة الإجمالي</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-primary">{service.price}</span>
                    <span className="text-sm font-bold text-muted">{service.currency}</span>
                    {service.oldPrice && (
                      <span className="text-sm text-muted line-through mr-2">
                        {service.oldPrice} {service.currency}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 py-4 border-t border-b border-border text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">المدة المقدرة للتنفيذ:</span>
                    <span className="font-extrabold text-fg flex items-center gap-1">
                      <Clock className="size-3.5 text-primary" />
                      <span>{service.estimatedTime}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">نوع الخدمة:</span>
                    <span className="font-extrabold text-fg">
                      {service.type === "division_boost" ? "رفع رتبة وتصنيف" : "ضمان وتفتيح لاعبين"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">الدعم والمتابعة:</span>
                    <span className="font-extrabold text-ok">متاح 24/7 عبر الموقع</span>
                  </div>
                </div>

                <Link
                  to="/order"
                  search={{ service: service.id }}
                  className="btn-cta w-full min-h-12 items-center justify-center rounded-2xl text-base font-black shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition flex gap-2"
                >
                  <Zap className="size-4" />
                  <span>اطلب هذه الخدمة الآن</span>
                </Link>

                <div className="flex items-center justify-center gap-2 text-[11px] text-muted text-center pt-2">
                  <ShieldCheck className="size-4 text-primary shrink-0" />
                  <span>دفع آمن بالكامل مع ضمان استرداد الأموال</span>
                </div>
              </div>

              {/* Quick Questions Card */}
              <div className="rounded-3xl border border-primary/20 bg-surface p-6 text-center">
                <h3 className="text-sm font-extrabold mb-1">لديك استفسار قبل الطلب؟</h3>
                <p className="text-xs text-muted mb-4">
                  تواصل مع خدمة العملاء عبر الواتساب للاستفسار عن أي تفاصيل.
                </p>
                <a
                  href="https://wa.me/201018593455"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-border bg-white px-5 py-2 text-xs font-bold text-fg hover:border-emerald-500 hover:text-emerald-600 transition inline-block shadow-sm"
                >
                  استفسار عبر واتساب
                </a>
              </div>

            </div>

          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
