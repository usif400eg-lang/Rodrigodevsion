import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clock,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, orderBy, query, where } from "firebase/firestore";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ServicesBoard } from "@/components/services-board";
import { db } from "@/lib/firebase";
import { seedFirestoreIfEmpty } from "@/lib/firebase-seed";
import type { FaqDoc, SiteSettingsDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [settings, setSettings] = useState<SiteSettingsDoc | null>(null);
  const [faq, setFaq] = useState<FaqDoc[]>([]);

  useEffect(() => {
    const load = async () => {
      // Seed on first visit (admin or permitted context)
      try {
        await seedFirestoreIfEmpty();
      } catch {
        // Expected if non-admin visitor
      }

      // Load site settings
      try {
        const snap = await getDoc(doc(db, "settings", "site"));
        if (snap.exists()) setSettings(snap.data() as SiteSettingsDoc);
      } catch (err) {
        console.warn("Could not load site settings:", err);
      }

      // Load FAQ
      try {
        const faqSnap = await getDocs(collection(db, "faq"));
        const list = faqSnap.docs
          .map((d) => d.data() as FaqDoc)
          .filter((f) => f.active !== false)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        if (list.length > 0) setFaq(list);
      } catch (err) {
        console.warn("Could not load FAQ:", err);
      }
    };
    void load();
  }, []);

  // Maintenance mode
  if (settings?.maintenanceMode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary text-2xl font-extrabold text-on-primary">
          R
        </div>
        <h1 className="mb-2 text-2xl font-extrabold">Rodrigo</h1>
        <p className="text-muted">{settings.maintenanceMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      {settings?.showHero !== false ? <Hero settings={settings} /> : null}
      {settings?.showTrustStrip !== false ? <TrustStrip /> : null}
      {settings?.showServices !== false ? <ServicesBoard /> : null}
      {settings?.showHowItWorks !== false ? <HowItWorks /> : null}
      {settings?.showFaq !== false ? <Faq items={faq} /> : null}
      {settings?.showCta !== false ? <Cta /> : null}
      <SiteFooter />
    </div>
  );
}

function Hero({ settings }: { settings: SiteSettingsDoc | null }) {
  return (
    <section className="hero-glow mesh-cyber-grid relative overflow-hidden px-4 pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className="text-center lg:text-right">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            متاح الآن • خدمة يدوية 100% بدون برامج
          </div>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl tracking-tight">
            {typeof settings?.heroHeadline === "string" && settings.heroHeadline.trim()
              ? settings.heroHeadline.split(".").map((part, i) =>
                i === 0 ? (
                  <span key={i} className="text-white">{part}.</span>
                ) : (
                  <span
                    key={i}
                    className="mt-2 block gradient-text-esports"
                  >
                    {part.trim()}
                  </span>
                ),
              )
              : (
                <>
                  <span className="text-white">العب أقل.</span>
                  <span className="mt-2 block gradient-text-esports drop-shadow-[0_0_25px_rgba(139,92,246,0.3)]">
                    وصل أكتر.
                  </span>
                </>
              )}
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-slate-300 lg:mx-0">
            {settings?.heroSub ??
              "خدمات احترافية لرفع الديفيجن وضمان اللاعبين في eFootball Mobile. كادر مصنفين عالمياً، سرعة في التنفيذ، وأمان تام لبياناتك."}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row lg:justify-start">
            <a
              href="#services"
              className="btn-cta inline-flex min-h-12 items-center justify-center rounded-2xl px-8 text-sm font-black shadow-lg"
            >
              استكشف الخدمات
            </a>
            <Link
              to="/track"
              className="btn-cyber-outline inline-flex min-h-12 items-center justify-center rounded-2xl px-8 text-sm font-extrabold transition shadow-xs"
            >
              تتبع طلبك
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-6 sm:gap-8 lg:justify-start">
            <Stat
              value={settings?.stat1Value ?? "+1200"}
              label={settings?.stat1Label ?? "طلب مكتمل"}
            />
            <span className="h-10 w-px bg-white/15" />
            <Stat
              value={settings?.stat2Value ?? "24/7"}
              label={settings?.stat2Label ?? "دعم فني"}
            />
            <span className="h-10 w-px bg-white/15" />
            <Stat
              value={settings?.stat3Value ?? "~18س"}
              label={settings?.stat3Label ?? "متوسط الإنجاز"}
            />
          </div>
        </div>

        {/* Hero 3D showcase card */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          {/* Ambient 3D Glow Backing */}
          <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-tr from-primary/40 via-cyan-500/25 to-amber-500/30 blur-3xl opacity-80 pointer-events-none" />

          <div className="card-3d float-3d relative overflow-hidden rounded-[32px] border border-white/15 bg-slate-950/80 p-3 sm:p-4 shadow-2xl backdrop-blur-2xl">
            {/* 3D Showcase Image */}
            <div className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden rounded-[26px] bg-slate-950">
              <img
                src="/3d/hero-3d.jpg"
                alt="eFootball 3D Mobile Showcase"
                className="size-full object-cover object-center transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

              {/* Top Floating 3D Badge */}
              <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between pointer-events-none">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-black/70 px-3 py-1.5 backdrop-blur-md border border-white/20 shadow-lg">
                  <img src="/3d/trophy-3d.jpg" alt="Trophy" className="size-6 rounded-full object-cover ring-2 ring-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  <span className="text-xs font-black text-amber-300">بطولات وديفيجن 1</span>
                </div>
                <span className="rounded-2xl bg-primary px-3.5 py-1.5 text-xs font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.6)] backdrop-blur-md border border-white/20">
                  eFootball 2026 ⚡
                </span>
              </div>

              {/* Bottom 3D Stats Glass Bar */}
              <div className="absolute bottom-3.5 inset-x-3.5 rounded-2xl bg-slate-950/85 p-3 sm:p-4 backdrop-blur-xl border border-white/15 text-white shadow-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <img src="/3d/shield-3d.jpg" alt="Shield" className="size-8 rounded-xl object-cover ring-1 ring-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]" />
                    <div>
                      <div className="text-sm font-black text-white">حماية وتشفير الحساب</div>
                      <div className="text-[11px] font-bold text-cyan-300">Konami ID آمن 100% بدون حظر</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-black text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                    مباشر ومضمون
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/10">
                  <div className="rounded-xl bg-white/5 py-1.5 border border-white/5">
                    <div className="text-sm font-black text-amber-400">99.8%</div>
                    <div className="text-[10px] text-slate-300 font-medium">معدل الفوز</div>
                  </div>
                  <div className="rounded-xl bg-white/5 py-1.5 border border-white/5">
                    <div className="text-sm font-black text-cyan-400">&lt; 4 ساعات</div>
                    <div className="text-[10px] text-slate-300 font-medium">سرعة البدء</div>
                  </div>
                  <div className="rounded-xl bg-white/5 py-1.5 border border-white/5">
                    <div className="text-sm font-black text-purple-400">+5000</div>
                    <div className="text-[10px] text-slate-300 font-medium">حساب ناجح</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-black tabular-nums text-white tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]">{value}</div>
      <div className="text-xs font-bold text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    { img: "/3d/shield-3d.jpg", t: "حماية وتشفير 100%", sub: "حساب Konami ID بأمان تام" },
    { img: "/3d/trophy-3d.jpg", t: "ضمان بلوغ الديفيجن 1", sub: "كادر محترفين مصنفين عالمياً" },
    { img: "/3d/booster-3d.jpg", t: "سرعة تسليم فائقة", sub: "بدء فوري ومتابعة خطوة بخطوة" },
    { img: "/3d/crown-3d.jpg", t: "ضمان حصد اللاعبين VIP", sub: "تفتيح بطاقات الإيبك والشوتيم" },
  ];
  return (
    <section className="border-y border-white/10 bg-[#0c1220] py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-4">
        {items.map((i) => (
          <div
            key={i.t}
            className="group flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-md hover:border-primary/50 hover:bg-white/[0.06] hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition duration-300"
          >
            <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl border border-white/15 shadow-sm group-hover:scale-110 transition duration-300">
              <img src={i.img} alt={i.t} className="size-full object-cover" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-white">{i.t}</div>
              <div className="text-[11px] font-bold text-slate-400">{i.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "1", t: "اختر الخدمة", d: "اختر نوع الخدمة المناسبة (ديفيجن أو ضمان لاعب)", img: "/3d/crown-3d.jpg" },
    { n: "2", t: "املأ البيانات", d: "أدخل معلومات حسابك والديفيجن المطلوب بدقة", img: "/3d/shield-3d.jpg" },
    { n: "3", t: "الدفع والتأكيد", d: "اختر وسيلة الدفع المناسبة وأكد طلبك بلمسة واحدة", img: "/3d/booster-3d.jpg" },
    { n: "4", t: "استلم النتيجة", d: "يبدأ اللاعب المحترف فوراً وتتابع تقدمك لحظة بلحظة", img: "/3d/trophy-3d.jpg" },
  ];
  return (
    <section id="how" className="scroll-mt-20 px-4 py-20 bg-[#0c1220]">
      <div className="mx-auto max-w-6xl">
        <Header title="كيف نعمل؟" sub="4 خطوات بسيطة وميسرة للوصول لهدفك بأمان تام" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="card-3d group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:border-primary/50 transition duration-300 backdrop-blur-md"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="size-14 overflow-hidden rounded-2xl border border-white/15 shadow-md group-hover:scale-110 transition duration-300">
                  <img src={s.img} alt={s.t} className="size-full object-cover" />
                </div>
                <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/20 border border-primary/40 text-base font-black text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  {s.n}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-black text-white">{s.t}</h3>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq({ items }: { items?: FaqDoc[] }) {
  const display = (items && items.length > 0) ? items : [
    { id: "1", question: "كيف أدفع؟", answer: "نوفر وسائل دفع متعددة تشمل فودافون كاش، إنستاباي، والتحويلات البنكية والمحفظة الإلكترونية.", sortOrder: 1, active: true },
    { id: "2", question: "هل الحساب آمن من الباند؟", answer: "نعم آمن 100%، اللعب يدوي بالكامل بواسطة مصنفين محترفين بدون أي برامج خارجية أو تهكير.", sortOrder: 2, active: true },
  ];

  return (
    <section id="faq" className="scroll-mt-20 px-4 py-20 bg-[#090d16]">
      <div className="mx-auto max-w-3xl">
        <Header title="أسئلة شائعة" sub="كل ما تود معرفته عن أمان الحساب وضمانات اللعب" />
        <div className="space-y-3.5">
          {display.map((f) => (
            <details key={f.id} className="rounded-2xl border border-white/10 bg-slate-900/50 shadow-md overflow-hidden group backdrop-blur-md">
              <summary className="cursor-pointer list-none p-5 font-black text-sm text-slate-200 hover:text-white transition flex justify-between items-center">
                <span>{f.question}</span>
                <span className="text-xs text-cyan-400 font-bold">عرض الإجابة</span>
              </summary>
              <p className="px-5 pb-5 pt-1 text-xs text-slate-400 leading-relaxed font-medium border-t border-white/5">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="px-4 py-16 bg-[#090d16]">
      <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#1e1035] p-8 sm:p-12 text-center text-white shadow-[0_0_50px_rgba(139,92,246,0.2)] border border-white/15 relative overflow-hidden">
        <div className="absolute -left-10 -top-10 size-48 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 size-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <h2 className="mb-3 text-2xl sm:text-4xl font-black tracking-tight">
          جاهز للوصول إلى الديفيجن الأول؟
        </h2>
        <p className="mx-auto mb-8 max-w-md text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
          انضم لأكثر من 1200 عميل وثقوا في خدماتنا، واطلب وصول حسابك لأعلى المراتب في أسرع وقت.
        </p>
        <Link
          to="/order"
          className="btn-cta inline-flex min-h-12 items-center justify-center rounded-2xl px-10 text-sm font-black shadow-lg"
        >
          ابدأ طلبك الآن
        </Link>
      </div>
    </section>
  );
}

function Header({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-12 text-center">
      <h2 className="text-3xl font-extrabold md:text-4xl text-white tracking-tight">{title}</h2>
      <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-primary via-cyan-400 to-primary shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
      {sub ? (
        <p className="mx-auto mt-4 max-w-xl text-slate-400 text-sm font-medium">{sub}</p>
      ) : null}
    </div>
  );
}
