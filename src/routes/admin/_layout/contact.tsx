import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Clock,
  ExternalLink,
  MessageCircle,
  Phone,
  Save,
  ShieldAlert,
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import type { ContactSettingsDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/admin/_layout/contact")({
  component: AdminContactPage,
});

function AdminContactPage() {
  const { session } = useAdminStore();
  const [whatsapp, setWhatsapp] = useState("201012345678");
  const [telegram, setTelegram] = useState("RodrigoServices");
  const [botUsername, setBotUsername] = useState("");
  const [supportHours, setSupportHours] = useState("يومياً 10 صباحاً — 2 فجراً");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadContact() {
      try {
        const snap = await getDoc(doc(db, "settings", "contact"));
        if (snap.exists()) {
          const data = snap.data() as ContactSettingsDoc;
          setWhatsapp(data.whatsappNumber || "");
          setTelegram(data.telegramUsername || "");
          setBotUsername(data.telegramBotUsername || "");
          setSupportHours(data.supportHours || "");
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    void loadContact();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    setSaving(true);
    setSavedSuccess(false);

    try {
      const cleanTg = telegram.replace("@", "").trim();
      const cleanWa = whatsapp.replace(/[^0-9]/g, "").trim();

      const data: ContactSettingsDoc = {
        whatsappNumber: cleanWa,
        telegramUsername: cleanTg,
        telegramBotUsername: botUsername.replace("@", "").trim() || undefined,
        supportHours: supportHours.trim(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "settings", "contact"), data);
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: "تحديث بيانات وقنوات التواصل الرسمية",
        entityType: "settings",
        entityId: "contact",
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
        <h1 className="text-2xl font-extrabold text-fg">بيانات وقنوات التواصل</h1>
        <p className="text-sm text-muted">
          التحكم في أرقام وروابط التواصل (واتساب، تليجرام) المربوطة بالموقع وزر إتمام الطلب
        </p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary flex items-center gap-3">
        <ShieldAlert className="size-5 shrink-0" />
        <p>
          <strong>تنبيه أمني:</strong> لا تضع أبداً أي Telegram Bot Token أو مفاتيح سرية في هذه
          الصفحة أو في الموقع، بل فقط اسم المستخدم العام (Username) للتواصل.
        </p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5 text-xs">
        <div>
          <label className="mb-1 block font-bold text-fg flex items-center gap-2">
            <MessageCircle className="size-4 text-[#229ED9]" />
            اسم مستخدم تليجرام الرسمي (بدون @) *
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              required
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="RodrigoServices"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-mono outline-none focus:border-primary"
              dir="ltr"
            />
            {telegram && (
              <a
                href={`https://t.me/${telegram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="absolute left-3 text-xs font-bold text-[#229ED9] hover:underline flex items-center gap-1"
              >
                تجربة الرابط
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted">
            الرابط النهائي: https://t.me/{telegram.replace("@", "")}
          </p>
        </div>

        <div>
          <label className="mb-1 block font-bold text-fg flex items-center gap-2">
            <Phone className="size-4 text-[#25D366]" />
            رقم واتساب الرسمي مع الكود الدولي (بدون + أو مسافات) *
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="201012345678"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-mono outline-none focus:border-primary"
              dir="ltr"
            />
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="absolute left-3 text-xs font-bold text-[#25D366] hover:underline flex items-center gap-1"
              >
                تجربة الرابط
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted">
            الرابط النهائي: https://wa.me/{whatsapp.replace(/[^0-9]/g, "")}
          </p>
        </div>

        <div>
          <label className="mb-1 block font-bold text-fg flex items-center gap-2">
            <MessageCircle className="size-4 text-purple-600" />
            اسم مستخدم بوت تليجرام (اختياري - بدون توكن)
          </label>
          <input
            type="text"
            value={botUsername}
            onChange={(e) => setBotUsername(e.target.value)}
            placeholder="RodrigoBot"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-mono outline-none focus:border-primary"
            dir="ltr"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold text-fg flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            ساعات العمل والدعم الفني المعروضة للعملاء
          </label>
          <input
            type="text"
            value={supportHours}
            onChange={(e) => setSupportHours(e.target.value)}
            placeholder="يومياً 10 صباحاً — 2 فجراً"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-ok">
              <Check className="size-4" />
              تم حفظ بيانات وقنوات التواصل بنجاح!
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
