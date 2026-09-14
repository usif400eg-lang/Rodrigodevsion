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
    <section className="hero-glow relative overflow-hidden px-4 pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className="text-center lg:text-right">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <span className="size-2 rounded-full bg-ok" />
            متاح الآن • خدمة يدوية 100%
          </div>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            {typeof settings?.heroHeadline === "string" && settings.heroHeadline.trim()
              ? settings.heroHeadline.split(".").map((part, i) =>
                i === 0 ? (
                  <span key={i}>{part}.</span>
                ) : (
                  <span
                    key={i}
                    className="mt-2 block bg-gradient-to-l from-primary to-fg bg-clip-text text-transparent"
                  >
                    {part.trim()}
                  </span>
                ),
              )
              : (
                <>
                  العب أقل.
                  <span className="mt-2 block bg-gradient-to-l from-primary to-fg bg-clip-text text-transparent">
                    وصل أكتر.
                  </span>
                </>
              )}
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted lg:mx-0">
            {settings?.heroSub ??
              "خدمات احترافية لرفع الديفيجن وضمان اللاعبين في eFootball Mobile. فريق متخصص، سرعة في التنفيذ، ودعم مستمر."}
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
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-8 text-sm font-extrabold text-slate-800 hover:border-primary hover:text-primary transition shadow-xs"
            >
              تتبع طلبك
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-6 sm:gap-8 lg:justify-start">
            <Stat
              value={settings?.stat1Value ?? "+1200"}
              label={settings?.stat1Label ?? "طلب مكتمل"}
            />
            <span className="h-10 w-px bg-slate-200" />
            <Stat
              value={settings?.stat2Value ?? "24/7"}
              label={settings?.stat2Label ?? "دعم فني"}
            />
            <span className="h-10 w-px bg-slate-200" />
            <Stat
              value={settings?.stat3Value ?? "~18س"}
              label={settings?.stat3Label ?? "متوسط الإنجاز"}
            />
          </div>
        </div>

        {/* Hero card */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-lg font-black text-white shadow-md shadow-primary/25">
                  D1
                </div>
                <div>
                  <div className="font-black text-slate-900">Division Boost</div>
                  <div className="text-xs font-semibold text-slate-500">من Div 3 → Div 1</div>
                </div>
              </div>
              <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[11px] font-black text-white shadow-sm">
                الأكثر طلباً ⭐
              </span>
            </div>
            <div className="mb-4 flex justify-between text-xs font-bold">
              <span className="text-slate-500">التقدم الفعلي</span>
              <span className="text-primary font-black">Div 2 • 1680 Rating</span>
            </div>
            <div className="mb-5 h-3 overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200/50">
              <div className="h-full w-[74%] rounded-full bg-gradient-to-r from-primary to-primary-strong shadow-xs" />
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <Mini n="+3" l="فوز متتالي" />
              <Mini n="18س" l="متبقي" />
              <Mini n="400" l="جنيه" />
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
      <div className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 tracking-tight">{value}</div>
      <div className="text-xs font-bold text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function Mini({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200/70 py-3 px-2">
      <div className="text-lg font-black text-slate-900">{n}</div>
      <div className="text-[11px] font-bold text-slate-500 mt-0.5">{l}</div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    { icon: ShieldCheck, t: "خدمة يدوية آمنة 100%" },
    { icon: Clock, t: "سرعة فائقة في التنفيذ" },
    { icon: MessageCircle, t: "دعم تليجرام + واتساب 24/7" },
    { icon: TrendingUp, t: "ضمان بلوغ الديفيجن أو التعويض" },
  ];
  return (
    <section className="border-y border-slate-200/80 bg-white py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 sm:gap-10 px-4 text-xs sm:text-sm font-extrabold text-slate-700">
        {items.map((i) => (
          <div key={i.t} className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <i.icon className="size-4" />
            </span>
            <span>{i.t}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "1", t: "اختر الخدمة", d: "اختر نوع الخدمة المناسبة (ديفيجن أو ضمان لاعب)" },
    { n: "2", t: "املأ البيانات", d: "أدخل معلومات حسابك والديفيجن المطلوب بدقة" },
    { n: "3", t: "الدفع والتأكيد", d: "اختر وسيلة الدفع المناسبة وأكد طلبك بلمسة واحدة" },
    { n: "4", t: "استلم النتيجة", d: "يبدأ اللاعب المحترف فوراً وتتابع تقدمك لحظة بلحظة" },
  ];
  return (
    <section id="how" className="scroll-mt-20 px-4 py-20 bg-slate-50/50">
      <div className="mx-auto max-w-6xl">
        <Header title="كيف نعمل؟" sub="4 خطوات بسيطة وميسرة للوصول لهدفك بأمان تام" />
        <div className="grid gap-6 md:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="text-center rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300"
            >
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary-strong text-xl font-black text-white shadow-md shadow-primary/20">
                {s.n}
              </div>
              <h3 className="mb-2 text-base font-black text-slate-900">{s.t}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq({ items }: { items?: FaqDoc[] }) {
  const display = (items && items.length > 0) ? items : [
    { id: "1", question: "كيف أدفع؟", answer: "نوفر وسائل دفع متعددة تشمل فودافون كاش، إنستاباي، والتحويلات البنكية والمحفظة.", sortOrder: 1, active: true },
    { id: "2", question: "هل الحساب آمن من الباند؟", answer: "نعم آمن 100%، اللعب يدوي بالكامل بواسطة مصنفين محترفين بدون أي برامج ممنوعة.", sortOrder: 2, active: true },
  ];

  return (
    <section id="faq" className="scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <Header title="أسئلة شائعة" sub="كل ما تود معرفته عن أمان الحساب وضمانات اللعب" />
        <div className="space-y-3.5">
          {display.map((f) => (
            <details key={f.id} className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden group">
              <summary className="cursor-pointer list-none p-5 font-black text-sm text-slate-900 hover:text-primary transition flex justify-between items-center">
                <span>{f.question}</span>
                <span className="text-xs text-primary font-bold">عرض الإجابة</span>
              </summary>
              <p className="px-5 pb-5 pt-1 text-xs text-slate-500 leading-relaxed font-medium border-t border-slate-100">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#1e1035] p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
        <div className="absolute -left-10 -top-10 size-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
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
      <h2 className="text-3xl font-extrabold md:text-4xl">{title}</h2>
      <div className="mx-auto mt-3 h-0.5 w-14 rounded bg-primary" />
      {sub ? (
        <p className="mx-auto mt-4 max-w-xl text-muted">{sub}</p>
      ) : null}
    </div>
  );
}
