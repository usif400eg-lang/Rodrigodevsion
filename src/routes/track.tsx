import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { MessageCircle, Send } from "lucide-react";
import { z } from "zod";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/lib/firebase";
import type {
  ContactSettingsDoc,
  OrderDoc,
  OrderMessageDoc,
} from "@/lib/firebase-types";
import {
  findOrderFirestore,
  PROGRESS_STEPS,
  STATUS_LABEL,
  toPublicOrder,
  type PublicOrder,
} from "@/lib/orders";

const searchSchema = z.object({
  id: z.string().optional(),
});

export const Route = createFileRoute("/track")({
  validateSearch: searchSchema,
  component: TrackPage,
});

function TrackPage() {
  const { id } = Route.useSearch();
  const [query2, setQuery2] = useState(id ?? "");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [messages, setMessages] = useState<OrderMessageDoc[]>([]);
  const [recentOrders, setRecentOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [miss, setMiss] = useState(false);
  const [contact, setContact] = useState<ContactSettingsDoc | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("rdg-recent-orders") || "[]");
      if (Array.isArray(saved)) setRecentOrders(saved);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "settings", "contact"));
      if (snap.exists()) setContact(snap.data() as ContactSettingsDoc);
    };
    void load();
  }, []);

  useEffect(() => {
    if (id) void lookup(id);
  }, [id]);

  async function lookup(value: string) {
    const clean = value.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setMiss(false);
    setOrder(null);
    try {
      const found = await findOrderFirestore(clean);
      if (found) {
        setOrder(toPublicOrder(found));
        // Save to recent orders
        try {
          const saved: string[] = JSON.parse(localStorage.getItem("rdg-recent-orders") || "[]");
          const next = [found.orderId, ...saved.filter((x) => x !== found.orderId)].slice(0, 5);
          localStorage.setItem("rdg-recent-orders", JSON.stringify(next));
          setRecentOrders(next);
        } catch {
          /* noop */
        }
        // Subscribe to messages
        subscribeMessages(found.orderId);
      } else {
        setMiss(true);
      }
    } catch (e) {
      console.error(e);
      setMiss(true);
    } finally {
      setLoading(false);
    }
  }

  function subscribeMessages(orderId: string) {
    const q = query(
      collection(db, "orderMessages"),
      where("orderId", "==", orderId),
      orderBy("createdAt", "asc"),
    );
    onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => d.data() as OrderMessageDoc));
    });
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-3 text-3xl font-extrabold">تتبع طلبك</h1>
        <p className="mb-8 text-muted">أدخل رقم الطلب مثل RDG-1001</p>

        <div className="glass rounded-2xl p-6">
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void lookup(query2);
            }}
          >
            <input
              className="min-h-12 flex-1 rounded-xl border border-border bg-surface px-4 text-center uppercase"
              placeholder="RDG-1001"
              value={query2}
              onChange={(e) => setQuery2(e.target.value.toUpperCase())}
            />
            <button
              type="submit"
              className="btn-primary min-h-12 rounded-xl px-8 font-bold disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "..." : "تتبع"}
            </button>
          </form>

          {(recentOrders ?? []).length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-muted font-medium">طلباتك الأخيرة:</span>
              {(recentOrders ?? []).map((ro) => (
                <button
                  key={ro}
                  type="button"
                  onClick={() => {
                    setQuery2(ro);
                    void lookup(ro);
                  }}
                  className="rounded-lg bg-surface px-2.5 py-1 font-mono font-bold text-primary hover:bg-primary hover:text-on-primary transition border border-border"
                >
                  {ro}
                </button>
              ))}
            </div>
          )}

          {miss ? (
            <p className="mt-6 text-sm text-warn">
              مفيش طلب بالرقم ده. تأكد من الرقم وحاول مرة أخرى.
            </p>
          ) : null}

          {order ? (
            <div className="text-right">
              <OrderCard order={order} />
              {order.proofUrls && order.proofUrls.length > 0 ? (
                <ProofSection urls={order.proofUrls} />
              ) : null}
              <CustomerThread
                orderId={order.orderId}
                messages={messages}
                contact={contact}
              />
            </div>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function OrderCard({ order }: { order: PublicOrder }) {
  const idx = PROGRESS_STEPS.findIndex((s) => s === order.status);
  const active = order.status === "COMPLETED" ? PROGRESS_STEPS.length - 1 : Math.max(0, idx);

  const stepLabels: Record<string, string> = {
    NEW: "تم الاستلام",
    PAID: "تم الدفع",
    IN_PROGRESS: "جاري التنفيذ",
    COMPLETED: "مكتمل",
  };

  return (
    <div className="mt-6 rounded-xl border border-primary/20 bg-surface/70 p-5">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-xs text-muted">
          {new Date(order.createdAt).toLocaleDateString("ar-EG")}
        </span>
        <span className="font-bold text-primary">{order.orderId}</span>
      </div>
      <div className="font-bold">{order.serviceName}</div>
      <div className="mb-1 text-sm text-muted">
        الحالة:{" "}
        <span className="font-medium text-warn">
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>
      <div className="mb-5 text-sm text-muted">
        الدفع:{" "}
        <span className="font-medium">
          {order.paymentStatus === "PAID"
            ? "✅ تم الدفع"
            : order.paymentStatus === "UNPAID"
              ? "⏳ لم يتم الدفع بعد"
              : order.paymentStatus}
        </span>
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-between text-[10px] md:text-xs">
        {PROGRESS_STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex size-7 items-center justify-center rounded-full text-bg ${
                  i <= active ? "bg-ok" : "bg-border text-muted"
                }`}
              >
                {i <= active ? "✓" : i + 1}
              </div>
              <span className={i <= active ? "text-ok" : "text-muted"}>
                {stepLabels[s]}
              </span>
            </div>
            {i < PROGRESS_STEPS.length - 1 ? (
              <div
                className={`mx-1 h-0.5 flex-1 ${i < active ? "bg-ok/50" : "bg-border"}`}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProofSection({ urls }: { urls?: string[] }) {
  return (
    <div className="mt-4 rounded-xl border border-border p-4">
      <h3 className="mb-3 text-sm font-bold">إثبات التنفيذ</h3>
      <div className="grid grid-cols-2 gap-2">
        {(urls ?? []).map((url) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            <img
              src={url}
              alt="إثبات"
              className="w-full rounded-lg object-cover"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

function CustomerThread({
  orderId,
  messages,
  contact,
}: {
  orderId: string;
  messages: OrderMessageDoc[];
  contact: ContactSettingsDoc | null;
}) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = msg.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const ref = doc(collection(db, "orderMessages"));
      await setDoc(ref, {
        id: ref.id,
        orderId,
        author: "customer",
        message: text,
        createdAt: new Date().toISOString(),
      });
      setMsg("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2">
        <MessageCircle className="size-4 text-primary" />
        <h3 className="text-sm font-bold">محادثة الطلب</h3>
      </div>

      {(messages ?? []).length === 0 ? (
        <p className="py-4 text-center text-xs text-muted">
          لا توجد رسائل بعد
        </p>
      ) : (
        <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">
          {(messages ?? []).map((m) => (
            <div
              key={m.id}
              className={`rounded-xl px-3 py-2 text-sm ${
                m.author === "admin"
                  ? "bg-primary/10 text-right"
                  : "bg-surface text-right"
              }`}
            >
              <p className="text-xs font-bold text-muted">
                {m.author === "admin" ? "فريق رودريجو" : "أنت"}
              </p>
              <p>{m.message}</p>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}

      <div className="flex gap-2">
        <input
          className="min-h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm"
          placeholder="اكتب رسالتك..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendMessage();
            }
          }}
        />
        <button
          type="button"
          className="btn-primary flex size-10 items-center justify-center rounded-xl"
          onClick={() => void sendMessage()}
          disabled={sending || !msg.trim()}
          aria-label="إرسال"
        >
          <Send className="size-4" />
        </button>
      </div>

      {contact ? (
        <div className="mt-3 flex gap-2">
          <a
            href={`https://t.me/${contact.telegramUsername}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#229ED9]/10 py-2 text-xs font-bold text-[#229ED9]"
          >
            <MessageCircle className="size-3.5" />
            تليجرام
          </a>
          <a
            href={`https://wa.me/${contact.whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#25D366]/10 py-2 text-xs font-bold text-[#25D366]"
          >
            واتساب
          </a>
        </div>
      ) : null}
    </div>
  );
}
