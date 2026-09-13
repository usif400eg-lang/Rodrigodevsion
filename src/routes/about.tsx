import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, CheckCircle2, ShieldCheck, Trophy, Users, Zap } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

const STATS = [
  { value: "+5,000", label: "طلب تم تنفيذه بنجاح" },
  { value: "100%", label: "ضمان الأمان والسرية" },
  { value: "+1,200", label: "عميل دائم وموثوق" },
  { value: "ديفيجن 1", label: "كادر لاعبين محترفين" },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "أمان الحساب بنسبة 100%",
    desc: "نلتزم بأعلى معايير الحماية لبيانات Konami ID مع تشفير كامل وخروج فوري بعد إنهاء أي خدمة.",
  },
  {
    icon: Trophy,
    title: "لاعبون مصنفون عالمياً",
    desc: "فريقنا مكون من نخبة لاعبي ديفيجن 1 أصحاب تصنيفات متقدمة لضمان الفوز في أسرع وقت وبأعلى معدلات كفاءة.",
  },
  {
    icon: Zap,
    title: "سرعة استثنائية في التسليم",
    desc: "نبدأ بالعمل على طلبك خلال دقائق من تأكيد الدفع، مع إمكانية متابعة تقدم طلبك مباشرة أولاً بأول.",
  },
  {
    icon: Award,
    title: "ضمان تعويض وحماية كاملة",
    desc: "نضمن حصولك على النتيجة المطلوبة بالكامل في رفع الديفيجن أو حصد اللاعبين أو استرجاع كامل المبلغ.",
  },
];

const TEAM = [
  {
    name: "Rodrigo",
    role: "المؤسس وكبير اللاعبين المحترفين",
    badge: "Top 50 Global",
    desc: "متخصص في رفع الديفيجن والتصنيفات العالية وضمان اللاعبين النادرين بخبرة تفوق 4 سنوات في eFootball.",
  },
  {
    name: "Shadow",
    role: "خبير خطط وتطوير الطاقات",
    badge: "Top 100 Division 1",
    desc: "خبير في بناء التشكيلات التكتيكية واستخراج أقصى طاقات بطاقات الـ Epic والـ Showtime.",
  },
  {
    name: "Fighter",
    role: "كابتن مهام التحديات والفعاليات",
    badge: "Division 1 Champion",
    desc: "متخصص في إنهاء الفعاليات الصعبة وتحديات الأحداث الأسبوعية بأسرع وقت وأقل جهد على العميل.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-surface via-bg to-bg border-b border-border/80">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-extrabold text-primary mb-6">
              <Users className="size-3.5" />
              <span>من نحن • قصتنا ورؤيتنا</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
              الوجهة الأولى والأكثر موثوقية <br className="hidden sm:inline" />
              <span className="text-primary">لخدمات eFootball Mobile الاحترافية</span>
            </h1>
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted leading-relaxed font-medium">
              تأسست Rodrigo Divsion برؤية واحدة: تمكين عشاق لعبة eFootball في العالم العربي
              من الوصول إلى أعلى المستويات والتصنيفات التنافسية، وامتلاك أقوى التشكيلات
              بأمان تام واحترافية لا تضاهى.
            </p>
          </div>
        </section>

        {/* ── Stats Grid ── */}
        <section className="py-12 border-b border-border/60 bg-white">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/70 bg-surface p-6 text-center shadow-sm"
                >
                  <div className="text-3xl sm:text-4xl font-black text-primary mb-1 tracking-tight">
                    {s.value}
                  </div>
                  <div className="text-xs font-bold text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Our Core Values ── */}
        <section className="py-16 sm:py-20 bg-bg">
          <div className="mx-auto max-w-5xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black mb-3">لماذا يختارنا أبطال eFootball؟</h2>
              <p className="text-sm text-muted max-w-lg mx-auto">
                قيم أساسية بنينا عليها ثقة آلاف اللاعبين في كافة أرجاء الوطن العربي
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {VALUES.map((v, i) => {
                const Icon = v.icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-4 rounded-3xl border border-border bg-white p-6 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black mb-1.5">{v.title}</h3>
                      <p className="text-xs sm:text-sm text-muted leading-relaxed font-medium">
                        {v.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Team Section ── */}
        <section className="py-16 sm:py-20 bg-surface/50 border-t border-border/70">
          <div className="mx-auto max-w-5xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black mb-3">فريق اللاعبين المحترفين</h2>
              <p className="text-sm text-muted max-w-lg mx-auto">
                نخبة من أمهر لاعبي الساحة التنافسية الذين يقودون حسابك نحو القمة
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {TEAM.map((t, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-3xl border border-border bg-white p-6 shadow-sm hover:border-primary/40 hover:-translate-y-1 transition duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white font-black text-lg shadow-md shadow-primary/20">
                        {t.name[0]}
                      </div>
                      <span className="rounded-full bg-warn/10 border border-warn/20 px-3 py-1 text-[11px] font-extrabold text-warn">
                        {t.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-black mb-1">{t.name}</h3>
                    <div className="text-xs font-bold text-primary mb-3">{t.role}</div>
                    <p className="text-xs text-muted leading-relaxed font-medium">
                      {t.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-16 bg-bg border-t border-border/80">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-strong p-8 sm:p-12 text-white shadow-xl">
              <h2 className="text-2xl sm:text-4xl font-black mb-4">
                جاهز للارتقاء بحسابك إلى الديفيجن الأول؟
              </h2>
              <p className="mx-auto max-w-xl text-xs sm:text-sm text-purple-100/90 leading-relaxed mb-8">
                اختر الخدمة المناسبة لحسابك أو استكشف باقات تطوير اللاعبين المتاحة الآن وابدأ رحلتك فوراً.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/order"
                  className="rounded-2xl bg-white px-8 py-3 text-sm font-extrabold text-primary hover:bg-slate-50 transition shadow-md"
                >
                  اطلب الآن
                </Link>
                <Link
                  to="/upgrades"
                  className="rounded-2xl border-2 border-white/40 px-8 py-3 text-sm font-extrabold text-white hover:bg-white/10 transition"
                >
                  تطويرات اللاعبين
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
