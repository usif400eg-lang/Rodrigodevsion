import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock, ExternalLink, Filter, Package, PlusCircle, Search, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useCustomerAuth } from "@/lib/customer-auth";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/my-orders")({
  component: MyOrdersPage,
});

type OrderItem = {
  id: string;
  serviceName: string;
  status: string;
  price: number | string;
  createdAt: string;
  trackingCode: string;
  divisionCurrent?: string;
  divisionTarget?: string;
  playerName?: string;
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد المراجعة", color: "bg-slate-100 text-slate-700" },
  in_progress: { label: "جاري التنفيذ ⏳", color: "bg-amber-100 text-amber-800 border-amber-200" },
  completed: { label: "مكتمل بنجاح ✓", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { label: "ملغي", color: "bg-rose-100 text-rose-800" },
};

function MyOrdersPage() {
  const { user, loading: authLoading } = useCustomerAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/login" });
      return;
    }

    if (user) {
      const fetchOrders = async () => {
        try {
          const q1 = query(
            collection(db, "orders"),
            where("customerEmail", "==", user.email?.toLowerCase() || "")
          );
          const snap = await getDocs(q1);
          const list: OrderItem[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              serviceName: data.serviceName || "خدمة eFootball",
              status: data.status || "pending",
              price: data.price || data.totalPrice || "0",
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString("ar-EG") : "حديثاً",
              trackingCode: data.trackingCode || d.id.slice(0, 8).toUpperCase(),
              divisionCurrent: data.divisionCurrent,
              divisionTarget: data.divisionTarget,
              playerName: data.playerName,
            };
          });
          setOrders(list);
        } catch (e) {
          console.warn("Failed to fetch user orders:", e);
        } finally {
          setLoading(false);
        }
      };

      void fetchOrders();
    }
  }, [user, authLoading, navigate]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchFilter = filter === "all" || o.status === filter;
      const matchSearch =
        !search.trim() ||
        o.trackingCode.toLowerCase().includes(search.toLowerCase()) ||
        o.serviceName.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [orders, filter, search]);

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1 py-10 sm:py-16 bg-gradient-to-b from-surface/40 via-bg to-bg">
        <div className="mx-auto max-w-6xl px-4">
          
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link to="/dashboard" className="text-xs font-bold text-muted hover:text-primary">
                  لوحة التحكم
                </Link>
                <span className="text-xs text-muted">/</span>
                <span className="text-xs font-bold text-primary">طلباتي</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-fg">
                سجل طلباتي
              </h1>
              <p className="text-xs text-muted mt-1">
                تتبع وتصفح جميع طلباتك السابقة والحالية مع تفاصيل التقدم
              </p>
            </div>

            <Link
              to="/order"
              className="btn-primary inline-flex min-h-11 items-center gap-2 rounded-2xl px-6 text-xs font-extrabold shadow-sm"
            >
              <PlusCircle className="size-4" />
              <span>طلب جديد</span>
            </Link>
          </div>

          {/* Search and Filters Bar */}
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-border bg-white p-4 shadow-sm">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث برقم الطلب أو اسم الخدمة..."
                className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 pl-10 text-xs outline-none focus:border-primary transition"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {[
                { id: "all", label: "الكل" },
                { id: "in_progress", label: "جاري التنفيذ" },
                { id: "pending", label: "قيد المراجعة" },
                { id: "completed", label: "المكتملة" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    filter === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "border border-border bg-surface text-muted hover:text-fg"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-3" />
              <p className="text-xs text-muted">جاري تحميل سجل الطلبات...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-border bg-white p-12 text-center shadow-sm">
              <Package className="size-12 text-muted mx-auto mb-3 opacity-30" />
              <h3 className="text-base font-bold text-fg mb-1">لا توجد طلبات مطابقة</h3>
              <p className="text-xs text-muted max-w-sm mx-auto mb-6">
                لم يتم العثور على أي طلبات تطابق الفلتر الحالي، أو أنك لم تقم بطلب خدمات بعد.
              </p>
              <Link
                to="/order"
                className="btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-xs font-extrabold shadow-sm"
              >
                تصفح واطلب الخدمات
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-surface/80 text-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-extrabold">كود الطلب</th>
                      <th className="px-6 py-4 font-extrabold">الخدمة</th>
                      <th className="px-6 py-4 font-extrabold">التاريخ</th>
                      <th className="px-6 py-4 font-extrabold">السعر</th>
                      <th className="px-6 py-4 font-extrabold">الحالة</th>
                      <th className="px-6 py-4 font-extrabold text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredOrders.map((order) => {
                      const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
                      return (
                        <tr key={order.id} className="hover:bg-surface/40 transition">
                          <td className="px-6 py-4 font-mono font-bold text-primary" dir="ltr">
                            #{order.trackingCode}
                          </td>
                          <td className="px-6 py-4 font-extrabold text-fg">
                            {order.serviceName}
                            {order.playerName && (
                              <span className="block text-[11px] text-muted font-medium">
                                اللاعب: {order.playerName}
                              </span>
                            )}
                            {order.divisionCurrent && order.divisionTarget && (
                              <span className="block text-[11px] text-muted font-medium">
                                من {order.divisionCurrent} إلى {order.divisionTarget}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-muted font-medium">
                            {order.createdAt}
                          </td>
                          <td className="px-6 py-4 font-extrabold text-fg">
                            {order.price} ج.م
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold ${st.color}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link
                              to="/track"
                              search={{ id: order.trackingCode }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 font-extrabold text-fg hover:border-primary hover:text-primary transition shadow-sm"
                            >
                              <span>متابعة وتتبع</span>
                              <ExternalLink className="size-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden divide-y divide-border">
                {filteredOrders.map((order) => {
                  const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
                  return (
                    <div key={order.id} className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-primary" dir="ltr">
                          #{order.trackingCode}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <div className="font-extrabold text-sm text-fg">
                        {order.serviceName}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted font-medium">
                        <span>{order.createdAt}</span>
                        <span className="font-extrabold text-fg">{order.price} ج.م</span>
                      </div>
                      <Link
                        to="/track"
                        search={{ id: order.trackingCode }}
                        className="btn-primary w-full min-h-10 items-center justify-center rounded-xl text-xs font-bold flex shadow-sm"
                      >
                        تتبع حالة الطلب والمحادثة
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
