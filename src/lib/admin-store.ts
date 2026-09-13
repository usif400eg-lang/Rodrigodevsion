import { create } from "zustand";
import type { AdminSession } from "./admin-auth";

interface AdminStore {
  session: AdminSession | null;
  sidebarOpen: boolean;
  unreadCount: number;
  setSession: (s: AdminSession | null) => void;
  setSidebarOpen: (v: boolean) => void;
  setUnreadCount: (n: number) => void;
  toggleSidebar: () => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  session: null,
  sidebarOpen: true,
  unreadCount: 0,
  setSession: (s) => set({ session: s }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setUnreadCount: (n) => set({ unreadCount: n }),
  toggleSidebar: () => set((st) => ({ sidebarOpen: !st.sidebarOpen })),
}));
