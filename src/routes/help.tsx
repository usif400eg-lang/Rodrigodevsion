import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, HelpCircle, MessageCircle, Search, ShieldCheck, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/help")({
  component: HelpPage,
});

type FAQItem = {
  q: string;
  a: string;
  cat: "general" | "security" | "payment" | "division";
};

const FAQS: FAQItem[] = [
  {
    cat: "general",
    q: "كيف أطلب خدمة من موقع Rodrigo Divsion؟",
    a: "اختر الخدمة المطلوبة (رفع ديفيجن أو ضمان لاعب أو تطوير طاقات)، اضغط على زر 'أطلب الآن'، املأ بيانات التواصل والديفيجن الحالي والمستهدف، واختر طريقة الدفع المناسبة وأكد طلبك.",
  },
  {
    cat: "general",
    q: "كيف يمكنني تتبع حالة طلبي بعد الدفع؟",
    a: "فور تأكيد الطلب، ستحصل على كود تتبع فريد (مثال: RDG-123456). يمكنك الدخول لصفحة 'تتبع الطلب' في أي وقت لإدخال الكود ومشاهدة مرحلة التنفيذ الحالية والتواصل المباشر مع المنفذ.",
  },
  {
    cat: "security",
    q: "هل تسليم حسابي آمن ولا يسبب باند (حظر)؟",
    a: "نعم آمن 100%. جميع المباريات تُلعب بشكل يدوي نظيف واحترافي على هواتف محمولة أصلية بدون أي برامج تعديل أو هاكات أو أدوات غير مصرح بها. لم يتعرض أي حساب لأي باند طوال فترة عملنا.",
  },
  {
    cat: "security",
    q: "هل يمكنني الدخول إلى حسابي أثناء سريان الطلب؟",
    a: "يُفضل بشدة عدم فتح الحساب أثناء قيام اللاعب المحترف باللعب لتفادي فصل المباراة المفاجئ وخسارة النقاط. سنقوم بإشعارك عبر الواتساب فور الانتهاء لتتمكن من الدخول فوراً.",
  },
  {
    cat: "payment",
    q: "ما هي طرق الدفع المتاحة؟",
    a: "نوفر وسائل دفع متعددة ومحلية ميسرة: فودافون كاش، إنستاباي (InstaPay)، المحافظ الإلكترونية، والتحويل البنكي، بالإضافة إلى الدفع عبر رصيد المحفظة.",
  },
  {
    cat: "payment",
    q: "كم يستغرق تنفيذ الطلب في العادة؟",
    a: "تعتمد المدة على نوع الخدمة؛ رفع الديفيجن يستغرق من 3 إلى 12 ساعة في المتوسط حسب فارق الرتبة، وضمان اللاعبين يتم غالباً في غضون ساعات قليلة من بدء العمل.",
  },
  {
    cat: "division",
    q: "ماذا لو خسر اللاعب المحترف أي مباريات؟",
    a: "اللاعبون المحترفون لدينا من أفضل مصنفي الديفيجن الأول عالمياً ومعدل فوزهم يفوق 95%. وفي حال حدوث أي تعثر، يلتزم الفريق بتعويض النقاط بالكامل حتى وصول حسابك للهدف المطلوب بدقة.",
  },
  {
    cat: "division",
    q: "هل يمكنني طلب الوصول لتصنيف محدد في الديفيجن 1 (مثلاً Top 1000)؟",
    a: "نعم، نقدم خدمات متقدمة للوصول إلى تصنيفات محددة وتثبيت الرتبة بنهاية الموسم، يمكنك تحديد ذلك في ملاحظات الطلب أو التنسيق المباشر معنا.",
  },
];

const CATEGORIES = [
  { id: "all", label: "جميع الأسئلة" },
  { id: "general", label: "عام والطلبات" },
  { id: "security", label: "الأمان والحسابات" },
  { id: "payment", label: "الدفع والتحويل" },
  { id: "division", label: "الديفيجن واللعب" },
];

function HelpPage() {
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((f) => {
      const matchCat = selectedCat === "all" || f.cat === selectedCat;
      const matchSearch =
        !search.trim() ||
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCat, search]);

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1">
        {/* ── Header ── */}
        <section className="py-14 sm:py-20 bg-gradient-to-b from-surface via-bg to-bg border-b border-border/80">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-extrabold text-primary mb-4">
              <HelpCircle className="size-3.5" />
              <span>مركز المساعدة والدعم</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              كيف يمكننا <span className="text-primary">مساعدتك اليوم؟</span>
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-lg mx-auto leading-relaxed mb-8">
              إليك إجابات شافية ووافية عن كافة الأسئلة المتكررة حول خدماتنا وضماناتنا.
            </p>

            {/* Search Input */}
            <div className="relative mx-auto max-w-xl">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن سؤالك هنا (مثال: أمان الحساب، مدة التنفيذ، طرق الدفع)..."
                className="w-full rounded-2xl border border-border bg-white px-5 py-4 pl-12 text-sm shadow-md outline-none focus:border-primary transition"
              />
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
            </div>
          </div>
        </section>

        {/* ── Category Filters & FAQ Accordion ── */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4">
            {/* Categories */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCat(c.id)}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                    selectedCat === c.id
                      ? "bg-primary text-white shadow-sm"
                      : "border border-border bg-white text-muted hover:text-fg hover:border-primary/40"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Questions List */}
            {filteredFaqs.length === 0 ? (
              <div className="rounded-3xl border border-border bg-white p-12 text-center text-muted">
                لا توجد نتائج مطابقة لبحثك، يمكنك التواصل معنا مباشرة وسنجيبك في الحال!
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((item, idx) => {
                  const isOpen = openIdx === idx;
                  return (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenIdx(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between p-5 text-right font-extrabold text-sm sm:text-base text-fg hover:text-primary transition"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-surface text-xs font-black text-primary">
                            Q
                          </span>
                          <span>{item.q}</span>
                        </span>
                        <ChevronDown
                          className={`size-4 shrink-0 text-muted transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-primary" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted leading-relaxed font-medium border-t border-border/50">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Direct Support Card */}
            <div className="mt-14 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/5 via-surface to-primary/5 p-8 text-center">
              <MessageCircle className="size-10 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-black mb-1">لم تجد إجابة لسؤالك؟</h3>
              <p className="text-xs sm:text-sm text-muted max-w-md mx-auto mb-6">
                فريق الدعم الفني متواجد عبر الواتساب على مدار الساعة للرد على أي استفسار فوراً.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/contact"
                  className="btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-7 text-xs font-extrabold shadow-sm"
                >
                  صفحة اتصل بنا
                </Link>
                <a
                  href="https://wa.me/201018593455"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-white px-7 text-xs font-extrabold text-fg hover:border-emerald-500 hover:text-emerald-600 transition shadow-sm"
                >
                  مراسلة واتساب مباشرة
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
