import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { Check, Clock, HelpCircle, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/lib/firebase";
import type { ContactSettingsDoc, PlayerDoc, QuestionDoc, ServiceDoc } from "@/lib/firebase-types";
import { SERVICES } from "@/lib/catalog";
import { createOrderFirestore } from "@/lib/orders";
import { z } from "zod";

const searchSchema = z.object({
  service: z.string().optional(),
});

export const Route = createFileRoute("/order")({
  validateSearch: searchSchema,
  component: OrderPage,
});

interface GuaranteePlayerOption {
  id: string;
  name: string;
  rating?: number;
  style?: string;
  position?: string;
  imageUrl?: string;
}

const DEFAULT_GUARANTEE_PLAYERS: GuaranteePlayerOption[] = [
  { id: "p1", name: "ليونيل ميسي (Lionel Messi)", rating: 105, style: "Big Time / Epic", position: "RWF", imageUrl: "/badges/player-epic.svg" },
  { id: "p2", name: "كريستيانو رونالدو (Cristiano Ronaldo)", rating: 104, style: "Epic", position: "CF", imageUrl: "/badges/player-epic.svg" },
  { id: "p3", name: "رونالدينيو (Ronaldinho)", rating: 103, style: "Epic", position: "AMF", imageUrl: "/badges/player-epic.svg" },
  { id: "p4", name: "نيمار دا سيلفا (Neymar Jr)", rating: 102, style: "Showtime", position: "LWF", imageUrl: "/badges/player-epic.svg" },
  { id: "p5", name: "فرانك ريكارد (Frank Rijkaard)", rating: 103, style: "Epic", position: "DMF", imageUrl: "/badges/player-epic.svg" },
  { id: "p6", name: "باولو مالديني (Paolo Maldini)", rating: 104, style: "Epic", position: "CB", imageUrl: "/badges/player-epic.svg" },
  { id: "p7", name: "باتريك فييرا (Patrick Vieira)", rating: 104, style: "Epic", position: "DMF", imageUrl: "/badges/player-epic.svg" },
  { id: "p8", name: "كاكا (Kaká)", rating: 102, style: "Epic", position: "AMF", imageUrl: "/badges/player-epic.svg" },
  { id: "p9", name: "كيليان مبابي (Kylian Mbappé)", rating: 102, style: "Highlight", position: "CF", imageUrl: "/badges/player-epic.svg" },
];

// Session anti-spam
const SESSION_KEY = "rdg-session-orders";
const LAST_TIME_KEY = "rdg-last-order-time";

function getSessionOrderCount() {
  try {
    return Number(sessionStorage.getItem(SESSION_KEY) || "0");
  } catch {
    return 0;
  }
}

function incrementSessionOrderCount() {
  try {
    const n = getSessionOrderCount() + 1;
    sessionStorage.setItem(SESSION_KEY, String(n));
    sessionStorage.setItem(LAST_TIME_KEY, String(Date.now()));
  } catch {
    /* noop */
  }
}

function checkCooldownViolation(): boolean {
  try {
    const last = Number(sessionStorage.getItem(LAST_TIME_KEY) || "0");
    if (last && Date.now() - last < 30000) {
      return true;
    }
  } catch {
    /* noop */
  }
  return false;
}

function OrderPage() {
  const navigate = useNavigate();
  const { service: serviceParam } = Route.useSearch();

  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceDoc | null>(null);
  const [contact, setContact] = useState<ContactSettingsDoc | null>(null);
  const [dynamicQuestions, setDynamicQuestions] = useState<QuestionDoc[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [step, setStep] = useState(1);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Customer Contact
  const [customerName, setCustomerName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Step 2: Dynamic / Fallback Form Answers
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, string>>({});
  const [fallbackDivision, setFallbackDivision] = useState("Division 3");
  const [fallbackPoints, setFallbackPoints] = useState("");
  const [fallbackRanking, setFallbackRanking] = useState("");
  const [fallbackPlayerName, setFallbackPlayerName] = useState("");
  const [fallbackNotes, setFallbackNotes] = useState("");

  // Players catalog for Player Guarantee selection
  const [playersList, setPlayersList] = useState<PlayerDoc[]>([]);
  const [isCustomPlayer, setIsCustomPlayer] = useState(false);
  const [customPlayerText, setCustomPlayerText] = useState("");

  // Load services and contact
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "services"));
        let svcs = snap.docs
          .map((d) => {
            const data = d.data() as ServiceDoc;
            return {
              ...data,
              id: data.id || d.id,
              images: data.images ?? [],
            };
          })
          .filter((s) => s.active !== false)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (svcs.length === 0) {
          svcs = SERVICES.map((s, idx) => ({
            ...s,
            active: true,
            featured: idx === 0,
            sortOrder: idx + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        }
        setServices(svcs);

        const found = serviceParam
          ? svcs.find((s) => s.id === serviceParam || s.slug === serviceParam) ?? svcs[0]
          : svcs[0];
        setSelectedService(found ?? null);

        const contactSnap = await getDoc(doc(db, "settings", "contact"));
        if (contactSnap.exists()) setContact(contactSnap.data() as ContactSettingsDoc);
      } catch (e) {
        console.warn("Could not load services from Firestore, using default catalog:", e);
        const fallback = SERVICES.map((s, idx) => ({
          ...s,
          active: true,
          featured: idx === 0,
          sortOrder: idx + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        setServices(fallback);
        const found = serviceParam
          ? fallback.find((s) => s.id === serviceParam || s.slug === serviceParam) ?? fallback[0]
          : fallback[0];
        setSelectedService(found ?? null);
      } finally {
        setLoadingServices(false);
      }
    };
    void load();
  }, [serviceParam]);

  // Load players for guarantee selection
  useEffect(() => {
    async function loadPlayers() {
      try {
        const snap = await getDocs(collection(db, "players"));
        const pl = snap.docs
          .map((d) => ({ ...(d.data() as PlayerDoc), id: d.id }))
          .filter((p) => p.active !== false)
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        setPlayersList(pl);
      } catch (err) {
        console.warn("Could not load players:", err);
      }
    }
    void loadPlayers();
  }, []);

  const availablePlayerOptions: GuaranteePlayerOption[] =
    playersList.length > 0
      ? playersList.map((p) => ({
          id: p.id,
          name: p.name,
          rating: p.rating,
          style: p.style,
          position: p.position,
          imageUrl: p.imageUrl,
        }))
      : DEFAULT_GUARANTEE_PLAYERS;

  const selectedPlayerObj = availablePlayerOptions.find(
    (p) => p.name === fallbackPlayerName,
  );

  // Load dynamic questions if service has a formId
  useEffect(() => {
    async function loadFormQuestions() {
      if (!selectedService?.formId) {
        setDynamicQuestions([]);
        return;
      }
      try {
        const q = query(
          collection(db, "questions"),
          where("formId", "==", selectedService.formId),
          where("active", "==", true),
          orderBy("sortOrder", "asc"),
        );
        const snap = await getDocs(q);
        setDynamicQuestions(snap.docs.map((d) => d.data() as QuestionDoc));
      } catch (err) {
        console.warn("Could not load dynamic questions:", err);
        setDynamicQuestions([]);
      }
    }
    void loadFormQuestions();
  }, [selectedService]);

  function next() {
    setError("");

    if (step === 1) {
      if (!customerName.trim() || !telegram.trim()) {
        setError("الاسم ويوزر تليجرام مطلوبين لمتابعة الطلب.");
        return;
      }
      const cleanTg = telegram.trim();
      if (!cleanTg.startsWith("@") || cleanTg.length < 3) {
        setError("يوزر تليجرام يجب أن يبدأ بعلامة @ ويتكون من 3 أحرف على الأقل.");
        return;
      }
    }

    if (step === 2) {
      if (dynamicQuestions.length > 0) {
        // Validate required dynamic fields
        for (const q of dynamicQuestions) {
          if (q.required && !dynamicAnswers[q.label]?.trim()) {
            setError(`يرجى ملء الحقل المطلوب: ${q.label}`);
            return;
          }
        }
      } else {
        // Fallback validation
        if (selectedService?.type === "division_boost" && !fallbackPoints.trim()) {
          setError("اكتب النقاط الحالية أو التقييم الحالي لحسابك.");
          return;
        }
        if (selectedService?.type === "player_guarantee" && !fallbackPlayerName.trim()) {
          setError("اكتب اسم اللاعب المطلوب ضمانه.");
          return;
        }
      }
    }

    if (step < 3) setStep(step + 1);
    else void submit();
  }

  async function submit() {
    if (!selectedService) return;

    // Anti-spam checks
    if (getSessionOrderCount() >= 3) {
      setError("تجاوزت الحد المسموح به من الطلبات في هذه الجلسة. تواصل معنا مباشرة عبر تليجرام.");
      return;
    }

    if (checkCooldownViolation()) {
      setError("يرجى الانتظار 30 ثانية قبل تقديم طلب جديد لمنع التكرار.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const answers: Record<string, string> = {
        ...dynamicAnswers,
      };

      if (dynamicQuestions.length === 0) {
        if (selectedService.type === "division_boost") {
          answers["الديفيجن الحالي"] = fallbackDivision;
          answers["النقاط الحالية"] = fallbackPoints;
          if (fallbackRanking) answers["الترتيب العالمي"] = fallbackRanking;
        } else {
          answers["اللاعب المطلوب"] = fallbackPlayerName;
        }
        if (fallbackNotes) answers["ملاحظات العميل"] = fallbackNotes;
      }

      const order = await createOrderFirestore({
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        currency: selectedService.currency,
        customerName: customerName.trim(),
        telegram: telegram.trim(),
        whatsapp: whatsapp.trim() || undefined,
        answers,
        sessionId: crypto.randomUUID(),
      });

      incrementSessionOrderCount();
      setDoneId(order.orderId);
    } catch (e) {
      console.error(e);
      setError("حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى أو تواصل معنا مباشرة.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingServices) {
    return (
      <div className="min-h-screen bg-bg">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-xl bg-surface" />
            <div className="h-4 w-72 rounded-xl bg-surface" />
            <div className="h-64 rounded-2xl bg-surface" />
          </div>
        </main>
      </div>
    );
  }

  // Order Success Screen
  if (doneId) {
    const tgUsername = contact?.telegramUsername || "RodrigoServices";
    const waNumber = contact?.whatsappNumber || "201012345678";
    const telegramUrl = `https://t.me/${tgUsername}?text=${encodeURIComponent(`أهلاً، قمت بتقديم طلب جديد في Rodrigo برقم: ${doneId}`)}`;
    const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(`أهلاً، قمت بتقديم طلب جديد في Rodrigo برقم: ${doneId}`)}`;

    return (
      <div className="min-h-screen bg-bg">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-ok text-3xl font-extrabold text-white shadow-lg shadow-ok/20">
              ✓
            </div>
            <h1 className="mb-2 text-2xl font-extrabold text-fg">تم استلام طلبك بنجاح!</h1>
            <p className="mb-2 text-sm text-muted">احفظ رقم طلبك لمتابعة التنفيذ والتواصل معنا</p>
            <div className="mb-6 rounded-2xl bg-surface py-4 text-3xl font-mono font-extrabold tracking-wider text-primary border border-border">
              {doneId}
            </div>

            {/* CTAs */}
            <div className="mb-6 space-y-2.5">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#229ED9] font-bold text-white shadow-md transition hover:opacity-95 text-sm"
              >
                <MessageCircle className="size-5" />
                تأكيد الطلب والدفع عبر تليجرام
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] font-bold text-white shadow-md transition hover:opacity-95 text-sm"
              >
                <Phone className="size-5" />
                تأكيد الطلب والدفع عبر واتساب
              </a>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                to="/track"
                search={{ id: doneId }}
                className="btn-primary flex min-h-12 items-center justify-center rounded-xl font-bold shadow-md text-sm"
              >
                تتبع حالة الطلب
              </Link>
              <Link
                to="/"
                className="flex min-h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold text-muted hover:text-fg hover:bg-surface transition"
              >
                العودة للصفحة الرئيسية
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-extrabold text-fg">طلب خدمة جديدة</h1>
        {selectedService ? (
          <p className="mb-8 text-sm text-muted">
            {selectedService.name} —{" "}
            <strong className="text-primary font-bold">
              {selectedService.price} {selectedService.currency}
            </strong>
          </p>
        ) : null}

        {/* Steps indicator */}
        <div className="mb-8 flex items-center justify-between">
          {[
            { n: 1, label: "بيانات التواصل" },
            { n: 2, label: "تفاصيل الحساب" },
            { n: 3, label: "المراجعة والتأكيد" },
          ].map((s) => (
            <div key={s.n} className="flex flex-col items-center flex-1">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  s.n <= step ? "bg-primary text-on-primary shadow-sm shadow-primary/20" : "bg-surface text-muted border border-border"
                }`}
              >
                {s.n < step ? "✓" : s.n}
              </div>
              <span className={`mt-1.5 text-[11px] font-bold ${s.n <= step ? "text-primary" : "text-muted"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
          {/* Step 1: Customer Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-base text-fg">بيانات التواصل والعميل</h2>
              <div>
                <label className="block text-xs font-bold text-fg mb-1">
                  الاسم بالكامل *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: يوسف محمد"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg mb-1">
                  يوزر حساب التليجرام (مطلوب للتواصل وإتمام الدفع) *
                </label>
                <input
                  type="text"
                  required
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-mono outline-none focus:border-primary"
                  dir="ltr"
                />
                <p className="mt-1 text-[11px] text-muted">يجب أن يبدأ بـ @</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-fg mb-1">
                  رقم الواتساب (اختياري)
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="201012345678"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-mono outline-none focus:border-primary"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {/* Step 2: Service Selection & Dynamic Fields */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-bold text-base text-fg">بيانات الخدمة والحساب</h2>

              {/* Service selector */}
              <div>
                <label className="block text-xs font-bold text-fg mb-1">الخدمة المختارة</label>
                <select
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold outline-none focus:border-primary"
                  value={selectedService?.id ?? ""}
                  onChange={(e) => {
                    const svc = services.find((s) => s.id === e.target.value);
                    if (svc) {
                      setSelectedService(svc);
                      void navigate({ to: "/order", search: { service: e.target.value } });
                    }
                  }}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.price} {s.currency}
                    </option>
                  ))}
                </select>
              </div>

              {/* Render dynamic form fields if configured */}
              {dynamicQuestions.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {dynamicQuestions.map((q) => (
                    <div key={q.id}>
                      <label className="block text-xs font-bold text-fg mb-1">
                        {q.label} {q.required && <span className="text-warn">*</span>}
                      </label>

                      {q.type === "long_text" ? (
                        <textarea
                          rows={3}
                          value={dynamicAnswers[q.label] || ""}
                          placeholder={q.placeholder}
                          onChange={(e) =>
                            setDynamicAnswers((prev) => ({ ...prev, [q.label]: e.target.value }))
                          }
                          className="w-full rounded-xl border border-border bg-surface p-3 text-sm outline-none focus:border-primary"
                        />
                      ) : q.type === "select" ? (
                        <select
                          value={dynamicAnswers[q.label] || ""}
                          onChange={(e) =>
                            setDynamicAnswers((prev) => ({ ...prev, [q.label]: e.target.value }))
                          }
                          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                        >
                          <option value="">اختر...</option>
                          {q.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : q.type === "yes_no" ? (
                        <div className="flex gap-4">
                          {["نعم", "لا"].map((val) => (
                            <label key={val} className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                              <input
                                type="radio"
                                name={q.id}
                                value={val}
                                checked={dynamicAnswers[q.label] === val}
                                onChange={(e) =>
                                  setDynamicAnswers((prev) => ({ ...prev, [q.label]: e.target.value }))
                                }
                                className="size-4 text-primary"
                              />
                              {val}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type={q.type === "number" ? "number" : q.type === "date" ? "date" : "text"}
                          value={dynamicAnswers[q.label] || ""}
                          placeholder={q.placeholder}
                          onChange={(e) =>
                            setDynamicAnswers((prev) => ({ ...prev, [q.label]: e.target.value }))
                          }
                          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback Fields */
                <div className="space-y-4 pt-2">
                  {selectedService?.type === "division_boost" ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-fg mb-1">الديفيجن الحالي</label>
                        <select
                          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                          value={fallbackDivision}
                          onChange={(e) => setFallbackDivision(e.target.value)}
                        >
                          <option>Division 3</option>
                          <option>Division 2</option>
                          <option>Division 1</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-fg mb-1">
                          النقاط الحالية / التقييم (Rating) *
                        </label>
                        <input
                          type="text"
                          required
                          value={fallbackPoints}
                          onChange={(e) => setFallbackPoints(e.target.value)}
                          placeholder="مثال: 1680"
                          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-fg mb-1">
                          الترتيب العالمي الحالي (اختياري)
                        </label>
                        <input
                          type="text"
                          value={fallbackRanking}
                          onChange={(e) => setFallbackRanking(e.target.value)}
                          placeholder="مثال: 12500"
                          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-fg flex items-center justify-between">
                        <span>اختر اللاعب المطلوب ضمانه *</span>
                        <span className="text-[11px] font-normal text-muted">من قائمة اللاعبين أو كتابة يدوية</span>
                      </label>

                      {/* Dropdown Selector */}
                      <select
                        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold outline-none focus:border-primary"
                        value={isCustomPlayer ? "__custom__" : (fallbackPlayerName || "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "__custom__") {
                            setIsCustomPlayer(true);
                            setFallbackPlayerName(customPlayerText);
                          } else {
                            setIsCustomPlayer(false);
                            setFallbackPlayerName(val);
                          }
                        }}
                      >
                        <option value="" disabled>-- اضغط لاختيار اللاعب من القائمة --</option>
                        {availablePlayerOptions.map((p) => (
                          <option key={p.id} value={p.name}>
                            ⚽ {p.name} {p.rating ? `(${p.rating})` : ""} {p.style ? `— ${p.style}` : ""}
                          </option>
                        ))}
                        <option value="__custom__">✍️ لاعب آخر غير موجود بالقائمة (كتابة يدوية)</option>
                      </select>

                      {/* Quick chips for quick tap on mobile */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-muted ml-1">اختيارات سريعة:</span>
                        {availablePlayerOptions.slice(0, 5).map((p) => {
                          const isSelected = !isCustomPlayer && fallbackPlayerName === p.name;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setIsCustomPlayer(false);
                                setFallbackPlayerName(p.name);
                              }}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition flex items-center gap-1 ${
                                isSelected
                                  ? "bg-primary text-white shadow-xs"
                                  : "border border-border bg-surface text-fg hover:border-primary"
                              }`}
                            >
                              <span>{p.name.split(" ")[0]}</span>
                              {p.rating && <span className="opacity-75 text-[10px]">({p.rating})</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom text input if custom chosen or manual */}
                      {isCustomPlayer && (
                        <div className="pt-2 animate-in fade-in duration-200">
                          <label className="block text-xs font-bold text-fg mb-1">
                            اكتب اسم اللاعب المطلوب يدوياً *
                          </label>
                          <input
                            type="text"
                            required
                            value={customPlayerText}
                            onChange={(e) => {
                              setCustomPlayerText(e.target.value);
                              setFallbackPlayerName(e.target.value);
                            }}
                            placeholder="مثال: باتريك فييرا / كاكا / روبرتو كارلوس"
                            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                          />
                        </div>
                      )}

                      {/* Selected Player Preview Card */}
                      {selectedPlayerObj && !isCustomPlayer && (
                        <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3 animate-in fade-in">
                          {selectedPlayerObj.imageUrl ? (
                            <img
                              src={selectedPlayerObj.imageUrl}
                              alt=""
                              className="size-12 rounded-xl object-contain border border-border bg-card shadow-xs"
                            />
                          ) : (
                            <div className="size-12 rounded-xl border border-border bg-card flex items-center justify-center font-extrabold text-primary text-sm">
                              {selectedPlayerObj.rating || "⭐"}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-fg">{selectedPlayerObj.name}</div>
                            <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                              {selectedPlayerObj.rating && (
                                <span className="font-semibold text-primary">التقييم: {selectedPlayerObj.rating}</span>
                              )}
                              {selectedPlayerObj.style && (
                                <span>• النوع: {selectedPlayerObj.style}</span>
                              )}
                              {selectedPlayerObj.position && (
                                <span>• المركز: {selectedPlayerObj.position}</span>
                              )}
                            </div>
                          </div>
                          <Check className="size-5 text-ok shrink-0" />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-fg mb-1">ملاحظات إضافية (اختياري)</label>
                    <textarea
                      rows={3}
                      value={fallbackNotes}
                      onChange={(e) => setFallbackNotes(e.target.value)}
                      placeholder="أي تعليمات أو ملاحظات لفريق التنفيذ..."
                      className="w-full rounded-xl border border-border bg-surface p-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Order Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-bold text-base text-fg">مراجعة تفاصيل الطلب</h2>
              <div className="rounded-2xl bg-surface p-4 text-xs space-y-2.5 border border-border">
                <div className="flex justify-between border-b border-border/80 pb-2">
                  <span className="text-muted">الخدمة:</span>
                  <span className="font-bold text-fg">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between border-b border-border/80 pb-2">
                  <span className="text-muted">السعر:</span>
                  <span className="font-extrabold text-primary text-sm">
                    {selectedService?.price} {selectedService?.currency}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/80 pb-2">
                  <span className="text-muted">الاسم:</span>
                  <span className="font-semibold text-fg">{customerName}</span>
                </div>
                <div className="flex justify-between border-b border-border/80 pb-2">
                  <span className="text-muted">تليجرام:</span>
                  <span className="font-mono font-bold text-fg" dir="ltr">
                    {telegram}
                  </span>
                </div>
                {whatsapp && (
                  <div className="flex justify-between border-b border-border/80 pb-2">
                    <span className="text-muted">واتساب:</span>
                    <span className="font-mono text-fg" dir="ltr">
                      {whatsapp}
                    </span>
                  </div>
                )}
                {/* Fallback service fields review */}
                {selectedService?.type === "division_boost" && (
                  <>
                    <div className="flex justify-between border-b border-border/80 pb-2">
                      <span className="text-muted">الديفيجن الحالي:</span>
                      <span className="font-semibold text-fg">{fallbackDivision}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/80 pb-2">
                      <span className="text-muted">النقاط الحالية:</span>
                      <span className="font-semibold text-fg">{fallbackPoints}</span>
                    </div>
                    {fallbackRanking && (
                      <div className="flex justify-between border-b border-border/80 pb-2">
                        <span className="text-muted">الترتيب العالمي:</span>
                        <span className="font-semibold text-fg">{fallbackRanking}</span>
                      </div>
                    )}
                  </>
                )}
                {selectedService?.type === "player_guarantee" && fallbackPlayerName && (
                  <div className="flex justify-between border-b border-border/80 pb-2">
                    <span className="text-muted">اللاعب المطلوب:</span>
                    <span className="font-bold text-primary">{fallbackPlayerName}</span>
                  </div>
                )}
                {fallbackNotes && (
                  <div className="flex justify-between border-b border-border/80 pb-2">
                    <span className="text-muted">ملاحظات:</span>
                    <span className="font-semibold text-fg max-w-[200px] truncate">{fallbackNotes}</span>
                  </div>
                )}
                {Object.entries(dynamicAnswers || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border/80 pb-2">
                    <span className="text-muted">{k}:</span>
                    <span className="font-semibold text-fg max-w-[200px] truncate">{v}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary space-y-1">
                <p className="font-bold">طريقة الدفع والتنفيذ اليدوي:</p>
                <p className="text-muted leading-relaxed">
                  بمجرد الضغط على "تأكيد الطلب"، ستحصل على رقم طلب خاص بك مثل (RDG-1001)، وستتمكن من
                  التواصل معنا عبر تليجرام أو واتساب لإرسال إيصال الدفع والبدء فوراً.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-warn/20 bg-warn/10 p-3 text-xs font-semibold text-warn">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep((s) => s - 1)}
                className="min-h-12 flex-1 rounded-xl border border-border font-semibold text-sm hover:bg-surface transition"
              >
                رجوع
              </button>
            )}
            <button
              type="button"
              disabled={submitting}
              onClick={next}
              className="btn-primary min-h-12 flex-1 rounded-xl font-bold text-sm shadow-md disabled:opacity-60"
            >
              {submitting
                ? "جاري إرسال الطلب..."
                : step === 3
                  ? "تأكيد الطلب النهائي"
                  : "التالي"}
            </button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
