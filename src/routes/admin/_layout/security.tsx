import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Lock,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/_layout/security")({
  component: AdminSecurityPage,
});

interface SecuritySettings {
  maxOrdersPerSession: number;
  orderCooldownSeconds: number;
  requireTelegramAt: boolean;
  enableAntiSpam: boolean;
  updatedAt: string;
}

function AdminSecurityPage() {
  const { session } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [maxOrders, setMaxOrders] = useState(3);
  const [cooldownSeconds, setCooldownSeconds] = useState(30);
  const [requireTgAt, setRequireTgAt] = useState(true);
  const [antiSpamEnabled, setAntiSpamEnabled] = useState(true);

  // Role Gate: OWNER only
  if (session && session.role !== "OWNER") {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center space-y-3">
        <ShieldAlert className="size-12 text-warn" />
        <h2 className="text-xl font-bold text-fg">غير مصرح بالدخول</h2>
        <p className="text-xs text-muted">
          إعدادات وسياسات الأمان مخصصة لمالك المنصة الرئيسي (OWNER) فقط.
        </p>
      </div>
    );
  }

  useEffect(() => {
    async function loadSecurity() {
      try {
        const snap = await getDoc(doc(db, "settings", "security"));
        if (snap.exists()) {
          const data = snap.data() as SecuritySettings;
          setMaxOrders(data.maxOrdersPerSession ?? 3);
          setCooldownSeconds(data.orderCooldownSeconds ?? 30);
          setRequireTgAt(data.requireTelegramAt ?? true);
          setAntiSpamEnabled(data.enableAntiSpam ?? true);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    void loadSecurity();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session || session.role !== "OWNER") return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      const data: SecuritySettings = {
        maxOrdersPerSession: Number(maxOrders),
        orderCooldownSeconds: Number(cooldownSeconds),
        requireTelegramAt: requireTgAt,
        enableAntiSpam: antiSpamEnabled,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "settings", "security"), data);
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: "تحديث سياسات الأمان والحماية ضد السبام",
        entityType: "settings",
        entityId: "security",
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-fg">سياسات الأمان والحماية</h1>
        <p className="text-sm text-muted">
          التحكم في قيود مكافحة السبام (Anti-spam) وقيود تقديم الطلبات (خاص بالمالك OWNER)
        </p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5 text-xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-bold text-sm text-fg flex items-center gap-2">
              <ShieldCheck className="size-4 text-ok" />
              نظام الحماية من الطلبات الوهمية والسبام
            </h2>
            <p className="text-muted text-[11px]">
              تفعيل الفلاتر التلقائية لمنع الهجمات المتكررة على نموذج تقديم الطلبات
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAntiSpamEnabled(!antiSpamEnabled)}
            className={`rounded-full px-3 py-1 font-bold text-xs transition ${
              antiSpamEnabled ? "bg-ok text-white" : "bg-surface text-muted"
            }`}
          >
            {antiSpamEnabled ? "مفعل" : "معطل"}
          </button>
        </div>

        <div>
          <label className="mb-1 block font-bold text-fg">
            الحد الأقصى للطلبات لكل جلسة متصفح (Session Order Limit)
          </label>
          <input
            type="number"
            min={1}
            max={10}
            required
            value={maxOrders}
            onChange={(e) => setMaxOrders(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 outline-none focus:border-primary"
          />
          <p className="mt-1 text-[11px] text-muted">
            الافتراضي 3 طلبات. عند الوصول للحد الأقصى يُطلب من العميل التواصل المباشر عبر تليجرام.
          </p>
        </div>

        <div>
          <label className="mb-1 block font-bold text-fg">
            فترة الانتظار الإلزامية بين كل طلب وآخر (Cooldown بالثواني)
          </label>
          <input
            type="number"
            min={5}
            max={300}
            required
            value={cooldownSeconds}
            onChange={(e) => setCooldownSeconds(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 outline-none focus:border-primary"
          />
          <p className="mt-1 text-[11px] text-muted">
            الافتراضي 30 ثانية لتجنب النقرات المتكررة وإرسال الطلبات المزدوجة.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="tgCheck"
            checked={requireTgAt}
            onChange={(e) => setRequireTgAt(e.target.checked)}
            className="size-4 rounded text-primary"
          />
          <label htmlFor="tgCheck" className="font-bold text-fg cursor-pointer">
            إلزام العميل ببدء يوزر التليجرام بعلامة @ (مثل @Rodrigo)
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-ok">
              <Check className="size-4" />
              تم حفظ سياسات الأمان بنجاح!
            </span>
          )}
          <div className="mr-auto">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-2.5 font-bold shadow-sm disabled:opacity-50"
            >
              <Save className="size-4" />
              {saving ? "جاري الحفظ..." : "حفظ السياسات"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
