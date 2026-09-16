import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import { appAlert, appConfirm } from "@/components/ui/app-modal";
import type { AdminDoc, OrderDoc, OrderStatus, PaymentStatus } from "@/lib/firebase-types";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";

export const Route = createFileRoute("/admin/_layout/orders/")({
  component: AdminOrdersListPage,
});

const ALL_ORDER_STATUSES: OrderStatus[] = [
  "NEW",
  "CONTACTED",
  "PAYMENT_PENDING",
  "PAID",
  "IN_PROGRESS",
  "WAITING_CUSTOMER",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

const ALL_PAYMENT_STATUSES: PaymentStatus[] = [
  "UNPAID",
  "PAYMENT_PENDING",
  "PAID",
  "REFUNDED",
];

function AdminOrdersListPage() {
  const { session } = useAdminStore();
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [staffList, setStaffList] = useState<AdminDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Real-time listener for orders
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => d.data() as OrderDoc));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load staff list for assignment
  useEffect(() => {
    async function loadStaff() {
      try {
        const snap = await getDocs(collection(db, "admins"));
        setStaffList(snap.docs.map((d) => d.data() as AdminDoc));
      } catch (err) {
        console.warn("Could not load staff list:", err);
      }
    }
    void loadStaff();
  }, []);

  // List of distinct service names for filter
  const distinctServices = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.serviceName) set.add(o.serviceName);
    });
    return Array.from(set);
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Exclude soft-deleted orders unless role is OWNER
      if (o.deletedAt) return false;

      // Search filter
      const term = search.trim().toLowerCase();
      if (term) {
        const matchId = o.orderId.toLowerCase().includes(term);
        const matchName = o.customerName.toLowerCase().includes(term);
        const matchTg = o.telegram.toLowerCase().includes(term);
        const matchWa = o.whatsapp ? o.whatsapp.includes(term) : false;
        if (!matchId && !matchName && !matchTg && !matchWa) return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;

      // Payment filter
      if (paymentFilter !== "ALL" && o.paymentStatus !== paymentFilter) return false;

      // Service filter
      if (serviceFilter !== "ALL" && o.serviceName !== serviceFilter) return false;

      return true;
    });
  }, [orders, search, statusFilter, paymentFilter, serviceFilter]);

  // Paginated orders
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  // Actions
  async function handleMarkPaid(order: OrderDoc) {
    if (!session) return;
    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        paymentStatus: "PAID",
        updatedAt: new Date().toISOString(),
      });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `تم تأكيد دفع الطلب ${order.orderId}`,
        entityType: "order",
        entityId: order.orderId,
        before: { paymentStatus: order.paymentStatus },
        after: { paymentStatus: "PAID" },
      });
    } catch (err) {
      console.error("Failed to mark paid:", err);
    }
  }

  async function handleStatusChange(order: OrderDoc, newStatus: OrderStatus) {
    if (!session) return;
    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `تم تغيير حالة الطلب ${order.orderId} إلى ${newStatus}`,
        entityType: "order",
        entityId: order.orderId,
        before: { status: order.status },
        after: { status: newStatus },
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  async function handleAssignStaff(order: OrderDoc, staffUid: string) {
    if (!session) return;
    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        assignedAdmin: staffUid,
        updatedAt: new Date().toISOString(),
      });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `تم تعيين موظف للطلب ${order.orderId}`,
        entityType: "order",
        entityId: order.orderId,
      });
    } catch (err) {
      console.error("Failed to assign staff:", err);
    }
  }

  async function handleSoftDelete(order: OrderDoc) {
    if (!session) return;
    const confirmed = await appConfirm({
      title: "تأكيد أرشفة الطلب",
      message: `هل أنت متأكد من رغبتك في أرشفة الطلب #${order.orderId}؟`,
      confirmText: "نعم، أرشفة",
      cancelText: "إلغاء",
      type: "warning",
    });
    if (!confirmed) return;
    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `أرشفة الطلب ${order.orderId}`,
        entityType: "order",
        entityId: order.orderId,
      });
      await appAlert({
        title: "تمت الأرشفة",
        message: `تم أرشفة الطلب #${order.orderId} بنجاح.`,
        type: "success",
      });
    } catch (err) {
      console.error("Failed to archive order:", err);
      await appAlert({
        title: "خطأ",
        message: "تعذر أرشفة الطلب.",
        type: "error",
      });
    }
  }

  function handleCopy(text: string, id: string) {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function exportCSV() {
    const headers = [
      "رقم الطلب",
      "اسم العميل",
      "تليجرام",
      "واتساب",
      "الخدمة",
      "السعر",
      "العملة",
      "حالة الطلب",
      "حالة الدفع",
      "تاريخ الإنشاء",
    ];
    const rows = filteredOrders.map((o) => [
      o.orderId,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.telegram.replace(/"/g, '""')}"`,
      `"${(o.whatsapp || "").replace(/"/g, '""')}"`,
      `"${o.serviceName.replace(/"/g, '""')}"`,
      o.price,
      o.currency,
      o.status,
      o.paymentStatus,
      o.createdAt,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rodrigo-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">إدارة الطلبات</h1>
          <p className="text-sm text-muted">
            إجمالي {filteredOrders.length} طلب مطابق للفلاتر الحالية
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-fg shadow-sm transition hover:bg-surface hover:border-primary"
        >
          <Download className="size-4 text-primary" />
          تصدير CSV
        </button>
      </div>

      {/* Filters Card */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث برقم الطلب، الاسم، التليجرام..."
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 pl-10 text-xs outline-none focus:border-primary"
            />
            <Search className="pointer-events-none absolute left-3 size-4 text-muted" />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-fg outline-none focus:border-primary"
          >
            <option value="ALL">جميع حالات الطلب</option>
            {ALL_ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-fg outline-none focus:border-primary"
          >
            <option value="ALL">جميع حالات الدفع</option>
            {ALL_PAYMENT_STATUSES.map((pst) => (
              <option key={pst} value={pst}>
                {pst}
              </option>
            ))}
          </select>

          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-fg outline-none focus:border-primary"
          >
            <option value="ALL">جميع الخدمات</option>
            {distinctServices.map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="py-16 text-center text-muted">لا توجد طلبات تطابق الفلاتر المحددة.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-border bg-surface/60 text-muted">
                <tr>
                  <th className="py-3.5 px-4 font-bold">رقم الطلب</th>
                  <th className="py-3.5 px-4 font-bold">العميل</th>
                  <th className="py-3.5 px-4 font-bold">الخدمة</th>
                  <th className="py-3.5 px-4 font-bold">السعر</th>
                  <th className="py-3.5 px-4 font-bold">حالة الطلب</th>
                  <th className="py-3.5 px-4 font-bold">الدفع</th>
                  <th className="py-3.5 px-4 font-bold">المسؤول</th>
                  <th className="py-3.5 px-4 font-bold">التاريخ</th>
                  <th className="py-3.5 px-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedOrders.map((order) => (
                  <tr key={order.orderId} className="transition hover:bg-surface/40">
                    {/* Order ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to="/admin/orders/$orderId"
                          params={{ orderId: order.orderId }}
                          className="font-mono font-extrabold text-primary hover:underline"
                        >
                          {order.orderId}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.orderId, order.orderId)}
                          className="text-muted hover:text-fg"
                          title="نسخ رقم الطلب"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        {copiedId === order.orderId && (
                          <span className="text-[10px] text-ok">تم النسخ</span>
                        )}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-fg">{order.customerName}</div>
                      <div className="flex items-center gap-1 text-[11px] text-muted">
                        <span dir="ltr">{order.telegram}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.telegram, `tg-${order.orderId}`)}
                          className="text-muted hover:text-fg"
                          title="نسخ معرف تليجرام"
                        >
                          <Copy className="size-3" />
                        </button>
                        {copiedId === `tg-${order.orderId}` && (
                          <span className="text-[9px] text-ok">تم</span>
                        )}
                      </div>
                    </td>

                    {/* Service */}
                    <td className="py-3.5 px-4 max-w-[160px] truncate font-medium text-fg">
                      {order.serviceName}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-bold text-fg whitespace-nowrap">
                      {order.price} {order.currency}
                    </td>

                    {/* Order Status */}
                    <td className="py-3.5 px-4">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          void handleStatusChange(order, e.target.value as OrderStatus)
                        }
                        className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px] font-bold outline-none"
                      >
                        {ALL_ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <PaymentStatusBadge status={order.paymentStatus} />
                        {order.paymentStatus !== "PAID" && (
                          <button
                            type="button"
                            onClick={() => void handleMarkPaid(order)}
                            className="rounded-lg bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 hover:bg-green-100 transition"
                            title="تحديد كمدفوع"
                          >
                            تأكيد الدفع
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Assigned Staff */}
                    <td className="py-3.5 px-4">
                      <select
                        value={order.assignedAdmin || ""}
                        onChange={(e) => void handleAssignStaff(order, e.target.value)}
                        className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px] outline-none"
                      >
                        <option value="">غير معين</option>
                        {staffList.map((st) => (
                          <option key={st.uid} value={st.uid}>
                            {st.displayName} ({st.role})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-[11px] text-muted whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          to="/admin/orders/$orderId"
                          params={{ orderId: order.orderId }}
                          className="rounded-lg bg-surface p-1.5 text-primary hover:bg-primary hover:text-on-primary transition"
                          title="تفاصيل الطلب"
                        >
                          <ExternalLink className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleSoftDelete(order)}
                          className="rounded-lg bg-surface p-1.5 text-muted hover:bg-red-50 hover:text-red-600 transition"
                          title="أرشفة الطلب"
                        >
                          <Archive className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs">
            <span className="text-muted">
              صفحة {currentPage} من {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="rounded-lg border border-border px-3 py-1 font-semibold disabled:opacity-40"
              >
                السابق
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="rounded-lg border border-border px-3 py-1 font-semibold disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
