import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  X,
  XCircle,
} from "lucide-react";

export type ModalType = "info" | "success" | "warning" | "error" | "danger";

export interface ModalOptions {
  title?: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
}

interface ActiveModal extends ModalOptions {
  id: string;
  resolve: (value: boolean) => void;
}

// Global modal bus for imperative calls anywhere in app
let triggerModal: ((options: ModalOptions) => Promise<boolean>) | null = null;

export function showAppAlert(
  messageOrOptions: string | Omit<ModalOptions, "isConfirm">
): Promise<boolean> {
  const options: ModalOptions =
    typeof messageOrOptions === "string"
      ? { message: messageOrOptions, type: "info", isConfirm: false }
      : { ...messageOrOptions, isConfirm: false };

  if (triggerModal) {
    return triggerModal(options);
  }
  // Fallback if container not yet mounted
  return Promise.resolve(true);
}

export function showAppConfirm(
  messageOrOptions: string | Omit<ModalOptions, "isConfirm">
): Promise<boolean> {
  const options: ModalOptions =
    typeof messageOrOptions === "string"
      ? {
          title: "تأكيد الإجراء",
          message: messageOrOptions,
          type: "danger",
          confirmText: "تأكيد",
          cancelText: "إلغاء",
          isConfirm: true,
        }
      : {
          title: messageOrOptions.title || "تأكيد الإجراء",
          confirmText: messageOrOptions.confirmText || "تأكيد",
          cancelText: messageOrOptions.cancelText || "إلغاء",
          type: messageOrOptions.type || "danger",
          ...messageOrOptions,
          isConfirm: true,
        };

  if (triggerModal) {
    return triggerModal(options);
  }
  return Promise.resolve(true);
}

// Global aliases
export const appAlert = showAppAlert;
export const appConfirm = showAppConfirm;

export function AppModalContainer() {
  const [modal, setModal] = useState<ActiveModal | null>(null);

  useEffect(() => {
    // Register trigger
    triggerModal = (options: ModalOptions) => {
      return new Promise<boolean>((resolve) => {
        setModal({
          ...options,
          id: Math.random().toString(),
          resolve,
        });
      });
    };

    // Override browser native window.alert and window.confirm with site theme
    if (typeof window !== "undefined") {
      const originalAlert = window.alert;
      const originalConfirm = window.confirm;

      window.alert = (message?: any) => {
        showAppAlert({
          title: "تنبيه من المنصة",
          message: String(message ?? ""),
          type: "info",
        });
      };

      // Note: window.confirm is synchronous in standard JS, but hooking it provides protection
      // where async is used. Direct usage of appConfirm(...) is preferred.
      return () => {
        window.alert = originalAlert;
        window.confirm = originalConfirm;
        triggerModal = null;
      };
    }
  }, []);

  if (!modal) return null;

  const handleClose = (result: boolean) => {
    const current = modal;
    setModal(null);
    current.resolve(result);
  };

  const type = modal.type || "info";

  const getThemeConfig = () => {
    switch (type) {
      case "error":
      case "danger":
        return {
          icon: <XCircle className="size-8 text-rose-400 animate-pulse" />,
          glow: "shadow-[0_0_50px_rgba(244,63,94,0.25)] border-rose-500/40",
          topBar: "from-rose-500 via-pink-500 to-rose-600",
          iconBg: "bg-rose-500/15 border-rose-500/30 text-rose-400",
          confirmBtn:
            "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="size-8 text-amber-400 animate-pulse" />,
          glow: "shadow-[0_0_50px_rgba(245,158,11,0.25)] border-amber-500/40",
          topBar: "from-amber-500 via-orange-500 to-amber-600",
          iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
          confirmBtn:
            "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="size-8 text-emerald-400" />,
          glow: "shadow-[0_0_50px_rgba(16,185,129,0.25)] border-emerald-500/40",
          topBar: "from-emerald-500 via-teal-500 to-emerald-600",
          iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
          confirmBtn:
            "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]",
        };
      case "info":
      default:
        return {
          icon: <HelpCircle className="size-8 text-purple-400" />,
          glow: "shadow-[0_0_50px_rgba(139,92,246,0.3)] border-purple-500/40",
          topBar: "from-purple-600 via-indigo-600 to-cyan-500",
          iconBg: "bg-purple-500/15 border-purple-500/30 text-purple-400",
          confirmBtn:
            "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]",
        };
    }
  };

  const theme = getThemeConfig();

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Frosted Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-200"
        onClick={() => !modal.isConfirm && handleClose(false)}
      />

      {/* Centered Modal Card */}
      <div
        className={`relative w-full max-w-md rounded-3xl bg-[#0b1120]/95 border ${theme.glow} p-6 sm:p-7 text-center shadow-2xl backdrop-blur-2xl transition-all duration-300 scale-100 animate-in fade-in zoom-in-95`}
      >
        {/* Glowing Top Accent Bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl bg-gradient-to-r ${theme.topBar}`}
        />

        {/* Close Button (X) */}
        <button
          type="button"
          onClick={() => handleClose(false)}
          className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors border border-white/5"
          aria-label="إغلاق"
        >
          <X className="size-4" />
        </button>

        {/* Center Icon Badge */}
        <div className="flex justify-center mt-2 mb-4">
          <div
            className={`flex size-16 items-center justify-center rounded-2xl border ${theme.iconBg} shadow-inner`}
          >
            {theme.icon}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-white mb-2 tracking-tight">
          {modal.title || (modal.isConfirm ? "تأكيد الإجراء" : "إشعار")}
        </h3>

        {/* Message */}
        <p className="text-sm font-medium text-slate-300/90 leading-relaxed mb-6 px-2">
          {modal.message}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3">
          {modal.isConfirm ? (
            <>
              <button
                type="button"
                onClick={() => handleClose(true)}
                className={`flex-1 py-3 px-5 rounded-2xl font-black text-sm transition-all duration-200 active:scale-95 ${theme.confirmBtn}`}
              >
                {modal.confirmText || "تأكيد"}
              </button>
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="flex-1 py-3 px-5 rounded-2xl font-bold text-sm bg-surface/80 hover:bg-surface text-slate-300 hover:text-white border border-white/10 transition-all duration-200 active:scale-95"
              >
                {modal.cancelText || "إلغاء"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleClose(true)}
              className={`w-full py-3 px-6 rounded-2xl font-black text-sm transition-all duration-200 active:scale-95 ${theme.confirmBtn}`}
            >
              {modal.confirmText || "حسناً"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
