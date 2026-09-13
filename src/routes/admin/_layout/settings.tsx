import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Database,
  Download,
  Globe,
  ImageIcon,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { seedFirestoreIfEmpty } from "@/lib/firebase-seed";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import type { SeoSettingsDoc } from "@/lib/firebase-types";
import {
  SKILLS_META,
  SkillBoosterIcon,
  addExtraIcon,
  deleteExtraIcon,
  removeBoosterIcon,
  saveBoosterIcon,
  useBoosterIcons,
  useExtraIcons,
} from "@/lib/booster-icons";

export const Route = createFileRoute("/admin/_layout/settings")({
  component: AdminSettingsPage,
});


// ─── Booster Icon Manager ─────────────────────────────────────────────────────

function BoosterIconsSection() {
  const { session } = useAdminStore();
  const customIcons = useBoosterIcons();
  const extraIcons = useExtraIcons();

  // Fixed-skill states
  const [uploading, setUploading] = useState<number | null>(null);
  const [urlInputs, setUrlInputs] = useState<Record<number, string>>({});
  const [savingUrl, setSavingUrl] = useState<number | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Extra icons states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addingExtra, setAddingExtra] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [deletingExtraId, setDeletingExtraId] = useState<string | null>(null);
  const extraFileRef = useRef<HTMLInputElement | null>(null);

  // Tab
  const [tab, setTab] = useState<"fixed" | "extra">("fixed");

  // ── Fixed skill handlers ───────────────────────────────────────────────────
  async function handleFileUpload(index: number, file: File) {
    setUploading(index);
    try {
      const path = `booster-icons/skill_${index}_${Date.now()}.${file.name.split(".").pop()}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      await saveBoosterIcon(index, url);
      if (session) {
        await logActivity({
          adminUid: session.admin.uid,
          adminName: session.admin.displayName,
          action: `تحديث أيقونة البوستر: ${SKILLS_META[index]?.name}`,
          entityType: "settings",
          entityId: `boosterIcon_${index}`,
        });
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("فشل رفع الصورة. تأكد من صلاحيات Firebase Storage.");
    } finally {
      setUploading(null);
    }
  }

  async function handleSaveUrl(index: number) {
    const url = (urlInputs[index] || "").trim();
    if (!url) return;
    setSavingUrl(index);
    try {
      await saveBoosterIcon(index, url);
      setUrlInputs((prev) => ({ ...prev, [index]: "" }));
    } catch (err) {
      console.error("Save URL failed:", err);
      alert("فشل حفظ الرابط.");
    } finally {
      setSavingUrl(null);
    }
  }

  async function handleRemoveFixed(index: number) {
    if (!confirm("هل تريد إعادة الأيقونة الافتراضية؟")) return;
    setRemoving(index);
    try {
      const currentUrl = customIcons[index];
      if (currentUrl && currentUrl.includes("firebasestorage")) {
        try { await deleteObject(storageRef(storage, currentUrl)); } catch { /* external */ }
      }
      await removeBoosterIcon(index);
    } catch (err) {
      console.error("Remove failed:", err);
    } finally {
      setRemoving(null);
    }
  }

  // ── Extra icon handlers ────────────────────────────────────────────────────
  async function handleUploadExtraFile(file: File) {
    setUploadingExtra(true);
    try {
      const path = `booster-icons/extra_${Date.now()}.${file.name.split(".").pop()}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setNewUrl(url);
    } catch (err) {
      console.error("Extra icon upload failed:", err);
      alert("فشل رفع الصورة.");
    } finally {
      setUploadingExtra(false);
    }
  }

  async function handleAddExtra() {
    if (!newName.trim() || !newUrl.trim()) {
      alert("أدخل اسم الأيقونة ورابط الصورة أو ارفع صورة.");
      return;
    }
    setAddingExtra(true);
    try {
      await addExtraIcon(newName.trim(), newUrl.trim());
      setNewName("");
      setNewUrl("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Add extra icon failed:", err);
    } finally {
      setAddingExtra(false);
    }
  }

  async function handleDeleteExtra(id: string, url: string) {
    if (!confirm("هل تريد حذف هذه الأيقونة نهائياً؟")) return;
    setDeletingExtraId(id);
    try {
      if (url.includes("firebasestorage")) {
        try { await deleteObject(storageRef(storage, url)); } catch { /* ok */ }
      }
      await deleteExtraIcon(id);
    } catch (err) {
      console.error("Delete extra icon failed:", err);
    } finally {
      setDeletingExtraId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5 text-xs">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-fg flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            مكتبة الأيقونات (Booster Icons)
          </h2>
          <p className="text-muted mt-1">
            عدّل أيقونات المهارات الـ 9 أو أضف أيقونات إضافية حرة تستخدمها في بادجات اللاعبين.
          </p>
        </div>
        {tab === "extra" && (
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 font-bold text-white hover:bg-primary/90 transition shadow-sm"
          >
            {showAddForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
            {showAddForm ? "إلغاء" : "أيقونة جديدة"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-border overflow-hidden text-[11px] font-bold w-fit">
        <button
          type="button"
          onClick={() => setTab("fixed")}
          className={`px-4 py-2 transition ${tab === "fixed" ? "bg-primary text-white" : "bg-surface text-muted hover:text-fg"}`}
        >
          المهارات الـ 9 الثابتة
        </button>
        <button
          type="button"
          onClick={() => setTab("extra")}
          className={`px-4 py-2 transition flex items-center gap-1.5 ${tab === "extra" ? "bg-primary text-white" : "bg-surface text-muted hover:text-fg"}`}
        >
          أيقونات إضافية
          {extraIcons.length > 0 && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px]">{extraIcons.length}</span>
          )}
        </button>
      </div>

      {/* ── Fixed Skills Tab ── */}
      {tab === "fixed" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SKILLS_META.map((skill) => {
            const hasCustom = !!customIcons[skill.index];
            const isUploading = uploading === skill.index;
            const isSavingUrl = savingUrl === skill.index;
            const isRemoving = removing === skill.index;

            return (
              <div key={skill.id} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                    <SkillBoosterIcon index={skill.index} customUrl={customIcons[skill.index]} className="size-7 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-fg text-sm">{skill.name}</div>
                    <div className="text-muted truncate">{skill.enName}</div>
                    {hasCustom && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ok">
                        <Check className="size-3" /> مخصصة
                      </span>
                    )}
                  </div>
                  {hasCustom && (
                    <button
                      type="button"
                      onClick={() => void handleRemoveFixed(skill.index)}
                      disabled={isRemoving}
                      title="إعادة الأيقونة الافتراضية"
                      className="size-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                    >
                      {isRemoving ? <RefreshCw className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </button>
                  )}
                </div>

                {/* Upload */}
                <input
                  type="file" accept="image/*" className="hidden"
                  ref={(el) => { fileRefs.current[skill.index] = el; }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileUpload(skill.index, f); e.target.value = ""; }}
                />
                <button
                  type="button" disabled={isUploading}
                  onClick={() => fileRefs.current[skill.index]?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2 font-bold text-primary hover:bg-primary/10 transition disabled:opacity-50"
                >
                  {isUploading ? <><RefreshCw className="size-3.5 animate-spin" />جاري الرفع...</> : <><Upload className="size-3.5" />رفع من الجهاز</>}
                </button>

                {/* URL input */}
                <div className="flex gap-2">
                  <input
                    type="url" placeholder="أو الصق رابط..." dir="ltr"
                    value={urlInputs[skill.index] || ""}
                    onChange={(e) => setUrlInputs((prev) => ({ ...prev, [skill.index]: e.target.value }))}
                    className="flex-1 min-w-0 rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-primary placeholder:text-muted text-[11px]"
                  />
                  <button
                    type="button"
                    disabled={isSavingUrl || !(urlInputs[skill.index] || "").trim()}
                    onClick={() => void handleSaveUrl(skill.index)}
                    className="rounded-xl border border-primary bg-primary text-white px-3 py-2 font-bold hover:bg-primary/90 transition disabled:opacity-40"
                  >
                    {isSavingUrl ? <RefreshCw className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Extra Icons Tab ── */}
      {tab === "extra" && (
        <div className="space-y-4">
          {/* Add form */}
          {showAddForm && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="font-bold text-fg flex items-center gap-2">
                <Plus className="size-3.5 text-primary" />
                إضافة أيقونة جديدة
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-fg">اسم الأيقونة *</label>
                  <input
                    type="text" placeholder="مثال: Big Time, Legend..."
                    value={newName} onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-fg">رابط الصورة</label>
                  <div className="flex gap-2">
                    <input
                      type="url" dir="ltr" placeholder="https://..."
                      value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                      className="flex-1 min-w-0 rounded-xl border border-border bg-card px-3 py-2 outline-none focus:border-primary text-[11px]"
                    />
                    <input
                      type="file" accept="image/*" className="hidden"
                      ref={extraFileRef}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUploadExtraFile(f); e.target.value = ""; }}
                    />
                    <button
                      type="button" onClick={() => extraFileRef.current?.click()} disabled={uploadingExtra}
                      title="رفع صورة"
                      className="rounded-xl border border-border bg-card px-2.5 py-2 text-fg hover:border-primary hover:text-primary transition disabled:opacity-50"
                    >
                      {uploadingExtra ? <RefreshCw className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
              {newUrl && (
                <div className="flex items-center gap-3">
                  <img src={newUrl} alt="preview" className="size-10 rounded-lg object-contain border border-border bg-card" />
                  <span className="text-muted text-[10px]">معاينة الأيقونة</span>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button" onClick={() => { setShowAddForm(false); setNewName(""); setNewUrl(""); }}
                  className="rounded-xl border border-border px-4 py-2 font-semibold text-muted hover:bg-surface transition"
                >
                  إلغاء
                </button>
                <button
                  type="button" onClick={() => void handleAddExtra()} disabled={addingExtra || !newName.trim() || !newUrl.trim()}
                  className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-5 py-2 font-bold shadow-sm disabled:opacity-50"
                >
                  {addingExtra ? <><RefreshCw className="size-3.5 animate-spin" />جاري الحفظ...</> : <><Check className="size-3.5" />حفظ الأيقونة</>}
                </button>
              </div>
            </div>
          )}

          {/* Extra icons grid */}
          {extraIcons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
              <ImageIcon className="size-8 mx-auto mb-2 opacity-30" />
              لا توجد أيقونات إضافية بعد. اضغط "أيقونة جديدة" لإضافة أول أيقونة.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {extraIcons.map((icon) => (
                <div
                  key={icon.id}
                  className="relative group rounded-xl border border-border bg-surface p-3 flex flex-col items-center gap-2 text-center"
                >
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => void handleDeleteExtra(icon.id, icon.url)}
                    disabled={deletingExtraId === icon.id}
                    title="حذف الأيقونة"
                    className="absolute top-2 left-2 size-6 rounded-lg flex items-center justify-center bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingExtraId === icon.id ? <RefreshCw className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                  </button>

                  {/* Icon preview */}
                  <div className="size-14 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden">
                    <img src={icon.url} alt={icon.name} className="size-10 object-contain" />
                  </div>
                  <span className="font-bold text-fg text-[11px] leading-tight">{icon.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AdminSettingsPage() {
  const { session } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [savingSeo, setSavingSeo] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // SEO Fields
  const [title, setTitle] = useState("Rodrigo — خدمات eFootball Mobile");
  const [description, setDescription] = useState(
    "خدمات احترافية لرفع الديفيجن وضمان اللاعبين في eFootball Mobile. فريق متخصص، سرعة في التنفيذ، ودعم مستمر.",
  );
  const [keywords, setKeywords] = useState(
    "efootball, بيس موبايل, رفع ديفيجن, ضمان لاعبين, efootball mobile boost",
  );

  useEffect(() => {
    async function loadSeo() {
      try {
        const snap = await getDoc(doc(db, "settings", "seo"));
        if (snap.exists()) {
          const data = snap.data() as SeoSettingsDoc;
          setTitle(data.title || "");
          setDescription(data.description || "");
          setKeywords(data.keywords || "");
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    void loadSeo();
  }, []);

  async function handleSaveSeo(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSavingSeo(true);
    setSavedSuccess(false);

    try {
      const data: SeoSettingsDoc = {
        title: title.trim(),
        description: description.trim(),
        keywords: keywords.trim(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "settings", "seo"), data);
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: "تحديث إعدادات الـ SEO وبيانات محركات البحث",
        entityType: "settings",
        entityId: "seo",
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSeo(false);
    }
  }

  async function handleReSeed() {
    if (!session) return;
    if (!confirm("هل تريد تشغيل استيراد البيانات الأولية للخدمات واللاعبين والأسئلة إذا كانت فارغة؟")) return;

    setSeeding(true);
    try {
      await seedFirestoreIfEmpty();
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: "تشغيل استيراد البيانات الأولية (Seed)",
        entityType: "settings",
        entityId: "seed",
      });
      alert("تم فحص واستيراد البيانات الأولية بنجاح!");
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الاستيراد.");
    } finally {
      setSeeding(false);
    }
  }

  async function handleExportBackup() {
    setExporting(true);
    try {
      const collectionsToExport = ["services", "players", "faq", "forms", "questions", "orders"];
      const backupData: Record<string, unknown[]> = {};

      for (const colName of collectionsToExport) {
        const snap = await getDocs(collection(db, colName));
        backupData[colName] = snap.docs.map((d) => d.data());
      }

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rodrigo-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Backup export failed:", err);
      alert("فشل تصدير النسخة الاحتياطية.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-fg">الإعدادات العامة والـ SEO</h1>
        <p className="text-sm text-muted">
          إدارة الكلمات الدلالية ومحركات البحث وعمليات النسخ الاحتياطي وأيقونات البوسترات
        </p>
      </div>

      {/* Booster Icons Section */}
      <BoosterIconsSection />

      {/* SEO Card */}
      <form onSubmit={handleSaveSeo} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 text-xs">
        <h2 className="text-sm font-bold text-fg flex items-center gap-2">
          <Globe className="size-4 text-primary" />
          إعدادات محركات البحث والـ SEO
        </h2>

        <div>
          <label className="mb-1 block font-bold text-fg">عنوان الصفحة (Title Tag) *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold text-fg">وصف الموقع (Meta Description) *</label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface p-3 outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold text-fg">الكلمات المفتاحية (Keywords - مفصولة بفواصل)</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-ok">
              <Check className="size-4" />
              تم حفظ إعدادات الـ SEO بنجاح!
            </span>
          )}
          <div className="mr-auto">
            <button
              type="submit"
              disabled={savingSeo}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-2.5 font-bold shadow-sm disabled:opacity-50"
            >
              <Save className="size-4" />
              {savingSeo ? "جاري الحفظ..." : "حفظ إعدادات الـ SEO"}
            </button>
          </div>
        </div>
      </form>

      {/* Database & Backup Operations */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 text-xs">
        <h2 className="text-sm font-bold text-fg flex items-center gap-2">
          <Database className="size-4 text-primary" />
          قاعدة البيانات والنسخ الاحتياطي
        </h2>
        <p className="text-muted">
          إجراءات صيانة وتصدير كامل لقاعدة بيانات الخدمات، الطلبات، النماذج، واللاعبين
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => void handleExportBackup()}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 font-bold text-fg hover:bg-card hover:border-primary transition shadow-sm"
          >
            <Download className="size-4 text-primary" />
            {exporting ? "جاري التصدير..." : "تصدير نسخة احتياطية كاملة (JSON)"}
          </button>

          <button
            type="button"
            onClick={() => void handleReSeed()}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 font-bold text-muted hover:text-fg hover:bg-card transition shadow-sm"
          >
            <RefreshCw className="size-4" />
            {seeding ? "جاري الفحص..." : "استيراد البيانات الافتراضية إذا كانت فارغة"}
          </button>
        </div>
      </div>
    </div>
  );
}
