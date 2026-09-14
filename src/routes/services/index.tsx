import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Filter, Flame, Layers, Search, Star, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SERVICES } from "@/lib/catalog";
import { db } from "@/lib/firebase";
import type { ServiceDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/services/")({
  component: ServicesCatalogPage,
});

function ServicesCatalogPage() {
  const [q, setQ] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default");
  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "services"));
        const list = snap.docs
          .map((d) => {
            const data = d.data() as ServiceDoc;
            return {
              ...data,
              id: data.id || d.id,
              images: data.images ?? [],
            };
          })
          .filter((s) => s.active !== false)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (list.length > 0) {
          setServices(list);
        } else {
          setServices(
            SERVICES.map((s, idx) => ({
              ...s,
              active: true,
              featured: idx === 0,
              sortOrder: idx + 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }))
          );
        }
      } catch (e) {
        console.warn("Error fetching services catalog:", e);
        setServices(
          SERVICES.map((s, idx) => ({
            ...s,
            active: true,
            featured: idx === 0,
            sortOrder: idx + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filtered = useMemo(() => {
    let result = services.filter((s) => {
      const matchType = selectedType === "all" || s.type === selectedType;
      const term = q.trim().toLowerCase();
      const matchSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        (s.description && s.description.toLowerCase().includes(term));
      return matchType && matchSearch;
    });

    if (sortBy === "price_asc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return result;
  }, [services, selectedType, q, sortBy]);

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1 py-12 sm:py-20 bg-gradient-to-b from-surface/40 via-bg to-bg">
        <div className="mx-auto max-w-6xl px-4">
          
          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-extrabold text-primary mb-4">
              <Layers className="size-3.5" />
              <span>كتالوج الخدمات المعتمد • eFootball 2026</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              جميع خدمات <span className="text-primary">Rodrigo Divsion</span>
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
              اختر الخدمة المناسبة لحسابك مع ضمان الأمان والسرعة وأعلى معدل فوز
            </p>
          </div>

          {/* Search, Filter & Sort Controls */}
          <div className="mb-10 rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ابحث عن الخدمة..."
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 pl-10 text-xs outline-none focus:border-primary transition"
                />
                {q ? (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
                  >
                    <X className="size-4" />
                  </button>
                ) : (
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
                )}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-muted whitespace-nowrap">الترتيب:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full sm:w-44 rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs font-bold outline-none focus:border-primary transition"
                >
                  <option value="default">الافتراضي (الموصى به)</option>
                  <option value="price_asc">الأقل سعراً</option>
                  <option value="price_desc">الأعلى سعراً</option>
                </select>
              </div>
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
              {[
                { id: "all", label: "جميع الخدمات" },
                { id: "division_boost", label: "رفع ديفيجن 🏆" },
                { id: "player_guarantee", label: "ضمان لاعبين ⭐" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedType(tab.id)}
                  className={`rounded-xl px-5 py-2 text-xs font-bold transition ${
                    selectedType === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "border border-border bg-surface text-muted hover:text-fg hover:border-primary/40"
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <Link
                to="/upgrades"
                className="rounded-xl border border-primary/40 bg-primary/5 px-5 py-2 text-xs font-extrabold text-primary hover:bg-primary/10 transition mr-auto"
              >
                تطويرات اللاعبين ⚡
              </Link>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-3" />
              <p className="text-xs text-muted">جاري تحميل الخدمات...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-border bg-white p-12 text-center text-muted">
              لا توجد خدمات مطابقة لبحثك في الكتالوج.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <article
                  key={s.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/50 p-0 text-slate-900 min-h-[480px]"
                >
                  {/* Full Width Image */}
                  <div className="relative w-full h-52 overflow-hidden bg-white flex items-center justify-center">
                    <img
                      src={s.images?.[0] || "/badges/div-1.svg"}
                      alt={s.name}
                      className="size-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-white/40 pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />

                    {/* Badges */}
                    <div className="absolute top-3.5 inset-x-3.5 z-10 flex items-center justify-between pointer-events-none">
                      {s.badge ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1 text-xs font-black text-white shadow-lg shadow-orange-500/25">
                          <span>⭐</span>
                          <span>{s.badge}</span>
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-black text-white backdrop-blur-md shadow-sm">
                        {s.type === "division_boost" ? "رفع ديفيجن" : "ضمان لاعب"}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 pt-2 flex flex-col flex-1 justify-between text-center">
                    <div>
                      <h3 className="mb-2 text-xl font-black text-slate-900 tracking-tight">
                        {s.name}
                      </h3>
                      <p className="mb-6 text-xs font-medium text-slate-500 leading-relaxed line-clamp-3 px-1 min-h-12">
                        {s.description}
                      </p>
                    </div>

                    <div className="mt-auto space-y-3">
                      {/* Price Box */}
                      <div className="flex items-center justify-between rounded-2xl bg-surface border border-border/80 px-4 py-2.5">
                        <div className="flex items-baseline gap-1.5 font-extrabold">
                          <span className="text-2xl text-primary font-black">{s.price}</span>
                          <span className="text-xs text-muted font-semibold">{s.currency}</span>
                          {s.oldPrice && (
                            <span className="mr-1 text-xs text-muted line-through">
                              {s.oldPrice}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                          <Clock className="size-3.5 text-muted" />
                          <span>{s.estimatedTime}</span>
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to="/services/$id"
                          params={{ id: s.id }}
                          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border bg-surface text-xs font-extrabold text-fg hover:border-primary hover:text-primary transition shadow-sm"
                        >
                          التفاصيل والتقييم
                        </Link>
                        <Link
                          to="/order"
                          search={{ service: s.id }}
                          className="btn-cta inline-flex min-h-11 items-center justify-center rounded-2xl text-xs font-black shadow-md hover:shadow-orange-500/25 transition"
                        >
                          أطلب الآن
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
