import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  CreditCard,
  Gift,
  PlusCircle,
  ShieldCheck,
  Smartphone,
  Wallet as WalletIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useCustomerAuth } from "@/lib/customer-auth";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
});

type Transaction = {
  id: string;
  type: "deposit" | "order_payment" | "reward";
  amount: number;
  description: string;
  createdAt: string;
  status: "completed" | "pending";
};

function WalletPage() {
  const { user, loading: authLoading } = useCustomerAuth();
  const navigate = useNavigate();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [rechargeAmount, setRechargeAmount] = useState("100");
  const [rechargeMethod, setRechargeMethod] = useState<"vodafone" | "instapay">("vodafone");
  const [senderNumber, setSenderNumber] = useState("");
  const [recharging, setRecharging] = useState(false);
  const [rechargeSubmitted, setRechargeSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/login" });
      return;
    }

    if (user) {
      const loadWallet = async () => {
        try {
          const userDoc = await getDoc(doc(db, "customers", user.uid));
          if (userDoc.exists()) {
            setBalance(userDoc.data().walletBalance || 0);
          }

          // Fetch user transactions
          const q = query(
            collection(db, "wallet_transactions"),
            where("userId", "==", user.uid)
          );
          const snap = await getDocs(q);
          const list: Transaction[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              type: data.type || "deposit",
              amount: data.amount || 0,
              description: data.description || "معاملة محفظة",
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString("ar-EG") : "اليوم",
              status: data.status || "completed",
            };
          });
          setTransactions(list);
        } catch (e) {
          console.warn("Wallet fetch error:", e);
        } finally {
          setLoading(false);
        }
      };

      void loadWallet();
    }
  }, [user, authLoading, navigate]);

  const handleRechargeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!senderNumber.trim()) {
      setError("يرجى إدخال رقم المحفظة أو اسم المعرف المحول منه.");
      return;
    }
    setError(null);
    setRecharging(true);

    try {
      await addDoc(collection(db, "recharge_requests"), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || "عميل",
        amount: Number(rechargeAmount) || 100,
        method: rechargeMethod,
        senderNumber: senderNumber.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setRechargeSubmitted(true);
      setSenderNumber("");
    } catch (err) {
      setError("حدث خطأ أثناء إرسال طلب الشحن، يرجى المحاولة مرة أخرى.");
    } finally {
      setRecharging(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1 py-10 sm:py-16 bg-gradient-to-b from-surface/40 via-bg to-bg">
        <div className="mx-auto max-w-5xl px-4">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Link to="/dashboard" className="text-xs font-bold text-muted hover:text-primary">
                لوحة التحكم
              </Link>
              <span className="text-xs text-muted">/</span>
              <span className="text-xs font-bold text-primary">المحفظة</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-fg">
              محفظتي الإلكترونية
            </h1>
            <p className="text-xs text-muted mt-1">
              اشحن رصيدك مسبقاً للدفع الفوري بلمسة واحدة والاستفادة من عروض خاصة
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 items-start">
            
            {/* Balance and Recharge Card (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Balance Card */}
              <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#1e1035] p-7 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -left-10 -bottom-10 size-36 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-purple-200">
                    <WalletIcon className="size-4 text-primary" />
                    <span>الرصيد المتاح</span>
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-200">
                    Rodrigo Pay
                  </span>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {balance}
                    </span>
                    <span className="text-sm font-extrabold text-purple-300">جنيه مصري</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">
                    حساب: {user?.email}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium pt-4 border-t border-white/10">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <span>محفظتك مؤمنة ومحمية بالكامل</span>
                </div>
              </div>

              {/* Recharge Form */}
              <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                <h2 className="text-base font-black mb-1">طلب شحن الرصيد</h2>
                <p className="text-xs text-muted mb-4">
                  اختر المبلغ وطريقة التحويل وسنقوم بإضافة الرصيد فور المراجعة
                </p>

                {rechargeSubmitted ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                    <CheckCircle2 className="size-10 text-emerald-600 mx-auto mb-2" />
                    <h3 className="text-sm font-extrabold text-emerald-900 mb-1">
                      تم استلام طلب الشحن بنجاح!
                    </h3>
                    <p className="text-xs text-emerald-700 leading-relaxed mb-4">
                      جاري مراجعة التحويل وتأكيد إضافة الرصيد إلى محفظتك خلال دقائق قليلة.
                    </p>
                    <button
                      type="button"
                      onClick={() => setRechargeSubmitted(false)}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                    >
                      طلب شحن آخر
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRechargeRequest} className="space-y-4">
                    {error && (
                      <div className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs font-bold text-warn">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-fg mb-1.5">
                        المبلغ المطلوب شحنه (ج.م)
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {["100", "200", "500"].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setRechargeAmount(amt)}
                            className={`rounded-xl py-2 text-xs font-extrabold transition ${
                              rechargeAmount === amt
                                ? "bg-primary text-white shadow-sm"
                                : "border border-border bg-surface text-muted hover:text-fg"
                            }`}
                          >
                            {amt} ج.م
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="20"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs outline-none focus:border-primary transition font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-fg mb-1.5">
                        طريقة التحويل
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRechargeMethod("vodafone")}
                          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition border ${
                            rechargeMethod === "vodafone"
                              ? "border-rose-500 bg-rose-50 text-rose-700"
                              : "border-border bg-surface text-muted"
                          }`}
                        >
                          <Smartphone className="size-3.5" />
                          <span>فودافون كاش</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRechargeMethod("instapay")}
                          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition border ${
                            rechargeMethod === "instapay"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-border bg-surface text-muted"
                          }`}
                        >
                          <CreditCard className="size-3.5" />
                          <span>إنستاباي (InstaPay)</span>
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-surface border border-border p-3 text-xs space-y-1">
                      <div className="text-muted font-medium">حول المبلغ أولاً إلى الرقم التالي:</div>
                      <div className="flex items-center justify-between font-mono font-bold text-fg text-sm pt-1" dir="ltr">
                        <span>01018593455</span>
                        <span className="text-[10px] text-primary font-bold">فودافون كاش / إنستاباي</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-fg mb-1.5">
                        رقم المحفظة أو الحساب المحول منه <span className="text-warn">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        placeholder="رقم هاتفك الذي قمت بالتحويل منه"
                        dir="ltr"
                        className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs outline-none focus:border-primary transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={recharging}
                      className="btn-primary w-full min-h-11 items-center justify-center rounded-2xl text-xs font-extrabold shadow-sm flex gap-2"
                    >
                      <PlusCircle className="size-4" />
                      <span>{recharging ? "جاري الإرسال..." : "تأكيد إرسال طلب الشحن"}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Transactions History (7 cols) */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-black text-fg">سجل المعاملات</h2>
                    <p className="text-xs text-muted">تفاصيل عمليات الشحن والخصم السابقة</p>
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted">
                    <WalletIcon className="size-10 mx-auto mb-2 opacity-30" />
                    <h3 className="text-sm font-bold text-fg mb-1">لا توجد حركات سابقة</h3>
                    <p className="text-xs text-muted max-w-xs mx-auto">
                      ستظهر هنا جميع عمليات الشحن والمدفوعات فور إجرائها على المحفظة.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between rounded-2xl border border-border/80 bg-surface/50 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex size-10 items-center justify-center rounded-xl ${
                            tx.type === "deposit"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-rose-100 text-rose-600"
                          }`}>
                            {tx.type === "deposit" ? (
                              <ArrowDownLeft className="size-5" />
                            ) : (
                              <ArrowUpRight className="size-5" />
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-xs text-fg">
                              {tx.description}
                            </div>
                            <div className="text-[11px] text-muted font-medium">
                              {tx.createdAt}
                            </div>
                          </div>
                        </div>

                        <div className="text-left font-extrabold" dir="ltr">
                          <span className={`text-sm ${
                            tx.type === "deposit" ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            {tx.type === "deposit" ? "+" : "-"}{tx.amount} EGP
                          </span>
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
