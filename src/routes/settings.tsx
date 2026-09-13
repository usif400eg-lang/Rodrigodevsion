import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  KeyRound,
  Lock,
  LogOut,
  Moon,
  Phone,
  Save,
  ShieldAlert,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { updatePassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useCustomerAuth } from "@/lib/customer-auth";
import { auth, db } from "@/lib/firebase";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading: authLoading, logout } = useCustomerAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gameName, setGameName] = useState("");
  
  // Toggles
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifyOffers, setNotifyOffers] = useState(true);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/login" });
      return;
    }

    if (user) {
      setName(user.displayName || "");
      getDoc(doc(db, "customers", user.uid)).then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.phone) setPhone(d.phone);
          if (d.gameName) setGameName(d.gameName);
          if (d.notifyWhatsApp !== undefined) setNotifyWhatsApp(d.notifyWhatsApp);
          if (d.notifyOffers !== undefined) setNotifyOffers(d.notifyOffers);
        }
      }).catch(() => {});
    }
  }, [user, authLoading, navigate]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      await setDoc(
        doc(db, "customers", user.uid),
        {
          name: name.trim(),
          phone: phone.trim(),
          gameName: gameName.trim(),
          notifyWhatsApp,
          notifyOffers,
        },
        { merge: true }
      );

      // If new password entered
      if (newPassword.trim()) {
        if (newPassword.length < 6) {
          throw new Error("كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.");
        }
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, newPassword.trim());
          setPassSaved(true);
          setNewPassword("");
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حفظ التعديلات.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1 py-10 sm:py-16 bg-gradient-to-b from-surface/40 via-bg to-bg">
        <div className="mx-auto max-w-4xl px-4">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Link to="/dashboard" className="text-xs font-bold text-muted hover:text-primary">
                لوحة التحكم
              </Link>
              <span className="text-xs text-muted">/</span>
              <span className="text-xs font-bold text-primary">الإعدادات</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-fg">
              إعدادات الحساب
            </h1>
            <p className="text-xs text-muted mt-1">
              تحكم في معلومات ملفك الشخصي، تفضيلات التنبيهات، والأمان
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {saved && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                <span>تم حفظ التعديلات بنجاح!</span>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-warn/30 bg-warn/10 p-4 text-xs font-bold text-warn">
                {error}
              </div>
            )}

            {/* Profile Info Section */}
            <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-black text-fg mb-1">البيانات الشخصية</h2>
              <p className="text-xs text-muted mb-6">
                المعلومات الأساسية الخاصة بحسابك في متجر Rodrigo Divsion
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-fg mb-1.5">
                    الاسم المعروض
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اسمك"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs outline-none focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-fg mb-1.5">
                    البريد الإلكتروني (غير قابل للتعديل)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    dir="ltr"
                    className="w-full rounded-2xl border border-border bg-surface/50 px-4 py-2.5 text-xs text-muted outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-fg mb-1.5">
                    رقم الواتساب المعتمد
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    dir="ltr"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs outline-none focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-fg mb-1.5">
                    اسم الفريق داخل eFootball
                  </label>
                  <input
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    placeholder="اسم فريقك"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs outline-none focus:border-primary transition"
                  />
                </div>
              </div>
            </div>

            {/* Notification Toggles Section */}
            <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-black text-fg mb-1">تفضيلات الإشعارات</h2>
              <p className="text-xs text-muted mb-6">
                حدد الرسائل والتنبيهات التي ترغب في استلامها
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border/60">
                  <div>
                    <div className="text-xs font-bold text-fg">إشعارات الواتساب المباشرة</div>
                    <div className="text-[11px] text-muted">
                      استلام رسالة فورية عند بدء تنفيذ طلبك أو انتهائه
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyWhatsApp}
                    onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                    className="size-5 accent-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-xs font-bold text-fg">العروض والخصومات الحصرية</div>
                    <div className="text-[11px] text-muted">
                      تنبيهات عند إطلاق باقات تخفيض جديدة أو هدايا لاعبين
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOffers}
                    onChange={(e) => setNotifyOffers(e.target.checked)}
                    className="size-5 accent-primary cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-black text-fg mb-1">الأمان وكلمة المرور</h2>
              <p className="text-xs text-muted mb-4">
                اترك الحقل فارغاً إذا كنت لا ترغب في تغيير كلمة المرور الحالية
              </p>

              {passSaved && (
                <div className="mb-3 text-xs font-bold text-emerald-600">
                  ✓ تم تحديث كلمة المرور بنجاح.
                </div>
              )}

              <div className="max-w-md">
                <label className="block text-xs font-bold text-fg mb-1.5">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="اتركها فارغة لعدم التغيير"
                  dir="ltr"
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs outline-none focus:border-primary transition"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex min-h-12 items-center gap-2 rounded-2xl px-8 text-xs font-extrabold shadow-md hover:shadow-primary/30 transition"
              >
                <Save className="size-4" />
                <span>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</span>
              </button>

              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-6 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                <LogOut className="size-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </form>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
