import { Link } from "@tanstack/react-router";
import { Clock, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ServiceDoc } from "@/lib/firebase-types";

import { SERVICES } from "@/lib/catalog";

function ServiceSkeleton() {
  return (
    <div className="flex animate-pulse flex-col justify-between rounded-3xl border border-border bg-white p-0 overflow-hidden min-h-[490px] shadow-sm">
      <div className="h-52 w-full bg-surface" />
      <div className="p-6 space-y-3">
        <div className="mx-auto h-6 w-3/4 rounded-lg bg-surface" />
        <div className="mx-auto h-12 w-full rounded-lg bg-surface" />
        <div className="h-14 rounded-2xl bg-surface" />
        <div className="h-12 rounded-2xl bg-surface" />
      </div>
    </div>
  );
}

export function ServicesBoard() {
  const [q, setQ] = useState("");
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
            })),
          );
        }
      } catch (e) {
        console.warn("Firestore services fetch error, using default catalog:", e);
        setServices(
          SERVICES.map((s, idx) => ({
            ...s,
            active: true,
            featured: idx === 0,
            sortOrder: idx + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term),
    );
  }, [q, services]);

  return (
    <section id="services" className="scroll-mt-16 bg-surface px-3 py-12 md:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Search */}
        <div className="mx-auto mb-5 flex max-w-xl items-center gap-3 rounded-full border border-border bg-bg px-4 py-2 shadow-xs">
          <Search className="size-5 shrink-0 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن خدمة..."
            className="min-h-11 w-full bg-transparent text-base outline-none placeholder:text-muted"
            aria-label="بحث"
          />
          {q ? (
            <button
              type="button"
              className="text-muted"
              onClick={() => setQ("")}
              aria-label="مسح البحث"
            >
              <X className="size-5" />
            </button>
          ) : null}
        </div>

        {/* Category tabs */}
        <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/upgrades"
            className="inline-flex min-h-11 items-center rounded-full border-2 border-primary px-7 text-sm font-extrabold text-primary hover:bg-primary/5 transition"
          >
            تطويرات اللاعبين
          </Link>
          <span className="inline-flex min-h-11 items-center rounded-full bg-primary px-7 text-sm font-extrabold text-on-primary shadow-sm">
            الخدمات
          </span>
        </div>

        <p className="mx-auto mb-8 max-w-2xl text-center text-sm font-bold leading-relaxed text-muted md:text-base">
          كل ما يخص الوصول للديفيجن الأول والتصنيف وضمان اللاعبين في أسرع وقت
          وتطويرات خاصة للاعبين
        </p>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {loading ? (
            <>
              <ServiceSkeleton />
              <ServiceSkeleton />
              <ServiceSkeleton />
            </>
          ) : filtered.length === 0 ? (
            <p className="col-span-full py-10 text-center text-muted">
              لا توجد خدمات مطابقة
            </p>
          ) : (
            filtered.map((s) => (
              <article
                key={s.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/50 p-0 text-slate-900 min-h-[500px]"
              >
                {/* ── Full Width Image Header (Edge-to-Edge) ── */}
                <div className="relative w-full h-52 sm:h-60 overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src={s.images?.[0] || "/badges/div-1.svg"}
                    alt={s.name}
                    className="size-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Downward reflection & subtle fade into the white card */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-white/40 pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />

                  {/* Floating Badges */}
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

                {/* Mirror reflection fading down seamlessly into white */}
                {s.images?.[0] && (
                  <div className="relative -mt-5 h-12 w-full flex items-center justify-center overflow-hidden pointer-events-none opacity-25">
                    <img
                      src={s.images[0]}
                      alt=""
                      className="size-full object-cover scale-y-[-1] blur-[1.5px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white" />
                  </div>
                )}

                {/* ── Card Content Body ── */}
                <div className="p-6 pt-2 flex flex-col flex-1 justify-between text-center">
                  <div>
                    <h3 className="mb-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {s.name}
                    </h3>
                    <p className="mb-6 text-xs font-medium text-slate-500 leading-relaxed line-clamp-3 px-1 min-h-12">
                      {s.description}
                    </p>
                  </div>

                  <div className="mt-auto">
                    {/* Price and Duration Box */}
                    <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-3">
                      <div className="flex items-baseline gap-1.5 font-black">
                        <span className="text-2xl text-slate-900">{s.price}</span>
                        <span className="text-xs text-slate-500 font-bold">{s.currency}</span>
                        {s.oldPrice ? (
                          <span className="mr-1 text-xs text-slate-400 line-through">
                            {s.oldPrice}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                        <Clock className="size-3.5 text-primary" />
                        <span>{s.estimatedTime}</span>
                      </div>
                    </div>

                    {/* Order CTA Button */}
                    <Link
                      to="/order"
                      search={{ service: s.id }}
                      className="btn-cta inline-flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-black shadow-md transition-all hover:scale-[1.01]"
                    >
                      أطلب الآن
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
