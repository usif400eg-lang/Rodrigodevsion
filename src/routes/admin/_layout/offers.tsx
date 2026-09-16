import { createFileRoute } from "@tanstack/react-router";
import {
  Copy,
  Edit2,
  Eye,
  EyeOff,
  Flame,
  Plus,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import { appAlert, appConfirm } from "@/components/ui/app-modal";
import type { OfferDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/admin/_layout/offers")({
  component: AdminOffersPage,
});

const OFFERS_STORAGE_KEY = "rodrigo_custom_offers_v1";

function loadOffersFromLocal(): OfferDoc[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load local offers:", e);
  }
  return null;
}

function saveOffersToLocal(offersList: OfferDoc[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offersList));
  } catch (e) {
    console.warn("Failed to save local offers:", e);
  }
}

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

function AdminOffersPage() {
  const { session } = useAdminStore();
  const [offers, setOffers] = useState<OfferDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferDoc | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [badge, setBadge] = useState("");
  const [discount, setDiscount] = useState("خصم 25%");
  const [price, setPrice] = useState("350");
  const [oldPrice, setOldPrice] = useState("500");
  const [currency, setCurrency] = useState("ج.م");
  const [duration, setDuration] = useState("خلال 12 ساعة");
  const [desc, setDesc] = useState("");
  const [featuresText, setFeaturesText] = useState("");
  const [highlight, setHighlight] = useState(false);
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 1. Initial immediate hydrate from local cache if available
    const local = loadOffersFromLocal();
    if (local && local.length > 0) {
      setOffers(local);
      setLoading(false);
    }

    // 2. Firestore listener with fallback
    const q = query(collection(db, "offers"), orderBy("sortOrder", "asc"));
    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) {
          if (!local || local.length === 0) {
            setOffers(DEFAULT_OFFERS);
            saveOffersToLocal(DEFAULT_OFFERS);
            try {
              for (const offer of DEFAULT_OFFERS) {
                await setDoc(doc(db, "offers", offer.id), offer);
              }
            } catch (e) {
              console.warn("Auto-seed error:", e);
            }
          }
        } else {
          const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as OfferDoc);
          setOffers(list);
          saveOffersToLocal(list);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Offers snapshot error, using local fallback:", err);
        const fallback = loadOffersFromLocal() || DEFAULT_OFFERS;
        setOffers(fallback);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  function openCreateModal() {
    setEditingOffer(null);
    setTitle("");
    setBadge("عرض مميز 🔥");
    setDiscount("خصم 30%");
    setPrice("350");
    setOldPrice("500");
    setCurrency("ج.م");
    setDuration("خلال 12 ساعة");
    setDesc("");
    setFeaturesText("رفع فوري ومباشر\nلعب يدوي 100%\nدعم فني ومتابعة مستمرة");
    setHighlight(false);
    setActive(true);
    setSortOrder(offers.length + 1);
    setIsModalOpen(true);
  }

  function openEditModal(offer: OfferDoc) {
    setEditingOffer(offer);
    setTitle(offer.title);
    setBadge(offer.badge || "");
    setDiscount(offer.discount);
    setPrice(offer.price);
    setOldPrice(offer.oldPrice || "");
    setCurrency(offer.currency);
    setDuration(offer.duration || "");
    setDesc(offer.desc);
    setFeaturesText((offer.features || []).join("\n"));
    setHighlight(offer.highlight);
    setActive(offer.active);
    setSortOrder(offer.sortOrder || 1);
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !price.trim()) return;

    setSaving(true);
    try {
      const features = featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      const offerData: Partial<OfferDoc> = {
        title: title.trim(),
        badge: badge.trim() || undefined,
        discount: discount.trim(),
        price: price.trim(),
        oldPrice: oldPrice.trim() || undefined,
        currency: currency.trim() || "ج.م",
        duration: duration.trim() || undefined,
        desc: desc.trim(),
        features,
        highlight,
        active,
        sortOrder: Number(sortOrder) || 1,
        updatedAt: new Date().toISOString(),
      };

      let updatedList: OfferDoc[];

      if (editingOffer) {
        const updatedOffer: OfferDoc = {
          ...editingOffer,
          ...offerData,
        };
        updatedList = offers.map((o) => (o.id === editingOffer.id ? updatedOffer : o));
        setOffers(updatedList);
        saveOffersToLocal(updatedList);

        try {
          await updateDoc(doc(db, "offers", editingOffer.id), offerData);
          if (session) {
            await logActivity({
              adminUid: session.user.uid,
              adminName: session.admin.displayName,
              action: "offer_updated",
              entityType: "settings",
              entityId: editingOffer.id,
              before: editingOffer as unknown as Record<string, unknown>,
              after: offerData as unknown as Record<string, unknown>,
            });
          }
        } catch (dbErr) {
          console.warn("Firestore updateDoc failed, retained in local storage:", dbErr);
        }

        setIsModalOpen(false);
        await appAlert({
          title: "تم تحديث العرض بنجاح",
          message: `تم حفظ تعديلات "${title}" وتحديث بياناتها في الموقع.`,
          type: "success",
          confirmText: "رائع",
        });
      } else {
        const newId = `offer-${Date.now()}`;
        const newOffer: OfferDoc = {
          ...(offerData as OfferDoc),
          id: newId,
          createdAt: new Date().toISOString(),
        };
        updatedList = [...offers, newOffer];
        setOffers(updatedList);
        saveOffersToLocal(updatedList);

        try {
          await setDoc(doc(db, "offers", newId), newOffer);
          if (session) {
            await logActivity({
              adminUid: session.user.uid,
              adminName: session.admin.displayName,
              action: "offer_created",
              entityType: "settings",
              entityId: newId,
              after: newOffer as unknown as Record<string, unknown>,
            });
          }
        } catch (dbErr) {
          console.warn("Firestore setDoc failed, retained in local storage:", dbErr);
        }

        setIsModalOpen(false);
        await appAlert({
          title: "تم إنشاء العرض بنجاح",
          message: `تم إضافة باقة "${title}" إلى قائمة العروض والتخفيضات.`,
          type: "success",
          confirmText: "حسناً",
        });
      }
    } catch (err) {
      console.error("Failed to save offer:", err);
      await appAlert({
        title: "خطأ في حفظ العرض",
        message: "تعذر إتمام عملية الحفظ. يرجى مراجعة البيانات المدخلة والمحاولة ثانية.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(offer: OfferDoc) {
    try {
      const nextActive = !offer.active;
      const updatedList = offers.map((o) => (o.id === offer.id ? { ...o, active: nextActive } : o));
      setOffers(updatedList);
      saveOffersToLocal(updatedList);

      await updateDoc(doc(db, "offers", offer.id), {
        active: nextActive,
        updatedAt: new Date().toISOString(),
      }).catch((err) => console.warn("Firestore toggle active error:", err));
    } catch (err) {
      console.error("Failed to toggle offer active state:", err);
    }
  }

  async function handleDelete(offer: OfferDoc) {
    const confirmed = await appConfirm({
      title: "تأكيد حذف العرض",
      message: `هل أنت متأكد من رغبتك في حذف العرض "${offer.title}"؟ سيتم إزالته من المتجر نهائياً.`,
      confirmText: "نعم، حذف العرض",
      cancelText: "إلغاء",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      // Immediate optimistic update
      const updatedList = offers.filter((o) => o.id !== offer.id);
      setOffers(updatedList);
      saveOffersToLocal(updatedList);

      try {
        await deleteDoc(doc(db, "offers", offer.id));
        if (session) {
          await logActivity({
            adminUid: session.user.uid,
            adminName: session.admin.displayName,
            action: "offer_deleted",
            entityType: "settings",
            entityId: offer.id,
            before: offer as unknown as Record<string, unknown>,
          }).catch(() => {});
        }
      } catch (dbErr) {
        console.warn("Firestore deleteDoc failed (retained in local cache):", dbErr);
      }

      await appAlert({
        title: "تم الحذف بنجاح",
        message: `تم حذف العرض "${offer.title}" بنجاح ولم يعد يظهر للزوار.`,
        type: "success",
        confirmText: "تم",
      });
    } catch (err) {
      console.error("Failed to delete offer:", err);
      await appAlert({
        title: "تعذر الحذف",
        message: "حدث خطأ أثناء محاولة حذف العرض، يرجى المحاولة مرة أخرى.",
        type: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-fg flex items-center gap-2.5">
            <Flame className="size-6 text-warn" />
            <span>إدارة العروض والباقات</span>
          </h1>
          <p className="text-sm text-muted mt-1">
            تحكم بالعروض الظاهرة لزوار الموقع في صفحة /offers وتعديل الأسعار والخصومات
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-extrabold shadow-sm"
        >
          <Plus className="size-4" />
          <span>إضافة عرض جديد</span>
        </button>
      </div>

      {/* Offers Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <Flame className="mx-auto size-12 text-muted mb-3" />
          <h3 className="text-lg font-bold text-fg">لا توجد عروض حالياً</h3>
          <p className="text-sm text-muted mt-1 mb-4">ابدأ بإضافة باقات وعروض لعملائك</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold"
          >
            <Plus className="size-4" />
            <span>إضافة عرض</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`relative flex flex-col justify-between rounded-3xl border transition-all p-6 ${
                offer.highlight
                  ? "border-primary/50 bg-card shadow-[0_0_25px_rgba(139,92,246,0.15)] ring-1 ring-primary/30"
                  : "border-border bg-card shadow-sm hover:border-primary/30"
              } ${!offer.active ? "opacity-60" : ""}`}
            >
              <div>
                {/* Badges row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {offer.badge ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warn/10 border border-warn/20 px-3 py-0.5 text-xs font-black text-warn">
                      {offer.badge}
                    </span>
                  ) : <span />}

                  <div className="flex items-center gap-1.5">
                    {offer.highlight && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                        <Sparkles className="size-3" />
                        مميز
                      </span>
                    )}
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                        offer.active
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      {offer.active ? "مفعل" : "معطل"}
                    </span>
                  </div>
                </div>

                {/* Title & Desc */}
                <h3 className="text-xl font-black text-fg mb-2">{offer.title}</h3>
                <p className="text-xs text-muted leading-relaxed mb-4">{offer.desc}</p>

                {/* Price Box */}
                <div className="rounded-2xl bg-surface p-3.5 mb-4 border border-border/70 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5 font-black">
                      <span className="text-2xl text-fg">{offer.price}</span>
                      <span className="text-xs text-muted">{offer.currency}</span>
                      {offer.oldPrice && (
                        <span className="text-xs text-muted line-through mr-1">
                          {offer.oldPrice}
                        </span>
                      )}
                    </div>
                    {offer.duration && (
                      <div className="text-[11px] text-muted font-semibold mt-0.5">
                        ⏱️ {offer.duration}
                      </div>
                    )}
                  </div>
                  <span className="rounded-xl bg-warn/15 px-3 py-1 text-xs font-black text-warn">
                    {offer.discount}
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-1.5 mb-6">
                  {offer.features?.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-muted font-medium">
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
                <button
                  type="button"
                  onClick={() => toggleActive(offer)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-fg transition"
                  title={offer.active ? "تعطيل العرض" : "تفعيل العرض"}
                >
                  {offer.active ? <Eye className="size-4 text-emerald-500" /> : <EyeOff className="size-4" />}
                  <span>{offer.active ? "ظاهر" : "مخفي"}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(offer)}
                    className="rounded-xl border border-border p-2 text-muted hover:text-primary hover:border-primary transition"
                    title="تعديل العرض"
                  >
                    <Edit2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(offer)}
                    className="rounded-xl border border-border p-2 text-muted hover:text-rose-500 hover:border-rose-500 transition"
                    title="حذف العرض"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl my-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute left-5 top-5 rounded-full p-1.5 text-muted hover:bg-surface hover:text-fg transition"
            >
              <X className="size-5" />
            </button>

            <h2 className="text-xl font-black text-fg mb-4 flex items-center gap-2">
              <Flame className="size-5 text-warn" />
              <span>{editingOffer ? "تعديل العرض" : "إضافة عرض جديد"}</span>
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1">عنوان العرض *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: باقة الديفيجن الأول الشاملة"
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-fg outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">شارة العرض (Badge)</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="مثال: الأكثر توفيراً 🔥"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">نسبة الخصم</label>
                  <input
                    type="text"
                    required
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="مثال: خصم 30%"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">السعر بعد الخصم *</label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="450"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">السعر قبل الخصم</label>
                  <input
                    type="text"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value)}
                    placeholder="650"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">العملة</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="ج.م"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">مدة التنفيذ</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="مثال: أقل من 12 ساعة"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">ترتيب الظهور</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1">وصف العرض</label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="وصف تفصيلي للباقة وما يشمله العرض..."
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  المميزات (كل ميزة في سطر منفصل)
                </label>
                <textarea
                  rows={4}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="رفع مباشر ومضمون للديفيجن الأول&#10;لعب يدوي بواسطة أفضل مصنفي السيرفر&#10;متابعة لحظية ومباشرة للطلب"
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-primary font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-fg">
                  <input
                    type="checkbox"
                    checked={highlight}
                    onChange={(e) => setHighlight(e.target.checked)}
                    className="size-4 rounded accent-primary"
                  />
                  <span>تمييز العرض (Highlighted Box)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-fg">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="size-4 rounded accent-primary"
                  />
                  <span>تفعيل العرض للزوار</span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl border border-border px-5 py-2.5 text-xs font-bold text-muted hover:bg-surface transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary rounded-2xl px-6 py-2.5 text-xs font-extrabold shadow-sm"
                >
                  {saving ? "جاري الحفظ..." : editingOffer ? "حفظ التعديلات" : "إضافة العرض"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
