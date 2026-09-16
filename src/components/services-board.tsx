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
    <section id="services" className="scroll-mt-16 bg-[#090d16] px-3 py-16 md:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Search */}
        <div className="mx-auto mb-6 flex max-w-xl items-center gap-3 rounded-full border border-white/10 bg-slate-900/80 px-5 py-2.5 shadow-xl backdrop-blur-xl focus-within:border-primary/50 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition">
          <Search className="size-5 shrink-0 text-cyan-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن خدمة..."
            className="min-h-11 w-full bg-transparent text-base text-white outline-none placeholder:text-slate-400 font-medium"
            aria-label="بحث"
          />
          {q ? (
            <button
              type="button"
              className="text-slate-400 hover:text-white transition"
              onClick={() => setQ("")}
              aria-label="مسح البحث"
            >
              <X className="size-5" />
            </button>
          ) : null}
        </div>

        {/* Category tabs */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/upgrades"
            className="inline-flex min-h-11 items-center rounded-full border border-primary/40 bg-primary/10 px-7 text-sm font-extrabold text-cyan-300 hover:bg-primary/20 transition backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.15)]"
          >
            تطويرات اللاعبين
          </Link>
          <span className="inline-flex min-h-11 items-center rounded-full bg-primary px-7 text-sm font-extrabold text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] border border-white/20">
            الخدمات
          </span>
        </div>

        <p className="mx-auto mb-10 max-w-2xl text-center text-sm font-bold leading-relaxed text-slate-400 md:text-base">
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
            <p className="col-span-full py-10 text-center text-slate-400">
              لا توجد خدمات مطابقة
            </p>
          ) : (
            filtered.map((s) => (
              <article
                key={s.id}
                className="card-3d group relative flex flex-col justify-between overflow-hidden rounded-[30px] border border-white/10 bg-slate-900/75 shadow-2xl hover:border-primary/50 p-0 text-white min-h-[500px] backdrop-blur-xl"
              >
                {/* ── Full Width Image Header (Edge-to-Edge) ── */}
                <div className="relative w-full h-52 sm:h-60 overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img
                    src={s.images?.[0] || "/badges/div-1.svg"}
                    alt={s.name}
                    className="size-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Downward reflection & subtle fade into the card */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-slate-900/90 pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none" />

                  {/* Floating 3D Badges */}
                  <div className="absolute top-3.5 inset-x-3.5 z-10 flex items-center justify-between pointer-events-none">
                    {s.badge ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1 text-xs font-black text-white shadow-lg shadow-orange-500/30">
                        <img src="/3d/crown-3d.jpg" alt="" className="size-4 rounded-full object-cover" />
                        <span>{s.badge}</span>
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/85 px-3 py-1 text-[11px] font-black text-cyan-300 backdrop-blur-md shadow-md border border-white/15">
                      <img
                        src={s.type === "division_boost" ? "/3d/trophy-3d.jpg" : "/3d/crown-3d.jpg"}
                        alt=""
                        className="size-3.5 rounded-full object-cover"
                      />
                      <span>{s.type === "division_boost" ? "رفع ديفيجن" : "ضمان لاعب"}</span>
                    </span>
                  </div>
                </div>

                {/* ── Card Content Body ── */}
                <div className="p-6 pt-2 flex flex-col flex-1 justify-between text-center">
                  <div>
                    <h3 className="mb-2 text-xl sm:text-2xl font-black text-white tracking-tight">
                      {s.name}
                    </h3>
                    <p className="mb-6 text-xs font-medium text-slate-300 leading-relaxed line-clamp-3 px-1 min-h-12">
                      {s.description}
                    </p>
                  </div>

                  <div className="mt-auto">
                    {/* Price and Duration Box */}
                    <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 backdrop-blur-md">
                      <div className="flex items-baseline gap-1.5 font-black">
                        <span className="text-2xl text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">{s.price}</span>
                        <span className="text-xs text-slate-400 font-bold">{s.currency}</span>
                        {s.oldPrice ? (
                          <span className="mr-1 text-xs text-slate-500 line-through">
                            {s.oldPrice}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
                        <Clock className="size-3.5 text-cyan-400" />
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
