import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminSession, useUnreadNotificationsCount } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/_layout")({
  component: AdminLayoutWrapper,
});

function AdminLayoutWrapper() {
  const { session, loading, error } = useAdminSession();
  const { setSession, setUnreadCount } = useAdminStore();

  useEffect(() => {
    setSession(session);
  }, [session, setSession]);

  useUnreadNotificationsCount(!!session, setUnreadCount);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-border border-t-primary" />
          <p className="text-muted">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!session || error) {
    // Redirect to login
    window.location.href = "/admin/login";
    return null;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
