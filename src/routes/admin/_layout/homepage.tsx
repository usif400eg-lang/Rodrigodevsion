import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Eye,
  EyeOff,
  Home,
  Save,
  Sliders,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import type { SiteSettingsDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/admin/_layout/homepage")({
  component: AdminHomepageSettingsPage,
});

function AdminHomepageSettingsPage() {
  const { session } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Content
  const [heroHeadline, setHeroHeadline] = useState("العب أقل. وصل أكتر.");
  const [heroSub, setHeroSub] = useState(
    "خدمات احترافية لرفع الديفيجن وضمان اللاعبين في eFootball Mobile. فريق متخصص، سرعة في التنفيذ، ودعم مستمر.",
  );
  const [stat1Value, setStat1Value] = useState("+1200");
  const [stat1Label, setStat1Label] = useState("طلب مكتمل");
  const [stat2Value, setStat2Value] = useState("24/7");
  const [stat2Label, setStat2Label] = useState("دعم فني");
  const [stat3Value, setStat3Value] = useState("~18س");
  const [stat3Label, setStat3Label] = useState("متوسط الإنجاز");

  // Section Toggles
  const [showHero, setShowHero] = useState(true);
  const [showTrustStrip, setShowTrustStrip] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [showFaq, setShowFaq] = useState(true);
  const [showCta, setShowCta] = useState(true);
  const [showUpgrades, setShowUpgrades] = useState(true);

  // Maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "الموقع تحت الصيانة، نعود قريباً.",
  );

  useEffect(() => {
    async function loadSiteSettings() {
      try {
        const snap = await getDoc(doc(db, "settings", "site"));
        if (snap.exists()) {
          const d = snap.data() as SiteSettingsDoc;
          setHeroHeadline(d.heroHeadline || "العب أقل. وصل أكتر.");
          setHeroSub(d.heroSub || "");
          setStat1Value(d.stat1Value || "+1200");
          setStat1Label(d.stat1Label || "طلب مكتمل");
          setStat2Value(d.stat2Value || "24/7");
          setStat2Label(d.stat2Label || "دعم فني");
          setStat3Value(d.stat3Value || "~18س");
          setStat3Label(d.stat3Label || "متوسط الإنجاز");

          setShowHero(d.showHero !== false);
          setShowTrustStrip(d.showTrustStrip !== false);
          setShowServices(d.showServices !== false);
          setShowHowItWorks(d.showHowItWorks !== false);
          setShowFaq(d.showFaq !== false);
          setShowCta(d.showCta !== false);
          setShowUpgrades(d.showUpgrades !== false);

          setMaintenanceMode(!!d.maintenanceMode);
          setMaintenanceMessage(d.maintenanceMessage || "الموقع تحت الصيانة، نعود قريباً.");
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    void loadSiteSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      const data: SiteSettingsDoc = {
        siteName: "Rodrigo",
        tagline: "رودريجو — خدمات eFootball Mobile",
        heroHeadline: heroHeadline.trim(),
        heroSub: heroSub.trim(),
        stat1Value: stat1Value.trim(),
        stat1Label: stat1Label.trim(),
        stat2Value: stat2Value.trim(),
        stat2Label: stat2Label.trim(),
        stat3Value: stat3Value.trim(),
        stat3Label: stat3Label.trim(),
        showHero,
        showTrustStrip,
        showServices,
        showHowItWorks,
        showFaq,
        showCta,
        showUpgrades,
        maintenanceMode,
        maintenanceMessage: maintenanceMessage.trim(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "settings", "site"), data);
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: "تحديث إعدادات وأقسام الصفحة الرئيسية",
        entityType: "settings",
        entityId: "site",
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-extrabold text-fg">إعدادات الصفحة الرئيسية</h1>
        <p className="text-sm text-muted">
          التحكم في الأقسام المعروضة، نصوص الهيرو، الإحصائيات، ووضع الصيانة
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Maintenance Card */}
        <div className={`rounded-2xl border p-5 transition ${maintenanceMode ? "border-warn/40 bg-warn/5" : "border-border bg-card"}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-sm text-fg">وضع الصيانة (Maintenance Mode)</h2>
              <p className="text-xs text-muted">
                عند تفعيل هذا الخيار، سيتم حجب الموقع العام وعرض رسالة الصيانة للزوار
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode((v) => !v)}
              className={`rounded-full px-3 py-1 font-bold text-xs transition ${
                maintenanceMode ? "bg-warn text-white" : "bg-surface text-muted"
              }`}
            >
              {maintenanceMode ? "مفعل (الموقع مغلق)" : "معطل (الموقع متاح)"}
            </button>
          </div>
          {maintenanceMode && (
            <div className="mt-3">
              <label className="mb-1 block font-semibold text-fg">رسالة الصيانة المعروضة للزوار</label>
              <input
                type="text"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Section Toggles Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-fg flex items-center gap-2">
            <Sliders className="size-4 text-primary" />
            أقسام الصفحة الرئيسية (إظهار / إخفاء)
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToggleRow
              label="قسم البداية (Hero Section)"
              checked={showHero}
              onChange={setShowHero}
            />
            <ToggleRow
              label="شريط الثقة والمميزات (Trust Strip)"
              checked={showTrustStrip}
              onChange={setShowTrustStrip}
            />
            <ToggleRow
              label="قسم بطاقات الخدمات (Services Grid)"
              checked={showServices}
              onChange={setShowServices}
            />
            <ToggleRow
              label="قسم كيف نعمل؟ (How It Works)"
              checked={showHowItWorks}
              onChange={setShowHowItWorks}
            />
            <ToggleRow
              label="قسم الأسئلة الشائعة (FAQ)"
              checked={showFaq}
              onChange={setShowFaq}
            />
            <ToggleRow
              label="شريط الحث على الشراء (CTA Banner)"
              checked={showCta}
              onChange={setShowCta}
            />
          </div>
        </div>

        {/* Hero Section Content Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-fg">نصوص وبيانات الهيرو (Hero Section)</h2>

          <div>
            <label className="mb-1 block font-semibold text-fg">العنوان الرئيسي (Headline)</label>
            <input
              type="text"
              required
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-fg">الوصف الفرعي (Subtitle)</label>
            <textarea
              rows={3}
              required
              value={heroSub}
              onChange={(e) => setHeroSub(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface p-3 outline-none focus:border-primary"
            />
          </div>

          {/* Stats Triad */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
            <div className="rounded-xl bg-surface p-3 space-y-2">
              <span className="font-bold text-muted">الإحصائية 1</span>
              <input
                type="text"
                value={stat1Value}
                onChange={(e) => setStat1Value(e.target.value)}
                placeholder="+1200"
                className="w-full rounded-lg border border-border bg-card px-3 py-1.5 font-bold"
              />
              <input
                type="text"
                value={stat1Label}
                onChange={(e) => setStat1Label(e.target.value)}
                placeholder="طلب مكتمل"
                className="w-full rounded-lg border border-border bg-card px-3 py-1.5"
              />
            </div>

            <div className="rounded-xl bg-surface p-3 space-y-2">
              <span className="font-bold text-muted">الإحصائية 2</span>
              <input
                type="text"
                value={stat2Value}
                onChange={(e) => setStat2Value(e.target.value)}
                placeholder="24/7"
                className="w-full rounded-lg border border-border bg-card px-3 py-1.5 font-bold"
              />
              <input
                type="text"
                value={stat2Label}
                onChange={(e) => setStat2Label(e.target.value)}
                placeholder="دعم فني"
                className="w-full rounded-lg border border-border bg-card px-3 py-1.5"
              />
            </div>

            <div className="rounded-xl bg-surface p-3 space-y-2">
              <span className="font-bold text-muted">الإحصائية 3</span>
              <input
                type="text"
                value={stat3Value}
                onChange={(e) => setStat3Value(e.target.value)}
                placeholder="~18س"
                className="w-full rounded-lg border border-border bg-card px-3 py-1.5 font-bold"
              />
              <input
                type="text"
                value={stat3Label}
                onChange={(e) => setStat3Label(e.target.value)}
                placeholder="متوسط الإنجاز"
                className="w-full rounded-lg border border-border bg-card px-3 py-1.5"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-ok">
              <Check className="size-4" />
              تم حفظ إعدادات الصفحة الرئيسية بنجاح!
            </span>
          )}
          <div className="mr-auto">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-2.5 font-bold shadow-sm disabled:opacity-50"
            >
              <Save className="size-4" />
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface p-3">
      <span className="font-bold text-fg">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
          checked ? "bg-primary text-on-primary" : "bg-card text-muted border border-border"
        }`}
      >
        {checked ? "ظاهر" : "مخفي"}
      </button>
    </div>
  );
}
