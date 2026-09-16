import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  Flame,
  Globe,
  HelpCircle,
  Home,
  Image,
  LogOut,
  MessageSquare,
  Menu,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Tag,
  Users,
  UserX,
  X,
  Zap,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useAdminStore } from "@/lib/admin-store";
import type { AdminRole } from "@/lib/firebase-types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  minRole?: AdminRole;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "لوحة التحكم", icon: BarChart3 },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingCart },
  { href: "/admin/services", label: "الخدمات", icon: Package },
  { href: "/admin/offers", label: "العروض والباقات", icon: Flame },
  { href: "/admin/coupons", label: "كوبونات الخصم", icon: Tag },
  { href: "/admin/players", label: "اللاعبين", icon: Zap },
  { href: "/admin/forms", label: "النماذج", icon: FileText },
  { href: "/admin/customers", label: "العملاء", icon: Users },
  { href: "/admin/faq", label: "الأسئلة الشائعة", icon: HelpCircle },
  { href: "/admin/media", label: "الوسائط", icon: Image },
  { href: "/admin/contact", label: "بيانات التواصل", icon: MessageSquare },
  { href: "/admin/homepage", label: "الصفحة الرئيسية", icon: Home },
  { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
  { href: "/admin/blocked-users", label: "المحظورون", icon: UserX },
  { href: "/admin/activity", label: "سجل النشاط", icon: Activity },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
  { href: "/admin/security", label: "الأمان", icon: Shield, minRole: "OWNER" },
  { href: "/admin/users", label: "المديرون", icon: Globe, minRole: "OWNER" },
];

function canAccess(role: AdminRole, minRole?: AdminRole) {
  if (!minRole) return true;
  if (minRole === "OWNER") return role === "OWNER";
  if (minRole === "ADMIN") return role === "OWNER" || role === "ADMIN";
  return true;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, sidebarOpen, unreadCount, toggleSidebar, setSidebarOpen } =
    useAdminStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const role = session?.role ?? "STAFF";
  const visibleItems = NAV_ITEMS.filter((item) => canAccess(role, item.minRole));

  async function handleSignOut() {
    await signOut(auth);
    window.location.href = "/admin/login";
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-extrabold text-on-primary shadow-[0_4px_12px_-4px_var(--color-primary)]">
          R
        </span>
        {(sidebarOpen || mobileOpen) && (
          <div>
            <div className="font-extrabold leading-none">Rodrigo</div>
            <div className="text-[10px] text-muted">لوحة الإدارة</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        {visibleItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex min-h-11 items-center gap-3 px-4 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary/10 font-bold text-primary"
                  : "text-muted hover:bg-surface hover:text-fg"
              }`}
            >
              <Icon className="size-5 shrink-0" />
              {(sidebarOpen || mobileOpen) && (
                <span className="flex-1">{item.label}</span>
              )}
              {item.href === "/admin/notifications" && unreadCount > 0 && (sidebarOpen || mobileOpen) && (
                <span className="flex size-5 items-center justify-center rounded-full bg-warn text-[10px] font-bold text-bg">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: role badge + sign out */}
      <div className="border-t border-border p-4">
        {(sidebarOpen || mobileOpen) && session && (
          <div className="mb-3 rounded-xl bg-surface px-3 py-2">
            <div className="text-xs font-bold text-fg">{session.admin.displayName}</div>
            <div className="text-[10px] text-muted">{session.admin.email}</div>
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {role}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted transition hover:bg-surface hover:text-warn"
        >
          <LogOut className="size-5 shrink-0" />
          {(sidebarOpen || mobileOpen) && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden border-l border-border bg-bg transition-all duration-200 md:flex md:flex-col ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-fg/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 border-l border-border bg-bg transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Toggle sidebar (desktop) */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden size-9 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-surface md:flex"
              aria-label="تبديل القائمة"
            >
              {sidebarOpen ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </button>
            {/* Mobile menu */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex size-9 items-center justify-center rounded-xl border border-border text-muted md:hidden"
              aria-label="القائمة"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              to="/admin/notifications"
              className="relative flex size-9 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-surface"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 flex size-4 items-center justify-center rounded-full bg-warn text-[9px] font-bold text-bg">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex size-9 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-surface"
              title="الموقع العام"
            >
              <Globe className="size-4" />
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
