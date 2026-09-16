import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MessageCircle,
  Phone,
  Send,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { uploadFileToStorage } from "@/lib/firebase-storage";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import { appAlert, appConfirm } from "@/components/ui/app-modal";
import type {
  AdminDoc,
  OrderDoc,
  OrderMessageDoc,
  OrderStatus,
  PaymentStatus,
} from "@/lib/firebase-types";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";

export const Route = createFileRoute("/admin/_layout/orders/$orderId")({
  component: AdminOrderDetailPage,
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

function AdminOrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = Route.useParams();
  const { session } = useAdminStore();

  const [order, setOrder] = useState<OrderDoc | null>(null);
  const [messages, setMessages] = useState<OrderMessageDoc[]>([]);
  const [staffList, setStaffList] = useState<AdminDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofProgress, setProofProgress] = useState(0);

  const [notes, setNotes] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to order
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "orders", orderId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as OrderDoc;
        setOrder(data);
        setNotes(data.internalNotes || "");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  // Subscribe to messages
  useEffect(() => {
    const q = query(
      collection(db, "orderMessages"),
      where("orderId", "==", orderId),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => d.data() as OrderMessageDoc));
    });
    return () => unsub();
  }, [orderId]);

  // Load staff list
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

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update Status
  async function handleStatusChange(newStatus: OrderStatus) {
    if (!order || !session) return;
    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `تغيير حالة الطلب إلى ${newStatus}`,
        entityType: "order",
        entityId: order.orderId,
        before: { status: order.status },
        after: { status: newStatus },
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Update Payment Status
  async function handlePaymentChange(newPayment: PaymentStatus) {
    if (!order || !session) return;
    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        paymentStatus: newPayment,
        updatedAt: new Date().toISOString(),
      });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `تغيير حالة دفع الطلب إلى ${newPayment}`,
        entityType: "order",
        entityId: order.orderId,
        before: { paymentStatus: order.paymentStatus },
        after: { paymentStatus: newPayment },
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Save Internal Notes
  async function handleSaveNotes() {
    if (!order || !session) return;
    setSavingNotes(true);
    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        internalNotes: notes,
        updatedAt: new Date().toISOString(),
      });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `تحديث الملاحظات الداخلية للطلب`,
        entityType: "order",
        entityId: order.orderId,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  }

  // Upload Proof Screenshot
  async function handleUploadProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !order || !session) return;

    setUploadingProof(true);
    setProofProgress(0);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `proofs/${order.orderId}/${Date.now()}.${ext}`;
      const downloadUrl = await uploadFileToStorage(path, file, (p) => setProofProgress(p));

      const updatedProofs = [...(order.proofUrls || []), downloadUrl];
      await updateDoc(doc(db, "orders", order.orderId), {
        proofUrls: updatedProofs,
        updatedAt: new Date().toISOString(),
      });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `إضافة صورة إثبات إنجاز للطلب`,
        entityType: "order",
        entityId: order.orderId,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingProof(false);
      e.target.value = "";
    }
  }

  // Remove Proof Screenshot
  async function handleRemoveProof(urlToRemove: string) {
    if (!order || !session) return;
    const confirmed = await appConfirm({
      title: "تأكيد حذف الإثبات",
      message: "هل أنت متأكد من حذف صورة الإثبات هذه؟",
      confirmText: "نعم، حذف الصورة",
      cancelText: "إلغاء",
      type: "danger",
    });
    if (!confirmed) return;
    try {
      const updatedProofs = (order.proofUrls || []).filter((u) => u !== urlToRemove);
      await updateDoc(doc(db, "orders", order.orderId), {
        proofUrls: updatedProofs,
        updatedAt: new Date().toISOString(),
      });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `حذف صورة إثبات من الطلب`,
        entityType: "order",
        entityId: order.orderId,
      });
      await appAlert({
        title: "تم الحذف",
        message: "تم حذف صورة الإثبات بنجاح.",
        type: "success",
      });
    } catch (err) {
      console.error(err);
      await appAlert({
        title: "خطأ",
        message: "تعذر حذف صورة الإثبات.",
        type: "error",
      });
    }
  }

  // Send reply message
  async function handleSendReply() {
    const text = replyText.trim();
    if (!text || !order || !session || sendingReply) return;

    setSendingReply(true);
    try {
      const ref = doc(collection(db, "orderMessages"));
      await addDoc(collection(db, "orderMessages"), {
        id: ref.id,
        orderId: order.orderId,
        author: "admin",
        authorName: session.admin.displayName || "فريق رودريجو",
        message: text,
        createdAt: new Date().toISOString(),
      });
      setReplyText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  }

  // Assign Staff
  async function handleAssignStaff(staffUid: string) {
    if (!order || !session) return;
    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        assignedAdmin: staffUid,
        updatedAt: new Date().toISOString(),
      });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `تعيين مشرف للطلب`,
        entityType: "order",
        entityId: order.orderId,
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Permanent Delete (OWNER only)
  async function handlePermanentDelete() {
    if (!order || session?.role !== "OWNER") return;
    if (deleteConfirmText.trim() !== "DELETE") return;

    try {
      await deleteDoc(doc(db, "orders", order.orderId));
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `حذف نهائي للطلب ${order.orderId}`,
        entityType: "order",
        entityId: order.orderId,
      });
      void navigate({ to: "/admin/orders" });
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4 text-center py-16">
        <h2 className="text-xl font-bold text-warn">الطلب غير موجود</h2>
        <Link to="/admin/orders" className="btn-primary inline-flex px-6 py-2 rounded-xl text-sm font-bold">
          العودة للطلبات
        </Link>
      </div>
    );
  }

  const tgClean = order.telegram.replace("@", "");
  const tgUrl = `https://t.me/${tgClean}?text=${encodeURIComponent(`أهلاً بك يا ${order.customerName}، بخصوص طلبك رقم ${order.orderId} في Rodrigo:`)}`;
  const waUrl = order.whatsapp
    ? `https://wa.me/${order.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`أهلاً بك يا ${order.customerName}، بخصوص طلبك رقم ${order.orderId} في Rodrigo:`)}`
    : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Link to="/admin/orders" className="hover:text-primary transition">
            الطلبات
          </Link>
          <span>/</span>
          <span className="font-mono font-bold text-fg">{order.orderId}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/track?id=${order.orderId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-primary transition"
          >
            <ExternalLink className="size-3.5" />
            معاينة صفحة التتبع للعميل
          </a>
        </div>
      </div>

      {/* Main Grid: Details (2 cols) & Controls (1 col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols): Customer details, form answers, proof, chat */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Header Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold text-muted">رقم الطلب</span>
                <h1 className="font-mono text-2xl font-extrabold text-primary">{order.orderId}</h1>
              </div>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
              <div>
                <span className="text-muted">الخدمة:</span>
                <p className="mt-0.5 font-bold text-fg">{order.serviceName}</p>
              </div>
              <div>
                <span className="text-muted">السعر:</span>
                <p className="mt-0.5 font-bold text-fg">
                  {order.price} {order.currency}
                </p>
              </div>
              <div>
                <span className="text-muted">تاريخ الطلب:</span>
                <p className="mt-0.5 font-semibold text-fg">
                  {new Date(order.createdAt).toLocaleString("ar-EG")}
                </p>
              </div>
              <div>
                <span className="text-muted">آخر تحديث:</span>
                <p className="mt-0.5 font-semibold text-fg">
                  {new Date(order.updatedAt).toLocaleTimeString("ar-EG")}
                </p>
              </div>
            </div>
          </div>

          {/* Customer & Form Answers Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-fg flex items-center gap-2">
              <User className="size-4 text-primary" />
              بيانات العميل وإجابات النموذج
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 border-b border-border pb-4 text-xs">
              <div className="rounded-xl bg-surface p-3">
                <span className="text-muted">اسم العميل:</span>
                <p className="mt-1 font-bold text-fg">{order.customerName}</p>
              </div>
              <div className="rounded-xl bg-surface p-3">
                <span className="text-muted">تليجرام:</span>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-mono font-bold text-fg" dir="ltr">
                    {order.telegram}
                  </span>
                  <a
                    href={tgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#229ED9] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <MessageCircle className="size-3" />
                    محادثة
                  </a>
                </div>
              </div>
              <div className="rounded-xl bg-surface p-3">
                <span className="text-muted">واتساب:</span>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-mono font-bold text-fg" dir="ltr">
                    {order.whatsapp || "غير متوفر"}
                  </span>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#25D366] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Phone className="size-3" />
                      محادثة
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Answers */}
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-bold text-muted">تفاصيل الطلب والبيانات المدخلة:</h3>
              {Object.keys(order.answers || {}).length === 0 ? (
                <p className="text-xs text-muted">لا توجد حقول إضافية مدخلة.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                  {Object.entries(order.answers || {}).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-border/70 py-2">
                      <span className="text-muted font-medium">{key}:</span>
                      <span className="font-bold text-fg max-w-[200px] truncate" title={String(val)}>
                        {String(val) || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Proof Uploads Card (Visible on tracking page) */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-fg flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-ok" />
                  صور إثبات الإنجاز (Proof Screenshots)
                </h2>
                <p className="text-xs text-muted">
                  هذه الصور تظهر للعميل في صفحة التتبع كإثبات على تنفيذ الخدمة
                </p>
              </div>

              {/* Upload button */}
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl btn-primary px-3 py-2 text-xs font-bold shadow-sm">
                <Upload className="size-3.5" />
                {uploadingProof ? `جاري الرفع ${proofProgress}%` : "رفع صورة إثبات"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingProof}
                  onChange={(e) => void handleUploadProof(e)}
                  className="hidden"
                />
              </label>
            </div>

            {/* Proofs Grid */}
            {(!order.proofUrls || order.proofUrls.length === 0) ? (
              <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted">
                لم يتم رفع أي صور إثبات بعد. اضغط على "رفع صورة إثبات" لإرفاق سكرين شوت الإنجاز.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(order.proofUrls || []).map((url, idx) => (
                  <div key={url} className="group relative rounded-xl border border-border overflow-hidden bg-surface">
                    <img
                      src={url}
                      alt={`إثبات ${idx + 1}`}
                      className="h-32 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-fg/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-bg/90 p-1.5 text-fg hover:text-primary transition"
                        title="معاينة"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => void handleRemoveProof(url)}
                        className="rounded-lg bg-red-600/90 p-1.5 text-white hover:bg-red-700 transition"
                        title="حذف"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Messages Thread */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-2 text-base font-bold text-fg flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" />
              محادثة الطلب مع العميل
            </h2>
            <p className="mb-4 text-xs text-muted">
              الرسائل هنا تظهر مباشرة للعميل في صفحة التتبع وتتيح له التواصل مع الدعم
            </p>

            <div className="h-56 overflow-y-auto space-y-2 rounded-xl border border-border bg-surface/50 p-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted">
                  لا توجد رسائل في هذه المحادثة حتى الآن.
                </div>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.author === "admin";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 text-xs shadow-sm ${
                          isAdmin
                            ? "bg-primary text-on-primary rounded-tr-none"
                            : "bg-card text-fg border border-border rounded-tl-none"
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-4 text-[10px] opacity-80">
                          <span className="font-bold">{isAdmin ? (m.authorName || "فريق رودريجو") : order.customerName}</span>
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="leading-relaxed">{m.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendReply();
                  }
                }}
                placeholder="اكتب رسالة للعميل..."
                className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => void handleSendReply()}
                disabled={sendingReply || !replyText.trim()}
                className="btn-primary flex size-10 items-center justify-center rounded-xl shadow-sm disabled:opacity-50"
                title="إرسال"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Status controls, Staff assign, Internal notes, Delete */}
        <div className="space-y-6">
          {/* Status & Payment Controls */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-fg text-sm">إدارة الحالة والتحصيل</h3>

            {/* Order Status */}
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">
                حالة تنفيذ الطلب
              </label>
              <select
                value={order.status}
                onChange={(e) => void handleStatusChange(e.target.value as OrderStatus)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-bold text-fg outline-none focus:border-primary"
              >
                {ALL_ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">
                حالة الدفع
              </label>
              <select
                value={order.paymentStatus}
                onChange={(e) => void handlePaymentChange(e.target.value as PaymentStatus)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-bold text-fg outline-none focus:border-primary"
              >
                {ALL_PAYMENT_STATUSES.map((pst) => (
                  <option key={pst} value={pst}>
                    {pst}
                  </option>
                ))}
              </select>
            </div>

            {/* Staff Assignment */}
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">
                المشرف / الموظف المعين
              </label>
              <select
                value={order.assignedAdmin || ""}
                onChange={(e) => void handleAssignStaff(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-fg outline-none focus:border-primary"
              >
                <option value="">غير معين</option>
                {staffList.map((st) => (
                  <option key={st.uid} value={st.uid}>
                    {st.displayName} ({st.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Internal Notes (Never exposed to customer) */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-fg text-sm">ملاحظات إدارية سرية</h3>
              <span className="rounded bg-warn/10 px-2 py-0.5 text-[10px] font-bold text-warn">
                خاص بالإدارة فقط
              </span>
            </div>
            <p className="text-[11px] text-muted">
              هذه الملاحظات لا تظهر للعميل إطلاقاً تحت أي ظرف وتستخدم للتنسيق الداخلي.
            </p>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب ملاحظات الحساب، بيانات الدخول، أو أي تفاصيل داخلية..."
              className="w-full rounded-xl border border-border bg-surface p-3 text-xs outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={savingNotes}
              onClick={() => void handleSaveNotes()}
              className="w-full rounded-xl border border-border bg-surface py-2 text-xs font-bold text-fg hover:bg-primary hover:text-on-primary transition disabled:opacity-50"
            >
              {savingNotes ? "جاري الحفظ..." : "حفظ الملاحظات"}
            </button>
          </div>

          {/* Danger Zone: OWNER permanent delete */}
          {session?.role === "OWNER" && (
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="size-4" />
                <h3 className="font-bold text-sm">حذف نهائي للطلب</h3>
              </div>
              <p className="text-[11px] text-red-600/80">
                متاح فقط للمالك (OWNER). الحذف النهائي يزيل الطلب ومحادثته تماماً من قاعدة البيانات.
              </p>
              {!showDeleteModal ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
                >
                  حذف هذا الطلب نهائياً
                </button>
              ) : (
                <div className="space-y-2 rounded-xl border border-red-200 bg-white p-3">
                  <p className="text-xs font-semibold text-red-700">
                    لتأكيد الحذف النهائي، اكتب كلمة <strong className="font-mono">DELETE</strong>:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full rounded-lg border border-red-300 px-3 py-1.5 text-xs text-center font-mono uppercase"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={deleteConfirmText !== "DELETE"}
                      onClick={() => void handlePermanentDelete()}
                      className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40"
                    >
                      تأكيد الحذف
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeleteConfirmText("");
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
