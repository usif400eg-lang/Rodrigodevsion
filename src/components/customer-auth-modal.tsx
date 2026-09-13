import { Lock, Mail, User, X } from "lucide-react";
import { useState } from "react";
import { useCustomerAuth } from "@/lib/customer-auth";

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CustomerAuthModal({ isOpen, onClose, onSuccess }: CustomerAuthModalProps) {
  const { login, register } = useCustomerAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) {
        setError("هذا البريد مسجل مسبقاً. يرجى تسجيل الدخول.");
      } else if (msg.includes("wrong-password") || msg.includes("user-not-found") || msg.includes("invalid-credential")) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      } else if (msg.includes("weak-password")) {
        setError("كلمة المرور يجب أن لا تقل عن 6 أحرف.");
      } else {
        setError("حدث خطأ أثناء الاتصال، يرجى المحاولة لاحقاً.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-border bg-bg p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-on-primary">
              R
            </span>
            <h3 className="font-bold text-fg text-sm">
              {mode === "login" ? "تسجيل دخول العميل" : "إنشاء حساب عميل جديد"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-surface"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Optional notice */}
        <div className="mb-4 rounded-xl bg-primary/10 p-3 text-[11px] text-primary leading-relaxed">
          💡 <strong>تسجيل الدخول اختياري تماماً!</strong> يتيح لك حفظ طلباتك وتتبعها تلقائياً بدون
          الحاجة لكتابة رقم الطلب في كل مرة.
        </div>

        {/* Tab switch */}
        <div className="mb-4 flex rounded-xl border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
              mode === "login" ? "bg-bg text-primary shadow-sm" : "text-muted"
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
              mode === "register" ? "bg-bg text-primary shadow-sm" : "text-muted"
            }`}
          >
            حساب جديد
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-warn/20 bg-warn/10 p-3 text-xs text-warn">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === "register" && (
            <div>
              <label className="mb-1 block font-bold text-fg">الاسم</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="اسمك الكامل"
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 outline-none focus:border-primary"
                />
                <User className="pointer-events-none absolute left-3 size-4 text-muted" />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block font-bold text-fg">البريد الإلكتروني</label>
            <div className="relative flex items-center">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 pl-9 outline-none focus:border-primary"
                dir="ltr"
              />
              <Mail className="pointer-events-none absolute left-3 size-4 text-muted" />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-fg">كلمة المرور</label>
            <div className="relative flex items-center">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 pl-9 outline-none focus:border-primary"
                dir="ltr"
              />
              <Lock className="pointer-events-none absolute left-3 size-4 text-muted" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 flex min-h-11 w-full items-center justify-center rounded-xl font-bold shadow-sm text-xs disabled:opacity-50"
          >
            {loading ? "جاري المعالجة..." : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
          </button>
        </form>
      </div>
    </div>
  );
}
