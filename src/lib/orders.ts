import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { OrderDoc, OrderStatus } from "./firebase-types";

export type { OrderStatus };

// Re-export for backward compat
export type StoredOrder = OrderDoc;

export const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "تم الاستلام",
  CONTACTED: "تم التواصل",
  PAYMENT_PENDING: "بانتظار الدفع",
  PAID: "تم الدفع",
  IN_PROGRESS: "جاري التنفيذ",
  WAITING_CUSTOMER: "بانتظار العميل",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
  REFUNDED: "مُسترجع",
};

export const PROGRESS_STEPS: OrderStatus[] = [
  "NEW",
  "PAID",
  "IN_PROGRESS",
  "COMPLETED",
];

// ─── Generate RDG-xxxx via Firestore transaction ────────────────────────────
async function generateOrderId(): Promise<string> {
  const counterRef = doc(db, "settings", "orderCounter");
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? (snap.data().current as number) : 1000;
    const nextNum = current + 1;
    tx.set(counterRef, { current: nextNum });
    return nextNum;
  });
  return `RDG-${next}`;
}

// ─── Create order in Firestore ──────────────────────────────────────────────
export async function createOrderFirestore(data: {
  serviceId: string;
  serviceName: string;
  price: number;
  currency: string;
  customerName: string;
  telegram: string;
  whatsapp?: string;
  answers: Record<string, string>;
  sessionId?: string;
}): Promise<OrderDoc> {
  const orderId = await generateOrderId();
  const now = new Date().toISOString();
  const order: OrderDoc = {
    orderId,
    serviceId: data.serviceId,
    serviceName: data.serviceName,
    price: data.price,
    currency: data.currency,
    customerName: data.customerName,
    telegram: data.telegram,
    whatsapp: data.whatsapp ?? "",
    answers: data.answers,
    status: "NEW",
    paymentStatus: "UNPAID",
    sessionId: data.sessionId,
    createdAt: now,
    updatedAt: now,
  };

  // Use orderId as document ID for easy lookup
  const ref = doc(db, "orders", orderId);
  await setDoc(ref, order);
  return order;
}

// ─── Find order by orderId field ────────────────────────────────────────────
export async function findOrderFirestore(
  orderId: string,
): Promise<OrderDoc | null> {
  const clean = orderId.trim().toUpperCase();

  // Try direct doc lookup first (orderId is the doc ID)
  const directRef = doc(db, "orders", clean);
  const directSnap = await getDoc(directRef);
  if (directSnap.exists()) {
    return directSnap.data() as OrderDoc;
  }

  // Fallback: query by field (for legacy data)
  const q = query(collection(db, "orders"), where("orderId", "==", clean));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0]!.data() as OrderDoc;
  }
  return null;
}

// ─── Public-safe order view (never expose admin fields) ─────────────────────
export type PublicOrder = Pick<
  OrderDoc,
  | "orderId"
  | "serviceName"
  | "price"
  | "currency"
  | "status"
  | "paymentStatus"
  | "createdAt"
  | "updatedAt"
  | "proofUrls"
  | "customerName"
  | "telegram"
>;

export function toPublicOrder(o: OrderDoc): PublicOrder {
  return {
    orderId: o.orderId,
    serviceName: o.serviceName,
    price: o.price,
    currency: o.currency,
    status: o.status,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    proofUrls: o.proofUrls,
    customerName: o.customerName,
    telegram: o.telegram,
  };
}

// ─── Kept for backward compat (localStorage) — used in dev fallback ─────────
export function nextOrderId() {
  const n = Number(localStorage.getItem("rodrigo-order-counter") || "1000") + 1;
  localStorage.setItem("rodrigo-order-counter", String(n));
  return `RDG-${n}`;
}

export function createOrder(
  data: Omit<OrderDoc, "orderId" | "status" | "paymentStatus" | "createdAt" | "updatedAt">,
) {
  const order: OrderDoc = {
    ...data,
    orderId: nextOrderId(),
    status: "NEW",
    paymentStatus: "UNPAID",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return order;
}

export function findOrder(_id: string): OrderDoc | undefined {
  return undefined;
}

export function seedDemoOrder() {
  // No-op: demo orders now come from Firestore
}
