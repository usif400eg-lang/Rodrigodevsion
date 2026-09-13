import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import type { ActivityLogDoc, OrderDoc } from "@/lib/firebase-types";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";

export const Route = createFileRoute("/admin/_layout/")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [activities, setActivities] = useState<ActivityLogDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for orders
  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(100),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => d.data() as OrderDoc));
        setLoading(false);
      },
      (err) => {
        console.error("Orders listener error:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // Real-time listener for activity logs
  useEffect(() => {
    const q = query(
      collection(db, "activityLogs"),
      orderBy("createdAt", "desc"),
      limit(10),
    );
    const unsub = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map((d) => d.data() as ActivityLogDoc));
    });
    return () => unsub();
  }, []);

  // Compute Dashboard Metrics
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let totalRevenue = 0;
    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;

    let newCount = 0;
    let pendingCount = 0;
    let paidCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    const serviceCounts: Record<string, { name: string; count: number; revenue: number }> = {};

    for (const o of orders) {
      // Counts by status
      if (o.status === "NEW") newCount++;
      else if (o.status === "PAYMENT_PENDING") pendingCount++;
      else if (o.status === "PAID") paidCount++;
      else if (o.status === "IN_PROGRESS") inProgressCount++;
      else if (o.status === "COMPLETED") completedCount++;
      else if (o.status === "CANCELLED" || o.status === "REFUNDED") cancelledCount++;

      // Revenue (only count paid or completed orders)
      const isPaid = o.paymentStatus === "PAID" || o.status === "COMPLETED";
      if (isPaid && o.price) {
        totalRevenue += o.price;
        const orderDate = new Date(o.createdAt);
        if (o.createdAt.startsWith(todayStr)) {
          todayRevenue += o.price;
        }
        if (orderDate >= weekAgo) {
          weekRevenue += o.price;
        }
        if (orderDate >= monthAgo) {
          monthRevenue += o.price;
        }
      }

      // Group by service
      const svcKey = o.serviceName || "خدمة غير محددة";
      if (!serviceCounts[svcKey]) {
        serviceCounts[svcKey] = { name: svcKey, count: 0, revenue: 0 };
      }
      serviceCounts[svcKey].count++;
      if (isPaid && o.price) {
        serviceCounts[svcKey].revenue += o.price;
      }
    }

    const topServices = Object.values(serviceCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    return {
      totalOrders: orders.length,
      newCount,
      pendingCount,
      paidCount,
      inProgressCount,
      completedCount,
      cancelledCount,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      topServices,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Live indicator */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">لوحة التحكم</h1>
          <p className="text-sm text-muted">
            نظرة عامة حية ومباشرة على أداء المنصة والطلبات
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-ok/30 bg-ok/10 px-3 py-1 text-xs font-semibold text-ok">
          <span className="size-2 animate-pulse rounded-full bg-ok" />
          تحديث مباشر (Real-time)
        </div>
      </div>

      {/* Revenue Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">إيرادات اليوم</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DollarSign className="size-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-fg">
            {stats.todayRevenue.toLocaleString()}{" "}
            <span className="text-xs font-medium text-muted">EGP</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">المدفوع خلال الـ 24 ساعة الحالية</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">إيرادات الأسبوع</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-ok/10 text-ok">
              <TrendingUp className="size-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-fg">
            {stats.weekRevenue.toLocaleString()}{" "}
            <span className="text-xs font-medium text-muted">EGP</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">المدفوع خلال آخر 7 أيام</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">إيرادات الشهر</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CreditCard className="size-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-fg">
            {stats.monthRevenue.toLocaleString()}{" "}
            <span className="text-xs font-medium text-muted">EGP</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">المدفوع خلال آخر 30 يوماً</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">إجمالي الأرباح</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-warn/10 text-warn">
              <BarChart3 className="size-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-fg">
            {stats.totalRevenue.toLocaleString()}{" "}
            <span className="text-xs font-medium text-muted">EGP</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">إجمالي الطلبات المكتملة والمدفوعة</p>
        </div>
      </div>

      {/* Orders Status Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Link
          to="/admin/orders"
          className="group rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">جديدة</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
              {stats.newCount}
            </span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-fg">{stats.newCount}</div>
        </Link>

        <Link
          to="/admin/orders"
          className="group rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">بانتظار الدفع</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-yellow-50 text-xs font-bold text-yellow-700">
              {stats.pendingCount}
            </span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-fg">{stats.pendingCount}</div>
        </Link>

        <Link
          to="/admin/orders"
          className="group rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">مدفوعة</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-green-50 text-xs font-bold text-green-700">
              {stats.paidCount}
            </span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-fg">{stats.paidCount}</div>
        </Link>

        <Link
          to="/admin/orders"
          className="group rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">قيد التنفيذ</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
              {stats.inProgressCount}
            </span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-fg">{stats.inProgressCount}</div>
        </Link>

        <Link
          to="/admin/orders"
          className="group rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">مكتملة</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
              {stats.completedCount}
            </span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-fg">{stats.completedCount}</div>
        </Link>

        <Link
          to="/admin/orders"
          className="group rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">ملغية</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-600">
              {stats.cancelledCount}
            </span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-fg">{stats.cancelledCount}</div>
        </Link>
      </div>

      {/* Main Grid: Recent Orders & Sidebar (Top Services + Recent Activity) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders List (2 cols) */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-5 text-primary" />
              <h2 className="font-bold text-fg">أحدث الطلبات</h2>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              عرض الكل
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-muted">لا توجد طلبات مسجلة بعد.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="pb-3 font-semibold">رقم الطلب</th>
                    <th className="pb-3 font-semibold">العميل</th>
                    <th className="pb-3 font-semibold">الخدمة</th>
                    <th className="pb-3 font-semibold">السعر</th>
                    <th className="pb-3 font-semibold">الحالة</th>
                    <th className="pb-3 font-semibold">الدفع</th>
                    <th className="pb-3 font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.slice(0, 8).map((o) => (
                    <tr key={o.orderId} className="transition hover:bg-surface/50">
                      <td className="py-3 font-mono font-bold text-primary">
                        {o.orderId}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-fg">{o.customerName}</div>
                        <div className="text-xs text-muted" dir="ltr">
                          {o.telegram}
                        </div>
                      </td>
                      <td className="py-3 text-xs text-muted max-w-[140px] truncate">
                        {o.serviceName}
                      </td>
                      <td className="py-3 font-semibold text-fg">
                        {o.price} {o.currency}
                      </td>
                      <td className="py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="py-3">
                        <PaymentStatusBadge status={o.paymentStatus} />
                      </td>
                      <td className="py-3">
                        <Link
                          to="/admin/orders/$orderId"
                          params={{ orderId: o.orderId }}
                          className="rounded-lg bg-surface px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-on-primary transition"
                        >
                          عرض
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar: Top Services & Recent Activity */}
        <div className="space-y-6">
          {/* Top Services */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Package className="size-5 text-primary" />
              <h2 className="font-bold text-fg">أكثر الخدمات طلباً</h2>
            </div>
            {stats.topServices.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted">لا توجد بيانات كافية</p>
            ) : (
              <div className="space-y-3">
                {stats.topServices.map((s, idx) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between rounded-xl bg-surface p-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-fg">{s.name}</span>
                    </div>
                    <div className="text-left font-semibold text-muted">
                      <span className="text-primary font-bold">{s.count}</span> طلب
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="size-5 text-primary" />
                <h2 className="font-bold text-fg">سجل النشاط الأخير</h2>
              </div>
              <Link
                to="/admin/activity"
                className="text-xs font-bold text-primary hover:underline"
              >
                المزيد
              </Link>
            </div>
            {activities.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted">لا توجد نشاطات مسجلة بعد</p>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="flex flex-col gap-1 border-r-2 border-primary/40 pr-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-fg">{act.adminName}</span>
                      <span className="text-[10px] text-muted">
                        {new Date(act.createdAt).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-muted">{act.action}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
