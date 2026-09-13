import { createFileRoute } from "@tanstack/react-router";
import {
  Ban,
  CheckCircle2,
  Copy,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import type { BlockedUserDoc, CustomerDoc, OrderDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/admin/_layout/customers")({
  component: AdminCustomersPage,
});

function AdminCustomersPage() {
  const { session } = useAdminStore();
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Load orders and blocked users
  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      setOrders(snap.docs.map((d) => d.data() as OrderDoc));
      setLoading(false);
    });

    const unsubBlocked = onSnapshot(collection(db, "blockedUsers"), (snap) => {
      setBlockedUsers(snap.docs.map((d) => d.data() as BlockedUserDoc));
    });

    return () => {
      unsubOrders();
      unsubBlocked();
    };
  }, []);

  // Compute aggregated customer profiles from orders
  const customers = useMemo(() => {
    const map = new Map<string, CustomerDoc>();

    for (const o of orders) {
      const key = o.telegram.toLowerCase().trim();
      if (!key) continue;

      const isPaid = o.paymentStatus === "PAID" || o.status === "COMPLETED";
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          id: key,
          telegram: o.telegram,
          whatsapp: o.whatsapp || "",
          name: o.customerName,
          orderCount: 1,
          totalSpent: isPaid ? (o.price || 0) : 0,
          lastOrderAt: o.createdAt,
          blocked: false,
          createdAt: o.createdAt,
        });
      } else {
        existing.orderCount += 1;
        if (isPaid) existing.totalSpent += (o.price || 0);
        if (new Date(o.createdAt) > new Date(existing.lastOrderAt)) {
          existing.lastOrderAt = o.createdAt;
        }
      }
    }

    // Check blocked status
    const blockedSet = new Set(
      blockedUsers.map((b) => (b.telegram ? b.telegram.toLowerCase().trim() : "")).filter(Boolean),
    );

    const list = Array.from(map.values()).map((c) => ({
      ...c,
      blocked: blockedSet.has(c.telegram?.toLowerCase().trim() || ""),
    }));

    return list.sort((a, b) => b.orderCount - a.orderCount);
  }, [orders, blockedUsers]);

  // Filter
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.telegram && c.telegram.toLowerCase().includes(term)) ||
        (c.whatsapp && c.whatsapp.includes(term)),
    );
  }, [customers, search]);

  async function handleToggleBlock(customer: CustomerDoc) {
    if (!session) return;
    const tgKey = customer.telegram?.toLowerCase().trim();
    if (!tgKey) return;

    try {
      if (customer.blocked) {
        // Unblock
        const found = blockedUsers.find((b) => b.telegram?.toLowerCase().trim() === tgKey);
        if (found) {
          await deleteDoc(doc(db, "blockedUsers", found.id));
          await logActivity({
            adminUid: session.admin.uid,
            adminName: session.admin.displayName,
            action: `فك حظر العميل ${customer.telegram}`,
            entityType: "settings",
            entityId: found.id,
          });
        }
      } else {
        // Block
        const ref = doc(collection(db, "blockedUsers"));
        const blockedDoc: BlockedUserDoc = {
          id: ref.id,
          telegram: customer.telegram,
          whatsapp: customer.whatsapp,
          reason: "حظر يدوي من الإدارة",
          blockedBy: session.admin.displayName,
          blockedAt: new Date().toISOString(),
        };
        await setDoc(ref, blockedDoc);
        await logActivity({
          adminUid: session.admin.uid,
          adminName: session.admin.displayName,
          action: `حظر العميل ${customer.telegram}`,
          entityType: "settings",
          entityId: ref.id,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">سجل العملاء (CRM)</h1>
          <p className="text-sm text-muted">
            إجمالي {customers.length} عميل فريد قاموا بالطلب عبر المنصة
          </p>
        </div>
        <div className="w-full sm:w-72 relative flex items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، تليجرام، واتساب..."
            className="w-full rounded-xl border border-border bg-card px-4 py-2 text-xs outline-none focus:border-primary pl-9 shadow-sm"
          />
          <Search className="pointer-events-none absolute left-3 size-4 text-muted" />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted text-xs">لا يوجد عملاء مطابقون.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-border bg-surface/60 text-muted">
                <tr>
                  <th className="py-3.5 px-4 font-bold">العميل</th>
                  <th className="py-3.5 px-4 font-bold">تليجرام</th>
                  <th className="py-3.5 px-4 font-bold">واتساب</th>
                  <th className="py-3.5 px-4 font-bold text-center">عدد الطلبات</th>
                  <th className="py-3.5 px-4 font-bold">إجمالي المدفوع</th>
                  <th className="py-3.5 px-4 font-bold">آخر طلب</th>
                  <th className="py-3.5 px-4 font-bold">الحالة</th>
                  <th className="py-3.5 px-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => {
                  const tgClean = (c.telegram || "").replace("@", "");
                  return (
                    <tr key={c.id} className="transition hover:bg-surface/40">
                      <td className="py-3.5 px-4 font-bold text-fg">{c.name || "عميل بدون اسم"}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-primary font-semibold" dir="ltr">
                            {c.telegram}
                          </span>
                          {tgClean && (
                            <a
                              href={`https://t.me/${tgClean}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted hover:text-[#229ED9]"
                              title="فتح محادثة تليجرام"
                            >
                              <MessageCircle className="size-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-fg" dir="ltr">
                            {c.whatsapp || "—"}
                          </span>
                          {c.whatsapp && (
                            <a
                              href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted hover:text-[#25D366]"
                              title="فتح محادثة واتساب"
                            >
                              <Phone className="size-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-fg">
                        <span className="rounded-lg bg-surface px-2 py-1">{c.orderCount}</span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-primary">
                        {c.totalSpent.toLocaleString()} EGP
                      </td>
                      <td className="py-3.5 px-4 text-muted text-[11px]">
                        {new Date(c.lastOrderAt).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.blocked ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            محظور
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                            نشط
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => void handleToggleBlock(c)}
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                            c.blocked
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-red-50 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          {c.blocked ? "فك الحظر" : "حظر العميل"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
