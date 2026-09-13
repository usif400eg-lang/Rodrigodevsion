import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import type { AdminDoc, AdminRole } from "./firebase-types";

export interface AdminSession {
  user: User;
  admin: AdminDoc;
  role: AdminRole;
}

/** React hook: resolves auth state + admin doc. Returns null while loading. */
export function useAdminSession(): {
  session: AdminSession | null;
  loading: boolean;
  error: string | null;
} {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSession(null);
        setLoading(false);
        return;
      }
      try {
        const adminSnap = await getDoc(doc(db, "admins", user.uid));
        if (!adminSnap.exists()) {
          // Signed into Firebase but not an admin
          await signOut(auth);
          setError("هذا الحساب لا يملك صلاحيات الإدارة.");
          setSession(null);
          setLoading(false);
          return;
        }
        const adminData = adminSnap.data() as AdminDoc;
        if (!adminData.active) {
          await signOut(auth);
          setError("تم تعطيل هذا الحساب.");
          setSession(null);
          setLoading(false);
          return;
        }
        setSession({ user, admin: adminData, role: adminData.role });
        setError(null);
      } catch (e) {
        console.error("Admin auth check failed:", e);
        setError("خطأ في التحقق من الصلاحيات.");
        setSession(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  return { session, loading, error };
}

/** One-shot async check — returns AdminSession or null */
export async function resolveAdminSession(): Promise<AdminSession | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, "admins", user.uid));
  if (!snap.exists()) return null;
  const admin = snap.data() as AdminDoc;
  if (!admin.active) return null;
  return { user, admin, role: admin.role };
}

/** Write to activityLogs collection */
export async function logActivity(params: {
  adminUid: string;
  adminName: string;
  action: string;
  entityType: "order" | "service" | "player" | "admin" | "settings" | "faq";
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) {
  const ref = doc(collection(db, "activityLogs"));
  await setDoc(ref, {
    id: ref.id,
    ...params,
    createdAt: new Date().toISOString(),
  });
}

/** Listen for unread notifications count */
export function useUnreadNotificationsCount(
  active: boolean,
  onCount: (n: number) => void,
) {
  useEffect(() => {
    if (!active) return;
    const unsub = onSnapshot(collection(db, "notifications"), (snap) => {
      const unread = snap.docs.filter((d) => !d.data().read).length;
      onCount(unread);
    });
    return () => unsub();
  }, [active, onCount]);
}
