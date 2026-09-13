import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Clock,
  ExternalLink,
  Flame,
  Gamepad2,
  Layers,
  LogOut,
  PlusCircle,
  Settings,
  ShoppingBag,
  Sparkles,
  Trophy,
  User,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useCustomerAuth } from "@/lib/customer-auth";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

type CustomerOrder = {
  id: string;
  serviceName?: string;
  status: string;
  price?: number | string;
  createdAt?: string;
  trackingCode?: string;
};

function DashboardPage() {
  const { user, loading: authLoading, logout } = useCustomerAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [gameName, setGameName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/login" });
      return;
    }

    if (user) {
      const fetchUserData = async () => {
        try {
          // Fetch user customer profile
          const userDoc = await getDoc(doc(db, "customers", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setWalletBalance(data.walletBalance || 0);
            setGameName(data.gameName || "");
          }

          // Fetch orders made by this user (by email or customerUid)
          const q1 = query(
            collection(db, "orders"),
            where("customerEmail", "==", user.email?.toLowerCase() || "")
          );
          const snap = await getDocs(q1);
          const list: CustomerOrder[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              serviceName: data.serviceName || "خدمة eFootball",
              status: data.status || "pending",
              price: data.price || data.totalPrice || "0",
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString("ar-EG") : "حديثاً",
              trackingCode: data.trackingCode || d.id.slice(0, 8).toUpperCase(),
            };
          });
          setOrders(list);
        } catch (e) {
          console.warn("Error fetching dashboard data:", e);
        } finally {
          setLoading(false);
        }
      };

      void fetchUserData();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const activeOrdersCount = orders.filter((o) => o.status === "in_progress" || o.status === "pending").length;
  const completedOrdersCount = orders.filter((o) => o.status === "completed").length;

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1 py-10 sm:py-14 bg-gradient-to-b from-surface/40 via-bg to-bg">
        <div className="mx-auto max-w-6xl px-4">
          
          {/* ── Welcome Banner ── */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary-strong text-white font-black text-2xl shadow-md shadow-primary/20">
                {(user?.displayName?.[0] || user?.email?.[0] || "R").toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-fg">
                    أهلاً بك، {user?.displayName || "بطل eFootball"} 👋
                  </h1>
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-black text-primary">
                    عضو مميز
                  </span>
                </div>
                <p className="text-xs text-muted mt-1 font-medium">
                  {user?.email} {gameName ? `• اسم الفريق: ${gameName}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                to="/order"
                className="btn-primary inline-flex min-h-11 items-center gap-2 rounded-2xl px-5 text-xs font-extrabold shadow-sm"
              >
                <PlusCircle className="size-4" />
                <span>طلب خدمة جديدة</span>
              </Link>
              <Link
                to="/settings"
                className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-surface text-muted hover:text-fg hover:border-primary transition"
                title="الإعدادات"
              >
                <Settings className="size-5" />
              </Link>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted">إجمالي الطلبات</span>
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShoppingBag className="size-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-fg tracking-tight">
                {orders.length}
              </div>
              <div className="text-[11px] text-muted mt-1 font-medium">
                {completedOrdersCount} طلب مكتمل بنجاح
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted">طلبات قيد التنفيذ</span>
                <span className="flex size-9 items-center justify-center rounded-xl bg-warn/10 text-warn">
                  <Clock className="size-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-warn tracking-tight">
                {activeOrdersCount}
              </div>
              <div className="text-[11px] text-muted mt-1 font-medium">
                جاري العمل عليها حالياً
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted">رصيد المحفظة</span>
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Wallet className="size-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                {walletBalance} <span className="text-xs font-bold text-muted">ج.م</span>
              </div>
              <Link to="/wallet" className="text-[11px] text-primary font-bold mt-1 inline-block hover:underline">
                شحن أو إدارة المحفظة ←
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted">مستوى العضوية</span>
                <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <Trophy className="size-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-fg tracking-tight">
                PRO V.I.P
              </div>
              <div className="text-[11px] text-muted mt-1 font-medium">
                خصم 10% تلقائي على الخدمات
              </div>
            </div>
          </div>

          {/* ── Dashboard Quick Navigation & Content ── */}
          <div className="grid gap-8 lg:grid-cols-12">
            
            {/* Sidebar / Quick Menu (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-3xl border border-border bg-white p-5 shadow-sm space-y-1">
                <div className="text-xs font-extrabold text-muted px-3 py-2">
                  روابط سريعة
                </div>
                <Link
                  to="/my-orders"
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold text-fg hover:bg-surface hover:text-primary transition"
                >
                  <span className="flex items-center gap-3">
                    <ShoppingBag className="size-4 text-primary" />
                    <span>سجل طلباتي الكامل</span>
                  </span>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted">
                    {orders.length}
                  </span>
                </Link>

                <Link
                  to="/wallet"
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold text-fg hover:bg-surface hover:text-primary transition"
                >
                  <span className="flex items-center gap-3">
                    <Wallet className="size-4 text-emerald-600" />
                    <span>المحفظة والرصيد</span>
                  </span>
                  <span className="text-xs text-emerald-600 font-extrabold" dir="ltr">
                    {walletBalance} EGP
                  </span>
                </Link>

                <Link
                  to="/upgrades"
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold text-fg hover:bg-surface hover:text-primary transition"
                >
                  <span className="flex items-center gap-3">
                    <Gamepad2 className="size-4 text-primary" />
                    <span>تطويرات اللاعبين</span>
                  </span>
                  <span className="text-[10px] font-bold text-warn">جديد 🔥</span>
                </Link>

                <Link
                  to="/offers"
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold text-fg hover:bg-surface hover:text-primary transition"
                >
                  <span className="flex items-center gap-3">
                    <Flame className="size-4 text-warn" />
                    <span>العروض الترويجية</span>
                  </span>
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold text-fg hover:bg-surface hover:text-primary transition"
                >
                  <span className="flex items-center gap-3">
                    <Settings className="size-4 text-muted" />
                    <span>إعدادات الحساب</span>
                  </span>
                </Link>

                <div className="pt-2 border-t border-border mt-2">
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold text-warn hover:bg-warn/10 transition text-right"
                  >
                    <LogOut className="size-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>

              {/* Assistance Card */}
              <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 text-center">
                <Sparkles className="size-8 text-primary mx-auto mb-2" />
                <h3 className="text-sm font-black mb-1">تحتاج مساعدة خاصة؟</h3>
                <p className="text-xs text-muted mb-4 leading-relaxed">
                  تواصل مع مدير الحساب الخاص بك مباشرة لمتابعة طلبك أو حجز موعد لعب.
                </p>
                <Link
                  to="/contact"
                  className="btn-primary inline-flex min-h-10 items-center justify-center rounded-xl px-5 text-xs font-bold w-full"
                >
                  مراسلة الدعم الفني
                </Link>
              </div>
            </div>

            {/* Main Content Area: Recent Orders (8 cols) */}
            <div className="lg:col-span-8">
              <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-black text-fg">آخر الطلبات</h2>
                    <p className="text-xs text-muted">قائمة بأحدث العمليات والخدمات المطلوبة</p>
                  </div>
                  <Link
                    to="/my-orders"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>عرض الكل</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>

                {orders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                    <ShoppingBag className="size-10 text-muted mx-auto mb-3 opacity-40" />
                    <h3 className="text-sm font-bold text-fg mb-1">لا توجد طلبات سابقة حتى الآن</h3>
                    <p className="text-xs text-muted max-w-sm mx-auto mb-5">
                      ابدأ أول طلب لرفع حسابك إلى الديفيجن الأول أو الحصول على لاعبك المفضل الآن!
                    </p>
                    <Link
                      to="/order"
                      className="btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-xs font-extrabold shadow-sm"
                    >
                      طلب خدمة الآن
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((o) => (
                      <div
                        key={o.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface/50 p-4 hover:bg-surface transition"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-primary" dir="ltr">
                              #{o.trackingCode}
                            </span>
                            <span className="font-extrabold text-sm text-fg">
                              {o.serviceName}
                            </span>
                          </div>
                          <div className="text-xs text-muted font-medium">
                            تاريخ الطلب: {o.createdAt}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                            o.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : o.status === "in_progress"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {o.status === "completed" ? "مكتمل ✓" : o.status === "in_progress" ? "جاري اللعب ⏳" : "قيد المراجعة"}
                          </span>

                          <Link
                            to="/track"
                            search={{ id: o.trackingCode }}
                            className="rounded-xl bg-white border border-border px-3.5 py-1.5 text-xs font-bold text-fg hover:border-primary hover:text-primary transition shadow-sm"
                          >
                            تتبع
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
