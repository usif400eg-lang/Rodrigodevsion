import { createFileRoute } from "@tanstack/react-router";
import {
  Ban,
  Plus,
  Search,
  Trash2,
  UserX,
  X,
} from "lucide-react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import { appAlert, appConfirm } from "@/components/ui/app-modal";
import type { BlockedUserDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/admin/_layout/blocked-users")({
  component: AdminBlockedUsersPage,
});

function AdminBlockedUsersPage() {
  const { session } = useAdminStore();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const q = query(collection(db, "blockedUsers"), orderBy("blockedAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setBlockedUsers(snap.docs.map((d) => d.data() as BlockedUserDoc));
        setLoading(false);
      },
      (err) => {
        console.warn(err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  async function handleAddBlocked(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    try {
      const ref = doc(collection(db, "blockedUsers"));
      const newBlocked: Record<string, any> = {
        id: ref.id,
        reason: reason.trim() || "حظر يدوي",
        blockedBy: session.admin.displayName,
        blockedAt: new Date().toISOString(),
      };
      if (telegram.trim()) newBlocked.telegram = telegram.trim();
      if (whatsapp.trim()) newBlocked.whatsapp = whatsapp.trim();

      await setDoc(ref, newBlocked);
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `إضافة مستخدم لقائمة الحظر: ${telegram || whatsapp}`,
        entityType: "settings",
        entityId: ref.id,
      });

      setIsModalOpen(false);
      setTelegram("");
      setWhatsapp("");
      setReason("");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUnblock(item: BlockedUserDoc) {
    if (!session) return;
    const confirmed = await appConfirm({
      title: "تأكيد فك الحظر",
      message: `هل أنت متأكد من فك الحظر عن "${item.telegram || item.whatsapp}"؟`,
      confirmText: "نعم، فك الحظر",
      type: "info",
    });
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "blockedUsers", item.id));
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `فك حظر المستخدم ${item.telegram || item.whatsapp}`,
        entityType: "settings",
        entityId: item.id,
      });
      await appAlert({
        title: "تم فك الحظر",
        message: "تم فك الحظر عن المستخدم بنجاح.",
        type: "success",
      });
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = blockedUsers.filter((b) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      (b.telegram && b.telegram.toLowerCase().includes(term)) ||
      (b.whatsapp && b.whatsapp.includes(term)) ||
      (b.reason && b.reason.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">المستخدمون المحظورون</h1>
          <p className="text-sm text-muted">
            قائمة الحسابات المحظورة من تقديم طلبات جديدة عبر المنصة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm"
          >
            <Plus className="size-4" />
            حظر مستخدم جديد
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="w-full sm:w-80 relative flex items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث في المحظورين..."
          className="w-full rounded-xl border border-border bg-card px-4 py-2 text-xs outline-none focus:border-primary pl-9 shadow-sm"
        />
        <Search className="pointer-events-none absolute left-3 size-4 text-muted" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted">لا يوجد مستخدمون محظورون.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-border bg-surface/60 text-muted">
                <tr>
                  <th className="py-3.5 px-4 font-bold">تليجرام</th>
                  <th className="py-3.5 px-4 font-bold">واتساب</th>
                  <th className="py-3.5 px-4 font-bold">سبب الحظر</th>
                  <th className="py-3.5 px-4 font-bold">المشرف المسؤول</th>
                  <th className="py-3.5 px-4 font-bold">تاريخ الحظر</th>
                  <th className="py-3.5 px-4 font-bold text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr key={b.id} className="transition hover:bg-surface/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-red-600" dir="ltr">
                      {b.telegram || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono" dir="ltr">
                      {b.whatsapp || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-muted">{b.reason || "—"}</td>
                    <td className="py-3.5 px-4 font-semibold text-fg">{b.blockedBy}</td>
                    <td className="py-3.5 px-4 text-muted text-[11px]">
                      {new Date(b.blockedAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => void handleUnblock(b)}
                        className="rounded-lg bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700 hover:bg-green-100 transition"
                      >
                        فك الحظر
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-bg p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-fg flex items-center gap-2">
                <Ban className="size-4 text-red-600" />
                حظر مستخدم جديد
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-fg"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleAddBlocked} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-bold text-fg">معرف تليجرام</label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-fg">رقم الهاتف / واتساب</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="201012345678"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-fg">سبب الحظر</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: سبام متكرر، إرسال طلبات وهمية..."
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 font-semibold text-muted"
                >
                  إلغاء
                </button>
                <button type="submit" className="rounded-xl bg-red-600 px-5 py-2 font-bold text-white hover:bg-red-700">
                  تأكيد الحظر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
