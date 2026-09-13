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
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <a
              href="#services"
              className="btn-primary inline-flex min-h-12 items-center justify-center rounded-xl px-8 font-bold"
            >
              استكشف الخدمات
            </a>
            <Link
              to="/track"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-primary/30 px-8 font-semibold text-primary"
            >
              تتبع طلبك
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 lg:justify-start">
            <Stat
              value={settings?.stat1Value ?? "+1200"}
              label={settings?.stat1Label ?? "طلب مكتمل"}
            />
            <span className="h-10 w-px bg-border" />
            <Stat
              value={settings?.stat2Value ?? "24/7"}
              label={settings?.stat2Label ?? "دعم فني"}
            />
            <span className="h-10 w-px bg-border" />
            <Stat
              value={settings?.stat3Value ?? "~18س"}
              label={settings?.stat3Label ?? "متوسط الإنجاز"}
            />
          </div>
        </div>

        {/* Hero card */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="glass rounded-3xl p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-on-primary">
                  D1
                </div>
                <div>
                  <div className="font-bold">Division Boost</div>
                  <div className="text-xs text-muted">من Div 3 → Div 1</div>
                </div>
              </div>
              <span className="rounded-full bg-warn px-2.5 py-1 text-[10px] font-bold text-bg">
                الأكثر طلباً
              </span>
            </div>
            <div className="mb-4 flex justify-between text-sm">
              <span className="text-muted">التقدم</span>
              <span className="font-medium text-primary">Div 2 • 1680 Rating</span>
            </div>
            <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-surface">
              <div className="h-full w-[72%] rounded-full bg-primary" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Mini n="+3" l="فوز" />
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
      <div className="text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function Mini({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-xl bg-surface py-3">
      <div className="text-lg font-bold">{n}</div>
      <div className="text-[10px] text-muted">{l}</div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    { icon: ShieldCheck, t: "خدمة يدوية آمنة" },
    { icon: Clock, t: "سرعة في التنفيذ" },
    { icon: MessageCircle, t: "دعم تليجرام + واتساب" },
    { icon: TrendingUp, t: "ضمان الجودة" },
  ];
  return (
    <section className="border-y border-border bg-surface/70">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-4 py-6 text-sm text-muted">
        {items.map((i) => (
          <div key={i.t} className="flex items-center gap-2">
            <i.icon className="size-5 text-primary" />
            {i.t}
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "1", t: "اختر الخدمة", d: "اختر نوع الخدمة المناسبة (Division أو Player)" },
    { n: "2", t: "املأ البيانات", d: "أدخل معلومات حسابك والتفاصيل المطلوبة" },
    { n: "3", t: "ادفع وتواصل", d: "تواصل معنا على تليجرام أو واتساب لإتمام الدفع" },
    { n: "4", t: "استلم النتيجة", d: "نبدأ الشغل ونتابعك لحد ما توصل هدفك" },
  ];
  return (
    <section id="how" className="scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <Header title="كيف نعمل؟" sub="4 خطوات بسيطة توصل لهدفك" />
        <div className="grid gap-6 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-xl font-extrabold text-on-primary">
                {s.n}
              </div>
              <h3 className="mb-2 font-bold">{s.t}</h3>
              <p className="text-sm text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq({ items }: { items?: FaqDoc[] }) {
  const display = (items && items.length > 0) ? items : [
    { id: "1", question: "كيف أدفع؟", answer: "بعد تقديم الطلب هتتواصل معانا على تليجرام أو واتساب.", sortOrder: 1, active: true },
    { id: "2", question: "هل الحساب آمن؟", answer: "بنشتغل يدوي 100% وما بنستخدمش برامج ممنوعة.", sortOrder: 2, active: true },
  ];

  return (
    <section id="faq" className="scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <Header title="أسئلة شائعة" />
        <div className="space-y-3">
          {display.map((f) => (
            <details key={f.id} className="glass rounded-xl">
              <summary className="cursor-pointer list-none p-5 font-medium">
                {f.question}
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{f.answer}</p>
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
      <div className="glass mx-auto max-w-4xl rounded-3xl p-8 text-center md:p-12">
        <h2 className="mb-4 text-2xl font-extrabold md:text-3xl">
          جاهز توصل Division 1؟
        </h2>
        <p className="mx-auto mb-8 max-w-md text-muted">
          تواصل معانا دلوقتي وهنساعدك توصل لهدفك في أسرع وقت.
        </p>
        <Link
          to="/order"
          className="btn-primary inline-flex min-h-12 items-center rounded-xl px-8 font-bold"
        >
          ابدأ الطلب
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
