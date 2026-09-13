import type { OrderStatus, PaymentStatus } from "@/lib/firebase-types";

const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string }
> = {
  NEW: { label: "جديد", bg: "bg-blue-100", text: "text-blue-700" },
  CONTACTED: { label: "تم التواصل", bg: "bg-indigo-100", text: "text-indigo-700" },
  PAYMENT_PENDING: { label: "بانتظار الدفع", bg: "bg-yellow-100", text: "text-yellow-700" },
  PAID: { label: "مدفوع", bg: "bg-green-100", text: "text-green-700" },
  IN_PROGRESS: { label: "جاري التنفيذ", bg: "bg-primary/10", text: "text-primary" },
  WAITING_CUSTOMER: { label: "بانتظار العميل", bg: "bg-orange-100", text: "text-orange-700" },
  COMPLETED: { label: "مكتمل", bg: "bg-emerald-100", text: "text-emerald-700" },
  CANCELLED: { label: "ملغي", bg: "bg-red-100", text: "text-red-600" },
  REFUNDED: { label: "مُسترجع", bg: "bg-gray-100", text: "text-gray-600" },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string }
> = {
  UNPAID: { label: "غير مدفوع", bg: "bg-red-100", text: "text-red-600" },
  PAYMENT_PENDING: { label: "بانتظار الدفع", bg: "bg-yellow-100", text: "text-yellow-700" },
  PAID: { label: "مدفوع", bg: "bg-green-100", text: "text-green-700" },
  REFUNDED: { label: "مُسترجع", bg: "bg-gray-100", text: "text-gray-600" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const cfg = ORDER_STATUS_CONFIG[status] ?? ORDER_STATUS_CONFIG.NEW;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = PAYMENT_STATUS_CONFIG[status] ?? PAYMENT_STATUS_CONFIG.UNPAID;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}
