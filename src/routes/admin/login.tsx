import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
} from "firebase/firestore";
import { Lock, Mail, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { useAdminSession } from "@/lib/admin-auth";
import type { AdminDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { session, loading: checkingSession } = useAdminSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup mode check: is admins collection empty?
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    if (session) {
      void navigate({ to: "/admin" });
    }
  }, [session, navigate]);

  useEffect(() => {
    async function checkAdmins() {
      try {
        const q = query(collection(db, "admins"), limit(1));
        const snap = await getDocs(q);
        setIsFirstSetup(snap.empty);
      } catch (err) {
        console.warn("Could not check admins collection:", err);
      } finally {
        setCheckingSetup(false);
      }
    }
    void checkAdmins();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isFirstSetup) {
        // Create initial OWNER admin account
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        const user = userCred.user;
        const adminData: AdminDoc = {
          uid: user.uid,
          email: user.email ?? email.trim(),
          displayName: displayName.trim() || "المالك الرئيسي",
          role: "OWNER",
          createdAt: new Date().toISOString(),
          active: true,
        };
        await setDoc(doc(db, "admins", user.uid), adminData);
        window.location.href = "/admin";
        return;
      }

      // Normal Login
      const userCred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const user = userCred.user;

      // Verify admin document
      const adminSnap = await getDoc(doc(db, "admins", user.uid));
      if (!adminSnap.exists()) {
        await auth.signOut();
        setError("هذا الحساب غير مسجل كمسؤول في النظام.");
        return;
      }

      const admin = adminSnap.data() as AdminDoc;
      if (!admin.active) {
        await auth.signOut();
        setError("تم تعطيل هذا الحساب. يرجى مراجعة إدارة المنصة.");
        return;
      }

      window.location.href = "/admin";
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.includes("user-not-found") ||
        msg.includes("wrong-password") ||
        msg.includes("invalid-credential")
      ) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      } else if (msg.includes("email-already-in-use")) {
        setError("هذا البريد الإلكتروني مسجل بالفعل.");
      } else {
        setError("حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession || checkingSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="size-10 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface/50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-bg p-8 shadow-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-2xl font-extrabold text-on-primary shadow-lg shadow-primary/20">
            R
          </div>
          <h1 className="text-2xl font-extrabold text-fg">لوحة إدارة Rodrigo</h1>
          <p className="mt-1 text-sm text-muted">
            {isFirstSetup
              ? "تهيئة حساب المالك الرئيسي (OWNER) للمرة الأولى"
              : "تسجيل الدخول للمشرفين والمديرين"}
          </p>
        </div>

        {isFirstSetup && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
            <Sparkles className="size-5 shrink-0" />
            <div>
              <p className="font-bold">مرحباً بك في Rodrigo!</p>
              <p className="mt-0.5 text-xs text-muted">
                لم يتم تسجيل أي حساب مالك بعد. الحساب الذي ستنشئه الآن سيحصل تلقائياً على رتبة
                المالك (OWNER) مع كامل الصلاحيات.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-warn/20 bg-warn/10 p-4 text-sm text-warn">
            <ShieldAlert className="size-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {isFirstSetup && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-fg">
                اسم المسؤول / المالك
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="مثال: رودريجو كينج"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold text-fg">
              البريد الإلكتروني
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rodrigo.com"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 pl-11 text-sm outline-none focus:border-primary"
                dir="ltr"
              />
              <Mail className="pointer-events-none absolute left-3 size-5 text-muted" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-fg">
              كلمة المرور
            </label>
            <div className="relative flex items-center">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 pl-11 text-sm outline-none focus:border-primary"
                dir="ltr"
              />
              <Lock className="pointer-events-none absolute left-3 size-5 text-muted" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 flex min-h-12 w-full items-center justify-center rounded-xl font-bold shadow-md disabled:opacity-60"
          >
            {loading
              ? "جاري التحقق..."
              : isFirstSetup
                ? "إنشاء حساب المالك والدخول"
                : "تسجيل الدخول"}
          </button>
        </form>

        <div className="mt-8 border-t border-border pt-4 text-center">
          <a
            href="/"
            className="text-xs font-semibold text-muted transition hover:text-primary"
          >
            ← العودة للموقع العام
          </a>
        </div>
      </div>
    </div>
  );
}
