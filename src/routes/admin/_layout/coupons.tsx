import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  Check,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  Percent,
  Plus,
  Tag,
  Trash2,
  Users,
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
import type { CouponDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/admin/_layout/coupons")({
  component: AdminCouponsPage,
});

const COUPONS_STORAGE_KEY = "rodrigo_custom_coupons_v1";

function loadCouponsFromLocal(): CouponDoc[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COUPONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load local coupons:", e);
  }
  return null;
}

function saveCouponsToLocal(list: CouponDoc[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Failed to save local coupons:", e);
  }
}

const DEFAULT_COUPONS: CouponDoc[] = [
  {
    id: "coupon-rodrigo15",
    code: "RODRIGO15",
    discount: 15,
    maxUses: 500,
    usedCount: 42,
    expiresAt: "2026-12-31",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "coupon-efootball20",
    code: "EFOOTBALL20",
    discount: 20,
    maxUses: 100,
    usedCount: 18,
    expiresAt: "2026-10-30",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

function AdminCouponsPage() {
  const { session } = useAdminStore();
  const [coupons, setCoupons] = useState<CouponDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponDoc | null>(null);

  // Form Fields
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(15);
  const [maxUses, setMaxUses] = useState(100);
  const [expiresAt, setExpiresAt] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initial hydration from local cache
    const local = loadCouponsFromLocal();
    if (local && local.length > 0) {
      setCoupons(local);
      setLoading(false);
    }

    // 2. Firestore listener with fallback
    const q = query(collection(db, "coupons"));
    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) {
          if (!local || local.length === 0) {
            setCoupons(DEFAULT_COUPONS);
            saveCouponsToLocal(DEFAULT_COUPONS);
            try {
              for (const c of DEFAULT_COUPONS) {
                await setDoc(doc(db, "coupons", c.id), c);
              }
            } catch (e) {
              console.warn("Auto-seed coupons error:", e);
            }
          }
        } else {
          const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as CouponDoc);
          setCoupons(list);
          saveCouponsToLocal(list);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Coupons snapshot error, using defaults/local:", err);
        const fallback = loadCouponsFromLocal() || DEFAULT_COUPONS;
        setCoupons(fallback);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  function copyCode(c: CouponDoc) {
    navigator.clipboard.writeText(c.code);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openCreateModal() {
    setEditingCoupon(null);
    setCode("");
    setDiscount(15);
    setMaxUses(100);
    setExpiresAt("");
    setActive(true);
    setIsModalOpen(true);
  }

  function openEditModal(c: CouponDoc) {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscount(c.discount);
    setMaxUses(c.maxUses);
    setExpiresAt(c.expiresAt || "");
    setActive(c.active);
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setSaving(true);
    try {
      const cleanCode = code.trim().toUpperCase();
      const couponData: Partial<CouponDoc> = {
        code: cleanCode,
        discount: Number(discount),
        maxUses: Number(maxUses),
        expiresAt: expiresAt ? expiresAt : undefined,
        active,
        updatedAt: new Date().toISOString(),
      };

      let updatedList: CouponDoc[];

      if (editingCoupon) {
        const updatedCoupon: CouponDoc = {
          ...editingCoupon,
          ...couponData,
        };
        updatedList = coupons.map((c) => (c.id === editingCoupon.id ? updatedCoupon : c));
        setCoupons(updatedList);
        saveCouponsToLocal(updatedList);

        try {
          await updateDoc(doc(db, "coupons", editingCoupon.id), couponData);
          if (session) {
            await logActivity({
              adminUid: session.user.uid,
              adminName: session.admin.displayName,
              action: "coupon_updated",
              entityType: "settings",
              entityId: editingCoupon.id,
              before: editingCoupon as unknown as Record<string, unknown>,
              after: couponData as unknown as Record<string, unknown>,
            });
          }
        } catch (dbErr) {
          console.warn("Firestore coupon update error:", dbErr);
        }

        setIsModalOpen(false);
        await appAlert({
          title: "تم تعديل الكوبون بنجاح",
          message: `تم تحديث بيانات كوبون الخصم "${cleanCode}" وتفعيلها فوراً.`,
          type: "success",
          confirmText: "رائع",
        });
      } else {
        const newId = `coupon-${cleanCode.toLowerCase()}`;
        const newCoupon: CouponDoc = {
          ...(couponData as CouponDoc),
          id: newId,
          usedCount: 0,
          createdAt: new Date().toISOString(),
        };
        updatedList = [...coupons, newCoupon];
        setCoupons(updatedList);
        saveCouponsToLocal(updatedList);

        try {
          await setDoc(doc(db, "coupons", newId), newCoupon);
          if (session) {
            await logActivity({
              adminUid: session.user.uid,
              adminName: session.admin.displayName,
              action: "coupon_created",
              entityType: "settings",
              entityId: newId,
              after: newCoupon as unknown as Record<string, unknown>,
            });
          }
        } catch (dbErr) {
          console.warn("Firestore coupon create error:", dbErr);
        }

        setIsModalOpen(false);
        await appAlert({
          title: "تم إنشاء الكوبون بنجاح",
          message: `كوبون "${cleanCode}" بخصم ${discount}% أصبح جاهزاً للاستخدام.`,
          type: "success",
          confirmText: "تم",
        });
      }
    } catch (err) {
      console.error("Failed to save coupon:", err);
      await appAlert({
        title: "خطأ في حفظ الكوبون",
        message: "حدث خطأ غير متوقع أثناء حفظ الكوبون. يرجى التحقق والمحاولة ثانية.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: CouponDoc) {
    try {
      const nextActive = !c.active;
      const updatedList = coupons.map((item) => (item.id === c.id ? { ...item, active: nextActive } : item));
      setCoupons(updatedList);
      saveCouponsToLocal(updatedList);

      await updateDoc(doc(db, "coupons", c.id), {
        active: nextActive,
        updatedAt: new Date().toISOString(),
      }).catch((err) => console.warn("Firestore toggle coupon error:", err));
    } catch (err) {
      console.error("Failed to toggle coupon active state:", err);
    }
  }

  async function handleDelete(c: CouponDoc) {
    const confirmed = await appConfirm({
      title: "تأكيد حذف الكوبون",
      message: `هل أنت متأكد من رغبتك في حذف كود الخصم "${c.code}"؟ لن يتمكن العملاء من استخدامه بعد الآن.`,
      confirmText: "نعم، حذف الكوبون",
      cancelText: "إلغاء",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      const updatedList = coupons.filter((item) => item.id !== c.id);
      setCoupons(updatedList);
      saveCouponsToLocal(updatedList);

      try {
        await deleteDoc(doc(db, "coupons", c.id));
        if (session) {
          await logActivity({
            adminUid: session.user.uid,
            adminName: session.admin.displayName,
            action: "coupon_deleted",
            entityType: "settings",
            entityId: c.id,
            before: c as unknown as Record<string, unknown>,
          }).catch(() => {});
        }
      } catch (dbErr) {
        console.warn("Firestore coupon delete error:", dbErr);
      }

      await appAlert({
        title: "تم الحذف بنجاح",
        message: `تم حذف الكوبون "${c.code}" بنجاح.`,
        type: "success",
        confirmText: "حسناً",
      });
    } catch (err) {
      console.error("Failed to delete coupon:", err);
      await appAlert({
        title: "تعذر حذف الكوبون",
        message: "حدث خطأ أثناء محاولة حذف الكوبون.",
        type: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-fg flex items-center gap-2.5">
            <Tag className="size-6 text-primary" />
            <span>إدارة كوبونات الخصم</span>
          </h1>
          <p className="text-sm text-muted mt-1">
            أنشئ كوبونات خصم لعملائك بنسبة مئوية وحدد الحد الأقصى للاستخدام والصلاحية
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-extrabold shadow-sm"
        >
          <Plus className="size-4" />
          <span>إنشاء كوبون جديد</span>
        </button>
      </div>

      {/* Coupons Table / Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <Tag className="mx-auto size-12 text-muted mb-3" />
          <h3 className="text-lg font-bold text-fg">لا توجد كوبونات حالياً</h3>
          <p className="text-sm text-muted mt-1 mb-4">أنشئ أول كود خصم ترويجي لحملاتك</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold"
          >
            <Plus className="size-4" />
            <span>إنشاء كوبون</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <div
              key={c.id}
              className={`rounded-3xl border p-5 bg-card flex flex-col justify-between transition-all ${
                c.active
                  ? "border-border shadow-sm hover:border-primary/40 hover:shadow-md"
                  : "border-border/60 opacity-60 bg-surface/50"
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                      c.active
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                    }`}
                  >
                    {c.active ? "نشط" : "معطل"}
                  </span>

                  <span className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-black text-primary">
                    خصم {c.discount}%
                  </span>
                </div>

                {/* Code Box */}
                <div className="rounded-2xl border border-dashed border-primary/40 bg-surface p-3.5 flex items-center justify-between mb-4">
                  <div className="font-mono text-base font-black tracking-wider text-fg">
                    {c.code}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCode(c)}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-strong transition"
                    title="نسخ الكود"
                  >
                    {copiedId === c.id ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" />
                        <span className="text-emerald-500">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="rounded-xl bg-surface p-2 border border-border/60">
                    <div className="text-muted text-[10px] font-semibold mb-0.5">مرات الاستخدام</div>
                    <div className="font-black text-fg">
                      {c.usedCount || 0} / {c.maxUses}
                    </div>
                  </div>
                  <div className="rounded-xl bg-surface p-2 border border-border/60">
                    <div className="text-muted text-[10px] font-semibold mb-0.5">تاريخ الانتهاء</div>
                    <div className="font-black text-fg truncate">
                      {c.expiresAt ? c.expiresAt : "دائم / غير محدد"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between border-t border-border pt-3.5 mt-auto">
                <button
                  type="button"
                  onClick={() => toggleActive(c)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-fg transition"
                >
                  {c.active ? <Eye className="size-4 text-emerald-500" /> : <EyeOff className="size-4" />}
                  <span>{c.active ? "مفعل" : "معطل"}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="rounded-xl border border-border p-2 text-muted hover:text-primary hover:border-primary transition"
                    title="تعديل الكوبون"
                  >
                    <Edit2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    className="rounded-xl border border-border p-2 text-muted hover:text-rose-500 hover:border-rose-500 transition"
                    title="حذف الكوبون"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute left-5 top-5 rounded-full p-1.5 text-muted hover:bg-surface hover:text-fg transition"
            >
              <X className="size-5" />
            </button>

            <h2 className="text-xl font-black text-fg mb-4 flex items-center gap-2">
              <Tag className="size-5 text-primary" />
              <span>{editingCoupon ? "تعديل الكوبون" : "إنشاء كوبون جديد"}</span>
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1">كود الخصم *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="مثال: EFOOTBALL25"
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-mono font-black text-fg uppercase tracking-wider outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">نسبة الخصم (%) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-primary pl-8"
                    />
                    <Percent className="absolute left-3 top-2.5 size-4 text-muted" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted mb-1">الحد الأقصى للاستخدام</label>
                  <input
                    type="number"
                    min={1}
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1">تاريخ انتهاء الصلاحية</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg outline-none focus:border-primary"
                />
                <p className="text-[11px] text-muted mt-1">اتركه فارغاً إذا كان الكوبون بدون تاريخ انتهاء</p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-fg">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="size-4 rounded accent-primary"
                  />
                  <span>تفعيل الكوبون فوراً</span>
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
                  {saving ? "جاري الحفظ..." : editingCoupon ? "حفظ التعديلات" : "إنشاء الكوبون"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
