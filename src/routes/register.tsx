import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, User, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useCustomerAuth } from "@/lib/customer-auth";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { user, register } = useCustomerAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [phone, setPhone] = useState("");
  const [gameName, setGameName] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      void navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }
    if (password.length < 6) {
      setError("كلمة المرور يجب ألا تقل عن 6 أحرف.");
      return;
    }
    if (password !== confirmPass) {
      setError("كلمات المرور غير متطابقة.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("يرجى إدخال رقم الواتساب لتأكيد الطلبات.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const cred = await register(email, password, name);
      // Save extra customer profile details in Firestore
      if (cred?.user?.uid) {
        await setDoc(doc(db, "customers", cred.user.uid), {
          uid: cred.user.uid,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          gameName: gameName.trim() || "غير محدد",
          walletBalance: 0,
          createdAt: serverTimestamp(),
        }, { merge: true });
      }
      void navigate({ to: "/dashboard" });
    } catch (err: any) {
      console.warn("Registration error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("هذا البريد الإلكتروني مسجل بالفعل، يمكنك تسجيل الدخول بدلاً من ذلك.");
      } else if (err.code === "auth/invalid-email") {
        setError("صيغة البريد الإلكتروني غير صحيحة.");
      } else {
        setError("تعذر إنشاء الحساب، يرجى المحاولة مرة أخرى.");
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
          {/* Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-white font-black text-2xl shadow-xl shadow-primary/25 mb-4">
              R
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mb-2">إنشاء حساب جديد</h1>
            <p className="text-xs text-muted">
              انضم لمجتمع Rodrigo واستمتع بتتبع طلباتك وخدمات حصرية
            </p>
          </div>

          {/* Stepper indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`flex size-8 items-center justify-center rounded-full text-xs font-black transition ${
              step >= 1 ? "bg-primary text-white shadow-sm" : "bg-surface text-muted border border-border"
            }`}>
              1
            </div>
            <div className={`h-1 w-12 rounded-full transition ${
              step >= 2 ? "bg-primary" : "bg-border"
            }`} />
            <div className={`flex size-8 items-center justify-center rounded-full text-xs font-black transition ${
              step >= 2 ? "bg-primary text-white shadow-sm" : "bg-surface text-muted border border-border"
            }`}>
              2
            </div>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-border bg-white p-7 sm:p-9 shadow-lg">
            {error && (
              <div className="mb-5 rounded-2xl border border-warn/30 bg-warn/10 p-3.5 text-xs font-bold text-warn leading-relaxed">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-fg mb-1.5">
                    الاسم الكامل <span className="text-warn">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أحمد محمد"
                      className="w-full rounded-2xl border border-border bg-surface px-4 py-3 pl-11 text-sm outline-none focus:border-primary transition"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-fg mb-1.5">
                    البريد الإلكتروني <span className="text-warn">*</span>
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
                  <label className="block text-xs font-bold text-fg mb-1.5">
                    كلمة المرور (6 خانات على الأقل) <span className="text-warn">*</span>
                  </label>
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

                <div>
                  <label className="block text-xs font-bold text-fg mb-1.5">
                    تأكيد كلمة المرور <span className="text-warn">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      className="w-full rounded-2xl border border-border bg-surface px-4 py-3 pl-11 text-sm outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full min-h-12 items-center justify-center rounded-2xl text-sm font-extrabold shadow-md hover:shadow-primary/30 transition flex gap-2 pt-1"
                >
                  <span>المتابعة للخطوة التالية</span>
                  <ArrowLeft className="size-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-fg mb-1.5">
                    رقم الواتساب <span className="text-warn">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010XXXXXXXX أو مع كود الدولة"
                      dir="ltr"
                      className="w-full rounded-2xl border border-border bg-surface px-4 py-3 pl-11 text-sm outline-none focus:border-primary transition"
                    />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    يُستخدم لإرسال تحديثات تنفيذ طلباتك وأكواد الدخول السريعة
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-fg mb-1.5">
                    اسم المستخدم في لعبة eFootball (اختياري)
                  </label>
                  <input
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    placeholder="اسم فريقك أو حسابك داخل اللعبة"
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary transition"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 min-h-12 items-center justify-center rounded-2xl border border-border text-xs font-bold text-muted hover:text-fg hover:bg-surface transition flex"
                  >
                    رجوع
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex-1 min-h-12 items-center justify-center rounded-2xl text-sm font-extrabold shadow-md hover:shadow-primary/30 transition flex gap-2"
                  >
                    <UserPlus className="size-4" />
                    <span>{submitting ? "جاري الإنشاء..." : "إتمام إنشاء الحساب"}</span>
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-xs text-muted mb-2">لديك حساب بالفعل؟</p>
              <Link
                to="/login"
                className="text-xs font-extrabold text-primary hover:underline"
              >
                تسجيل الدخول إلى حسابك
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
