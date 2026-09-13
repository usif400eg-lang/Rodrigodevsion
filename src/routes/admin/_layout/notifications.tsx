import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Package,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import type { NotificationDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/admin/_layout/notifications")({
  component: AdminNotificationsPage,
});

function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to notifications
  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setNotifications(snap.docs.map((d) => d.data() as NotificationDoc));
        setLoading(false);
      },
      (err) => {
        console.warn(err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  async function handleMarkAsRead(id: string) {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      const batch = writeBatch(db);
      notifications.filter((n) => !n.read).forEach((n) => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (err) {
      console.error(err);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">الإشعارات والتنبيهات</h1>
          <p className="text-sm text-muted">
            إجمالي {notifications.length} إشعار • {unreadCount} غير مقروء
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAllAsRead()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-fg hover:bg-surface transition shadow-sm"
          >
            <CheckCheck className="size-4 text-ok" />
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden p-4 space-y-3">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted">لا توجد إشعارات جديدة حالياً.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 rounded-xl border p-4 text-xs transition ${
                n.read ? "border-border/60 bg-surface/30 opacity-70" : "border-primary/30 bg-primary/5 font-medium"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${
                    n.type === "new_order"
                      ? "bg-primary/10 text-primary"
                      : n.type === "payment"
                        ? "bg-ok/10 text-ok"
                        : "bg-surface text-muted"
                  }`}
                >
                  <Bell className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-fg text-sm">{n.title}</h3>
                    {!n.read && (
                      <span className="size-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 text-muted leading-relaxed">{n.body}</p>
                  <div className="mt-2 flex items-center gap-4 text-[10px] text-muted">
                    <span>
                      {new Date(n.createdAt).toLocaleString("ar-EG")}
                    </span>
                    {n.orderId && (
                      <Link
                        to="/admin/orders/$orderId"
                        params={{ orderId: n.orderId }}
                        className="font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        فتح الطلب {n.orderId}
                        <ExternalLink className="size-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => void handleMarkAsRead(n.id)}
                    className="rounded-lg p-1.5 text-muted hover:bg-card hover:text-ok transition"
                    title="تحديد كمقروء"
                  >
                    <Check className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleDelete(n.id)}
                  className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 transition"
                  title="حذف"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
