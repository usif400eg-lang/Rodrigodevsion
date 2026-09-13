import { Link } from "@tanstack/react-router";
import { LogOut, Menu, User, X } from "lucide-react";
import { useState } from "react";
import { useCustomerAuth } from "@/lib/customer-auth";
import { CustomerAuthModal } from "./customer-auth-modal";

const LINKS = [
  { href: "/#services", label: "الخدمات" },
  { href: "/upgrades", label: "تطويرات اللاعبين" },
  { href: "/#how", label: "كيف نعمل" },
  { href: "/track", label: "تتبع الطلب" },
  { href: "/#faq", label: "الأسئلة" },
];

export function SiteHeader() {
  const { user, logout } = useCustomerAuth();
  const [open, setOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-extrabold text-on-primary shadow-[0_8px_20px_-8px_var(--color-primary)]">
            R
          </span>
          <span>
            <span className="block text-lg font-extrabold leading-none text-fg">Rodrigo</span>
            <span className="hidden text-xs text-primary font-semibold sm:block">eFootball Services</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted transition hover:text-fg">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs">
              <User className="size-3.5 text-primary" />
              <span className="font-bold text-fg max-w-[100px] truncate">
                {user.displayName || user.email?.split("@")[0]}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="text-muted hover:text-warn transition p-0.5"
                title="تسجيل الخروج"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-muted hover:text-fg hover:border-primary transition"
            >
              <User className="size-3.5" />
              تسجيل الدخول
            </button>
          )}

          <Link
            to="/order"
            className="btn-primary min-h-10 items-center rounded-xl px-5 text-xs font-bold inline-flex shadow-sm"
          >
            اطلب خدمة
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-border text-fg md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open ? (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden space-y-3 shadow-lg">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block py-2 text-sm font-semibold text-muted hover:text-fg"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}

          <div className="border-t border-border pt-3 flex flex-col gap-2">
            {user ? (
              <div className="flex items-center justify-between rounded-xl bg-surface p-3 text-xs">
                <span className="font-bold text-fg">{user.displayName || user.email}</span>
                <button
                  type="button"
                  onClick={() => {
                    void logout();
                    setOpen(false);
                  }}
                  className="text-warn font-bold"
                >
                  خروج
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setAuthModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-bold text-fg"
              >
                <User className="size-4" />
                تسجيل دخول العميل (اختياري)
              </button>
            )}

            <Link
              to="/admin/login"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2.5 text-xs font-bold text-primary"
              onClick={() => setOpen(false)}
            >
              الدخول كإدارة (Admin Login)
            </Link>
          </div>
        </div>
      ) : null}

      <CustomerAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </header>
  );
}
