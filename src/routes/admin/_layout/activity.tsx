import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Filter,
  Search,
  User,
} from "lucide-react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import type { ActivityLogDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/admin/_layout/activity")({
  component: AdminActivityPage,
});

function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLogDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  useEffect(() => {
    const q = query(
      collection(db, "activityLogs"),
      orderBy("createdAt", "desc"),
      limit(200),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(snap.docs.map((d) => d.data() as ActivityLogDoc));
        setLoading(false);
      },
      (err) => {
        console.warn(err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (typeFilter !== "ALL" && l.entityType !== typeFilter) return false;
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return (
        l.action.toLowerCase().includes(term) ||
        l.adminName.toLowerCase().includes(term) ||
        l.entityId.toLowerCase().includes(term)
      );
    });
  }, [logs, search, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">سجل النشاطات والمراجعة (Audit Log)</h1>
          <p className="text-sm text-muted">
            تسجيل وتوثيق كافة العمليات والتعديلات التي يقوم بها المشرفون والمديرون
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative flex items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في الإجراء، اسم المسؤول، المعرف..."
            className="w-full rounded-xl border border-border bg-card px-4 py-2 text-xs outline-none focus:border-primary pl-9 shadow-sm"
          />
          <Search className="pointer-events-none absolute left-3 size-4 text-muted" />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-fg outline-none focus:border-primary shadow-sm"
        >
          <option value="ALL">جميع الأقسام</option>
          <option value="order">طلبات (Orders)</option>
          <option value="service">خدمات (Services)</option>
          <option value="player">لاعبين (Players)</option>
          <option value="faq">أسئلة (FAQ)</option>
          <option value="settings">إعدادات (Settings)</option>
          <option value="admin">مشرفين (Admins)</option>
        </select>
      </div>

      {/* Log list */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden p-4 space-y-3">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted">لا توجد نشاطات مسجلة مطابقة.</div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface/40 p-4 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Activity className="size-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-fg">{log.adminName}</span>
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted border border-border">
                      {log.entityType}
                    </span>
                    {log.entityId && (
                      <span className="font-mono text-[10px] text-primary">
                        ({log.entityId})
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-fg">{log.action}</p>
                  {(log.before || log.after) && (
                    <div className="mt-2 rounded-lg bg-card p-2 text-[10px] font-mono text-muted border border-border/80">
                      {log.before && <div>السابق: {JSON.stringify(log.before)}</div>}
                      {log.after && <div className="text-primary">الجديد: {JSON.stringify(log.after)}</div>}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-muted whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString("ar-EG")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
