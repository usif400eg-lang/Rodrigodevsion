import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Lock, LogIn, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useCustomerAuth } from "@/lib/customer-auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useCustomerAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      void navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      void navigate({ to: "/dashboard" });
    } catch (err: any) {
      console.warn("Login failed:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("بيانات الدخول غير صحيحة، يرجى التحقق من البريد وكلمة المرور.");
      } else if (err.code === "auth/too-many-requests") {
        setError("تم حظر المحاولات مؤقتاً لكثرة المحاولات الخاطئة، يرجى المحاولة لاحقاً.");
      } else {
        setError("تعذر تسجيل الدخول، يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center py-16 px-4 bg-gradient-to-b from-surface/50 via-bg to-bg">
        <div className="w-full max-w-md">
          {/* Top Logo and Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-white font-black text-2xl shadow-xl shadow-primary/25 mb-4">
              R
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mb-2">تسجيل الدخول</h1>
            <p className="text-xs text-muted">
              سجل دخولك لمتابعة طلباتك، إدارة محفظتك، وتحديث حسابك
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-3xl border border-border bg-white p-7 sm:p-9 shadow-lg">
            {error && (
              <div className="mb-5 rounded-2xl border border-warn/30 bg-warn/10 p-3.5 text-xs font-bold text-warn leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@domain.com"
                    dir="ltr"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-3 pl-11 text-sm outline-none focus:border-primary transition"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-fg">كلمة المرور</label>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-3 pl-11 text-sm outline-none focus:border-primary transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg transition"
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full min-h-12 items-center justify-center rounded-2xl text-sm font-extrabold shadow-md hover:shadow-primary/30 transition flex gap-2 pt-1"
              >
                <LogIn className="size-4" />
                <span>{submitting ? "جاري الدخول..." : "تسجيل الدخول"}</span>
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-xs text-muted mb-3 font-medium">
                ليس لديك حساب بعد؟
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-xs font-extrabold text-primary hover:underline"
              >
                <UserPlus className="size-3.5" />
                <span>إنشاء حساب جديد مجاناً</span>
              </Link>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
            <ShieldCheck className="size-4 text-primary" />
            <span>بياناتك محمية ومشفرة وفق أعلى معايير الأمان</span>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
