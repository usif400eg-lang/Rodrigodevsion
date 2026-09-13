import { createFileRoute } from "@tanstack/react-router";
import {
  Copy,
  Edit2,
  Eye,
  EyeOff,
  Package,
  Plus,
  Star,
  Trash2,
  Upload,
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
import { uploadFileToStorage } from "@/lib/firebase-storage";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import type { FormDoc, ServiceDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/admin/_layout/services")({
  component: AdminServicesPage,
});

function AdminServicesPage() {
  const { session } = useAdminStore();
  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [forms, setForms] = useState<FormDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDoc | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(300);
  const [oldPrice, setOldPrice] = useState<number | undefined>(undefined);
  const [currency, setCurrency] = useState("EGP");
  const [estimatedTime, setEstimatedTime] = useState("24-48 ساعة");
  const [badge, setBadge] = useState("");
  const [type, setType] = useState<"division_boost" | "player_guarantee">("division_boost");
  const [formId, setFormId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(1);

  // Listen to services
  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("sortOrder", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setServices(snap.docs.map((d) => d.data() as ServiceDoc));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load available forms
  useEffect(() => {
    async function loadForms() {
      try {
        const snap = await getDocs(collection(db, "forms"));
        setForms(snap.docs.map((d) => d.data() as FormDoc));
      } catch (err) {
        console.warn("Could not load forms:", err);
      }
    }
    void loadForms();
  }, []);

  function openCreateModal() {
    setEditingService(null);
    setName("");
    setSlug("");
    setDescription("");
    setPrice(300);
    setOldPrice(undefined);
    setCurrency("EGP");
    setEstimatedTime("24-48 ساعة");
    setBadge("");
    setType("division_boost");
    setFormId("");
    setImages(["/badges/div-1.svg"]);
    setFeatured(false);
    setSortOrder(services.length + 1);
    setIsModalOpen(true);
  }

  function openEditModal(svc: ServiceDoc) {
    setEditingService(svc);
    setName(svc.name);
    setSlug(svc.slug);
    setDescription(svc.description);
    setPrice(svc.price);
    setOldPrice(svc.oldPrice);
    setCurrency(svc.currency);
    setEstimatedTime(svc.estimatedTime);
    setBadge(svc.badge || "");
    setType(svc.type);
    setFormId(svc.formId || "");
    setImages(svc.images || []);
    setFeatured(svc.featured);
    setSortOrder(svc.sortOrder);
    setIsModalOpen(true);
  }

  async function handleSaveService(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    try {
      const now = new Date().toISOString();
      const serviceId = editingService ? editingService.id : doc(collection(db, "services")).id;

      const svcData: ServiceDoc = {
        id: serviceId,
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/\s+/g, "-"),
        description: description.trim(),
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : undefined,
        currency: currency.trim(),
        estimatedTime: estimatedTime.trim(),
        badge: badge.trim() || undefined,
        type,
        images: images.length > 0 ? images : ["/badges/div-1.svg"],
        formId: formId || undefined,
        active: editingService ? editingService.active : true,
        featured,
        sortOrder: Number(sortOrder),
        createdAt: editingService ? editingService.createdAt : now,
        updatedAt: now,
      };

      await setDoc(doc(db, "services", serviceId), svcData);

      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: editingService ? `تعديل خدمة ${name}` : `إضافة خدمة جديدة ${name}`,
        entityType: "service",
        entityId: serviceId,
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save service:", err);
    }
  }

  async function handleToggleActive(svc: ServiceDoc) {
    if (!session) return;
    try {
      await updateDoc(doc(db, "services", svc.id), {
        active: !svc.active,
        updatedAt: new Date().toISOString(),
      });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `${svc.active ? "تعطيل" : "تفعيل"} خدمة ${svc.name}`,
        entityType: "service",
        entityId: svc.id,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDuplicate(svc: ServiceDoc) {
    if (!session) return;
    try {
      const newRef = doc(collection(db, "services"));
      const copy: ServiceDoc = {
        ...svc,
        id: newRef.id,
        name: `${svc.name} (نسخة)`,
        slug: `${svc.slug}-copy`,
        sortOrder: services.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(newRef, copy);
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `تكرار خدمة ${svc.name}`,
        entityType: "service",
        entityId: newRef.id,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(svc: ServiceDoc) {
    if (!session) return;
    if (session.role !== "OWNER") {
      alert("حذف الخدمات متاح للمالك الرئيسي (OWNER) فقط.");
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف الخدمة "${svc.name}" بشكل نهائي؟`)) return;

    try {
      await deleteDoc(doc(db, "services", svc.id));
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `حذف خدمة ${svc.name}`,
        entityType: "service",
        entityId: svc.id,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `services/${Date.now()}.${ext}`;
      const url = await uploadFileToStorage(path, file);
      setImages((prev) => [...prev, url]);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">إدارة الخدمات</h1>
          <p className="text-sm text-muted">
            التحكم في الخدمات المعروضة على الصفحة الرئيسية وأسعارها
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm"
        >
          <Plus className="size-4" />
          إضافة خدمة جديدة
        </button>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted">
          لا توجد خدمات مضافة بعد.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              className={`rounded-2xl border p-5 shadow-sm transition flex flex-col justify-between ${
                svc.active
                  ? "border-border bg-card"
                  : "border-border/60 bg-surface/60 opacity-70"
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-muted">
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">
                      {svc.sortOrder}
                    </span>
                    {svc.type === "division_boost" ? "رفع ديفيجن" : "ضمان لاعب"}
                  </span>
                  <div className="flex items-center gap-2">
                    {svc.featured && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        <Star className="size-3 fill-current" />
                        مميز
                      </span>
                    )}
                    {svc.badge && (
                      <span className="rounded-full bg-warn/10 px-2 py-0.5 text-[10px] font-bold text-warn">
                        {svc.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-extrabold text-fg">{svc.name}</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed min-h-8 line-clamp-2">
                  {svc.description}
                </p>

                {/* Price & Duration */}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-surface p-3 text-xs">
                  <div>
                    <span className="text-muted">السعر:</span>
                    <div className="font-extrabold text-primary text-base">
                      {svc.price}{" "}
                      <span className="text-[10px] text-muted font-normal">{svc.currency}</span>
                      {svc.oldPrice && (
                        <span className="mr-1.5 text-xs text-muted line-through">
                          {svc.oldPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-muted">المدة:</span>
                    <p className="font-semibold text-fg">{svc.estimatedTime}</p>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void handleToggleActive(svc)}
                    className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-fg transition"
                    title={svc.active ? "تعطيل الخدمة" : "تفعيل الخدمة"}
                  >
                    {svc.active ? <Eye className="size-4 text-ok" /> : <EyeOff className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(svc)}
                    className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary transition"
                    title="تعديل"
                  >
                    <Edit2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDuplicate(svc)}
                    className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-fg transition"
                    title="تكرار"
                  >
                    <Copy className="size-4" />
                  </button>
                </div>

                {session?.role === "OWNER" && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(svc)}
                    className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 transition"
                    title="حذف الخدمة"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-bg p-6 shadow-2xl my-8">
            <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-fg">
                {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-surface"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-fg">اسم الخدمة *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: Division 3 → Division 1"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-fg">الاسم اللطيف (Slug)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="division-3-to-1"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-fg">الوصف *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف تفصيلي للخدمة وشروطها..."
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-bold text-fg">السعر الحالي *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-fg">السعر قبل الخصم (اختياري)</label>
                  <input
                    type="number"
                    min={0}
                    value={oldPrice || ""}
                    onChange={(e) => setOldPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="مثال: 500"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-fg">العملة</label>
                  <input
                    type="text"
                    required
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-bold text-fg">مدة الإنجاز المقدرة</label>
                  <input
                    type="text"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    placeholder="24-48 ساعة"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-fg">شارة تميز (Badge)</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="الأكثر طلباً"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-fg">ترتيب الظهور</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-fg">نوع الخدمة</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "division_boost" | "player_guarantee")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  >
                    <option value="division_boost">رفع ديفيجن (Division Boost)</option>
                    <option value="player_guarantee">ضمان لاعب (Player Guarantee)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-fg">النموذج المرتبط (Form Builder)</label>
                  <select
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  >
                    <option value="">النموذج الافتراضي العام</option>
                    {forms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Images list & upload */}
              <div>
                <label className="mb-1 block font-bold text-fg">أيقونات / صور الخدمة</label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {images.map((src, i) => (
                    <div key={src + i} className="relative size-12 rounded-lg border border-border p-1 bg-surface">
                      <img src={src} alt="" className="size-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 rounded-full bg-red-600 text-white size-4 flex items-center justify-center text-[9px]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="size-12 rounded-lg border border-dashed border-border flex flex-col items-center justify-center cursor-pointer text-muted hover:border-primary">
                    <Upload className="size-4" />
                    <span className="text-[9px] mt-0.5">{uploadingImage ? "..." : "رفع"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={(e) => void handleUploadImage(e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded text-primary size-4"
                />
                <label htmlFor="featuredCheck" className="font-bold text-fg cursor-pointer">
                  تمييز الخدمة في الصفحة الرئيسية (Featured)
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 font-semibold text-muted hover:bg-surface"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-primary rounded-xl px-6 py-2 font-bold shadow-sm"
                >
                  حفظ الخدمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
