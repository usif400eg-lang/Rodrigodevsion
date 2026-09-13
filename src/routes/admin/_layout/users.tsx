import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Edit2,
  Lock,
  Mail,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
  User,
  UserCheck,
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
  updateDoc,
} from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import type { AdminDoc, AdminRole } from "@/lib/firebase-types";

export const Route = createFileRoute("/admin/_layout/users")({
  component: AdminUsersPage,
});

const ROLES: { id: AdminRole; label: string; desc: string }[] = [
  { id: "OWNER", label: "المالك (OWNER)", desc: "كامل الصلاحيات بما فيها الأمان وحذف الحسابات" },
  { id: "ADMIN", label: "مدير (ADMIN)", desc: "إدارة الطلبات، الخدمات، النماذج، اللاعبين، والعملاء" },
  { id: "STAFF", label: "مشرف / موظف (STAFF)", desc: "متابعة الطلبات المعينة وتحديث حالتها فقط" },
];

function AdminUsersPage() {
  const { session } = useAdminStore();
  const [admins, setAdmins] = useState<AdminDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminDoc | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<AdminRole>("STAFF");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete modal
  const [deletingAdmin, setDeletingAdmin] = useState<AdminDoc | null>(null);
  const [deleteInput, setDeleteInput] = useState("");

  // Role Gate: OWNER only
  if (session && session.role !== "OWNER") {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center space-y-3">
        <ShieldAlert className="size-12 text-warn" />
        <h2 className="text-xl font-bold text-fg">غير مصرح بالدخول</h2>
        <p className="text-xs text-muted">
          إدارة فريق العمل والمديرين مخصصة لمالك المنصة الرئيسي (OWNER) فقط.
        </p>
      </div>
    );
  }

  useEffect(() => {
    const q = query(collection(db, "admins"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAdmins(snap.docs.map((d) => d.data() as AdminDoc));
        setLoading(false);
      },
      (err) => {
        console.warn(err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  function openCreateModal() {
    setEditingAdmin(null);
    setEmail("");
    setPassword("");
    setDisplayName("");
    setRole("STAFF");
    setModalError(null);
    setIsModalOpen(true);
  }

  function openEditModal(a: AdminDoc) {
    setEditingAdmin(a);
    setEmail(a.email);
    setPassword("");
    setDisplayName(a.displayName);
    setRole(a.role);
    setModalError(null);
    setIsModalOpen(true);
  }

  async function handleSaveAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setModalError(null);

    try {
      if (editingAdmin) {
        // Edit existing admin
        await updateDoc(doc(db, "admins", editingAdmin.uid), {
          displayName: displayName.trim(),
          role,
        });

        await logActivity({
          adminUid: session.admin.uid,
          adminName: session.admin.displayName,
          action: `تعديل بيانات ورتبة المشرف ${displayName}`,
          entityType: "admin",
          entityId: editingAdmin.uid,
        });

        setIsModalOpen(false);
      } else {
        // Create new user using secondary Firebase App to preserve current admin session
        const secondaryConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyAq2xknZWgdTjIakUie8jAeJ4SQmXXHVGs",
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "rodrigo-dvision.firebaseapp.com",
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "rodrigo-dvision",
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "rodrigo-dvision.firebasestorage.app",
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "474328399629",
          appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:474328399629:web:716e43cb5a7f40616fba44",
        };

        const secondaryApp = initializeApp(secondaryConfig, `create-admin-${Date.now()}`);
        const secondaryAuth = getAuth(secondaryApp);

        try {
          const userCred = await createUserWithEmailAndPassword(
            secondaryAuth,
            email.trim(),
            password,
          );
          const newUid = userCred.user.uid;

          const newAdminDoc: AdminDoc = {
            uid: newUid,
            email: email.trim(),
            displayName: displayName.trim(),
            role,
            createdAt: new Date().toISOString(),
            createdBy: session.admin.displayName,
            active: true,
          };

          await setDoc(doc(db, "admins", newUid), newAdminDoc);

          await logActivity({
            adminUid: session.admin.uid,
            adminName: session.admin.displayName,
            action: `إضافة مشرف جديد: ${displayName} (${role})`,
            entityType: "admin",
            entityId: newUid,
          });

          setIsModalOpen(false);
        } finally {
          await deleteApp(secondaryApp);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) {
        setModalError("هذا البريد الإلكتروني مسجل مسبقاً.");
      } else if (msg.includes("weak-password")) {
        setModalError("كلمة المرور ضعيفة. يجب أن تتكون من 6 أحرف على الأقل.");
      } else {
        setModalError("حدث خطأ أثناء حفظ المشرف.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(admin: AdminDoc) {
    if (!session) return;
    if (admin.uid === session.admin.uid) {
      alert("لا يمكنك تعطيل حسابك الخاص!");
      return;
    }

    try {
      await updateDoc(doc(db, "admins", admin.uid), {
        active: !admin.active,
      });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `${admin.active ? "تعطيل" : "تفعيل"} حساب المشرف ${admin.displayName}`,
        entityType: "admin",
        entityId: admin.uid,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePermanentDelete() {
    if (!session || !deletingAdmin || session.role !== "OWNER") return;
    if (deletingAdmin.uid === session.admin.uid) {
      alert("لا يمكنك حذف حسابك الخاص!");
      return;
    }
    if (deleteInput.trim() !== "DELETE") return;

    try {
      await deleteDoc(doc(db, "admins", deletingAdmin.uid));
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `حذف نهائي لحساب المشرف ${deletingAdmin.displayName}`,
        entityType: "admin",
        entityId: deletingAdmin.uid,
      });
      setDeletingAdmin(null);
      setDeleteInput("");
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">إدارة فريق العمل والمديرين</h1>
          <p className="text-sm text-muted">
            إضافة وتعديل صلاحيات المشرفين والمديرين (OWNER / ADMIN / STAFF)
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm"
        >
          <Plus className="size-4" />
          إضافة مشرف جديد
        </button>
      </div>

      {/* Admins Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-border bg-surface/60 text-muted">
                <tr>
                  <th className="py-3.5 px-4 font-bold">المشرف</th>
                  <th className="py-3.5 px-4 font-bold">البريد الإلكتروني</th>
                  <th className="py-3.5 px-4 font-bold">الرتبة والصلاحية</th>
                  <th className="py-3.5 px-4 font-bold">الحالة</th>
                  <th className="py-3.5 px-4 font-bold">تاريخ الإضافة</th>
                  <th className="py-3.5 px-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {admins.map((a) => {
                  const isCurrent = a.uid === session?.admin.uid;
                  return (
                    <tr key={a.uid} className="transition hover:bg-surface/40">
                      <td className="py-3.5 px-4 font-bold text-fg">
                        <div className="flex items-center gap-2">
                          <span>{a.displayName}</span>
                          {isCurrent && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                              حسابك
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted" dir="ltr">
                        {a.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            a.role === "OWNER"
                              ? "bg-purple-100 text-purple-700"
                              : a.role === "ADMIN"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-surface text-muted border border-border"
                          }`}
                        >
                          {a.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {a.active ? (
                          <span className="flex items-center gap-1 text-ok font-semibold">
                            <span className="size-1.5 rounded-full bg-ok" />
                            نشط
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-warn font-semibold">
                            <span className="size-1.5 rounded-full bg-warn" />
                            معطل
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted text-[11px]">
                        {new Date(a.createdAt).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(a)}
                            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary transition"
                            title="تعديل الرتبة"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          {!isCurrent && (
                            <>
                              <button
                                type="button"
                                onClick={() => void handleToggleActive(a)}
                                className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-fg transition"
                                title={a.active ? "تعطيل الحساب" : "تفعيل الحساب"}
                              >
                                {a.active ? <UserX className="size-4 text-warn" /> : <UserCheck className="size-4 text-ok" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeletingAdmin(a);
                                  setDeleteInput("");
                                }}
                                className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 transition"
                                title="حذف نهائي"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-bg p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-fg">
                {editingAdmin ? "تعديل رتبة المشرف" : "إضافة مشرف جديد"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-fg"
              >
                <X className="size-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 rounded-xl border border-warn/20 bg-warn/10 p-3 text-xs text-warn">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveAdmin} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-bold text-fg">الاسم الظاهر *</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="مثال: أحمد علي"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              {!editingAdmin && (
                <>
                  <div>
                    <label className="mb-1 block font-bold text-fg">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@rodrigo.com"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-fg">كلمة المرور *</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                      dir="ltr"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block font-bold text-fg">الرتبة والصلاحية *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-fg outline-none focus:border-primary"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-muted">
                  {ROLES.find((r) => r.id === role)?.desc}
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 font-semibold text-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary rounded-xl px-5 py-2 font-bold disabled:opacity-50"
                >
                  {submitting ? "جاري الحفظ..." : "حفظ المشرف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-bg p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
              <ShieldAlert className="size-4" />
              تأكيد الحذف النهائي لحساب المشرف
            </h3>
            <p className="text-muted leading-relaxed">
              أنت على وشك حذف حساب المشرف <strong>{deletingAdmin.displayName}</strong> ({deletingAdmin.email}) بشكل نهائي وإلغاء وصوله تماماً.
            </p>
            <p className="font-semibold text-fg">
              لتأكيد الحذف، يرجى كتابة كلمة <strong className="font-mono text-red-600">DELETE</strong> في المربع أدناه:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-xl border border-red-300 px-3 py-2 text-center font-mono uppercase text-xs"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingAdmin(null);
                  setDeleteInput("");
                }}
                className="rounded-xl border border-border px-4 py-2 font-semibold text-muted"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={deleteInput !== "DELETE"}
                onClick={() => void handlePermanentDelete()}
                className="rounded-xl bg-red-600 px-5 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-40"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
