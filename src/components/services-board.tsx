import { Link } from "@tanstack/react-router";
import { Clock, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ServiceDoc } from "@/lib/firebase-types";

import { SERVICES } from "@/lib/catalog";

function ServiceSkeleton() {
  return (
    <div className="flex animate-pulse flex-col justify-between rounded-3xl border border-primary/20 bg-[#140a28] p-6 min-h-[500px]">
      <div className="mb-4 h-44 rounded-2xl bg-white/5" />
      <div className="space-y-3">
        <div className="mx-auto h-6 w-3/4 rounded-lg bg-white/10" />
        <div className="mx-auto h-12 w-full rounded-lg bg-white/5" />
        <div className="h-14 rounded-2xl bg-white/10" />
        <div className="h-12 rounded-2xl bg-white/15" />
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
        <div className="mx-auto mb-5 flex max-w-xl items-center gap-3 rounded-full border border-border bg-bg px-4 py-2">
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
            className="inline-flex min-h-11 items-center rounded-full border-2 border-primary px-7 text-sm font-extrabold text-primary"
          >
            تطويرات اللاعبين
          </Link>
          <span className="inline-flex min-h-11 items-center rounded-full bg-primary px-7 text-sm font-extrabold text-on-primary">
            الخدمات
          </span>
        </div>

        <p className="mx-auto mb-8 max-w-2xl text-center text-sm font-bold leading-relaxed md:text-base">
          كل ما يخص الوصول للديفيجن الأول والتصنيف وضمان اللاعبين في أسرع وقت
          وتطويرات خاصة للاعبين
        </p>

        {/* Grid */}
        <div className="grid gap-5 md:grid-cols-3">
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
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-primary/25 bg-[#120826] shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/25 p-6 text-white min-h-[500px]"
              >
                {/* ── Ambient Background Glow & Gradient Reflection ── */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {/* Blurred ambient backdrop from the service image */}
                  {s.images?.[0] && (
                    <img
                      src={s.images[0]}
                      alt=""
                      className="absolute inset-0 size-full object-cover blur-2xl scale-125 opacity-30 group-hover:opacity-45 transition-all duration-700"
                    />
                  )}
                  {/* Professional downward reflection & gradient flowing through the entire card */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#1c0a38]/70 via-[#120626]/85 to-[#0b0318]" />
                  {/* Diagonal glossy sheen */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
                  {/* Top reflection light flare */}
                  <div className="absolute -top-24 -right-24 size-64 rounded-full bg-primary/20 blur-3xl" />
                </div>

                {/* ── Top Header: Badges ── */}
                <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
                  {s.badge ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1 text-xs font-bold text-white shadow-lg border border-white/20 backdrop-blur-md">
                      <span>{s.badge}</span>
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="rounded-full bg-black/45 px-3 py-1 text-[11px] font-bold text-purple-200 border border-white/10 backdrop-blur-md">
                    {s.type === "division_boost" ? "رفع ديفيجن" : "ضمان لاعب"}
                  </span>
                </div>

                {/* ── Large Full Showcase Image with Downward Reflection ── */}
                <div className="relative z-10 my-2 flex flex-col items-center justify-center">
                  <div className="relative flex h-44 w-full items-center justify-center">
                    <img
                      src={s.images?.[0] || "/badges/div-1.svg"}
                      alt={s.name}
                      className="max-h-40 max-w-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Mirror Reflection fading down into the card */}
                  {s.images?.[0] && (
                    <div className="relative -mt-4 h-14 w-full flex items-center justify-center overflow-hidden pointer-events-none opacity-30">
                      <img
                        src={s.images[0]}
                        alt=""
                        className="max-h-40 max-w-full object-contain scale-y-[-1] blur-[1px]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#120626]/75 to-[#120626]" />
                    </div>
                  )}
                </div>

                {/* ── Text on the Card (Title, Description, Price, CTA) ── */}
                <div className="relative z-10 text-center flex flex-col flex-1 justify-end pt-3">
                  <h3 className="mb-2 text-2xl font-black text-white drop-shadow-md tracking-tight">
                    {s.name}
                  </h3>
                  <p className="mb-5 text-xs font-medium text-purple-100/80 leading-relaxed line-clamp-3 px-1 min-h-12">
                    {s.description}
                  </p>

                  {/* Price and Duration Box */}
                  <div className="mb-5 flex items-center justify-between rounded-2xl bg-white/10 border border-white/15 px-4 py-3 backdrop-blur-md shadow-inner">
                    <div className="flex items-baseline gap-1.5 font-extrabold text-white">
                      <span className="text-2xl text-purple-300 font-black">{s.price}</span>
                      <span className="text-xs text-purple-200/80 font-semibold">{s.currency}</span>
                      {s.oldPrice ? (
                        <span className="mr-1 text-xs text-purple-300/60 line-through">
                          {s.oldPrice}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-purple-200 font-medium">
                      <Clock className="size-3.5 text-purple-300" />
                      <span>{s.estimatedTime}</span>
                    </div>
                  </div>

                  {/* Order CTA Button */}
                  <Link
                    to="/order"
                    search={{ service: s.id }}
                    className="btn-primary inline-flex min-h-12 w-full items-center justify-center rounded-2xl text-base font-extrabold shadow-lg hover:shadow-primary/50 transition-all hover:scale-[1.02]"
                  >
                    أطلب الآن
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
