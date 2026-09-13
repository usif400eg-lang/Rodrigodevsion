import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Shield, User } from "lucide-react";
import { CustomerAuthModal } from "./customer-auth-modal";
import { useCustomerAuth } from "@/lib/customer-auth";

export function SiteFooter() {
  const { user, logout } = useCustomerAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <footer className="border-t border-border bg-surface/50 pt-12 pb-8 text-fg">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-4">
        {/* Brand & About */}
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-extrabold text-on-primary shadow-sm">
              R
            </span>
            <span className="text-xl font-extrabold">Rodrigo</span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            منصة خدمات احترافية لـ eFootball Mobile. نساعدك توصل لديفيجن 1 وضمان اللاعبين بأمان وسرعة وسرية تامة.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="mb-3 text-sm font-bold text-fg">الخدمات والعروض</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link to="/services" className="hover:text-primary transition">
                كتالوج الخدمات
              </Link>
            </li>
            <li>
              <Link to="/upgrades" className="hover:text-primary transition">
                تطويرات اللاعبين
              </Link>
            </li>
            <li>
              <Link to="/offers" className="hover:text-primary transition">
                العروض والخصومات 🔥
              </Link>
            </li>
            <li>
              <Link to="/track" className="hover:text-primary transition">
                تتبع حالة الطلب
              </Link>
            </li>
          </ul>
        </div>

        {/* Company & Support */}
        <div>
          <h4 className="mb-3 text-sm font-bold text-fg">الدعم والمعلومات</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link to="/about" className="hover:text-primary transition">
                من نحن
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary transition">
                اتصل بنا
              </Link>
            </li>
            <li>
              <Link to="/help" className="hover:text-primary transition">
                مركز المساعدة والأسئلة
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-primary transition">
                الشروط والأحكام
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-primary transition">
                سياسة الخصوصية
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Account & Administration */}
        <div>
          <h4 className="mb-3 text-sm font-bold text-fg">حساب العميل</h4>
          <ul className="space-y-2.5 text-sm text-muted">
            {user ? (
              <>
                <li>
                  <Link to="/dashboard" className="font-bold text-primary hover:underline block">
                    لوحة التحكم الخاصة بي ←
                  </Link>
                </li>
                <li>
                  <Link to="/my-orders" className="hover:text-fg transition block">
                    سجل طلباتي
                  </Link>
                </li>
                <li>
                  <Link to="/wallet" className="hover:text-fg transition block">
                    المحفظة والرصيد
                  </Link>
                </li>
                <li>
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-xs text-muted truncate max-w-[120px]">
                      {user.displayName || user.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => void logout()}
                      className="text-xs text-warn hover:underline"
                    >
                      خروج
                    </button>
                  </div>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="hover:text-primary transition font-bold block">
                    تسجيل الدخول
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-primary transition block">
                    إنشاء حساب جديد
                  </Link>
                </li>
              </>
            )}
            <li className="border-t border-border/80 pt-2">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-on-primary transition"
              >
                <Shield className="size-3.5" />
                <span>دخول الإدارة</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-border px-4 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
        <p>© 2026 Rodrigo Divsion. جميع الحقوق محفوظة لخدمات eFootball Mobile.</p>
        <div className="flex items-center gap-4">
          <Link to="/terms" className="hover:text-primary transition">
            الشروط
          </Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-primary transition">
            الخصوصية
          </Link>
          <span>•</span>
          <Link to="/contact" className="hover:text-primary transition">
            تواصل معنا
          </Link>
        </div>
      </div>

      <CustomerAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </footer>
  );
}
