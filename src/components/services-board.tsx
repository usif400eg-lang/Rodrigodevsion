import { Link } from "@tanstack/react-router";
import { Clock, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ServiceDoc } from "@/lib/firebase-types";

import { SERVICES } from "@/lib/catalog";

function ServiceSkeleton() {
  return (
    <div className="glass flex animate-pulse flex-col rounded-3xl p-5">
      <div className="mb-4 h-28 rounded-xl bg-surface" />
      <div className="mb-2 h-5 w-3/4 rounded bg-surface" />
      <div className="mb-6 h-12 rounded bg-surface" />
      <div className="mt-auto h-12 rounded-full bg-surface" />
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
              <article key={s.id} className="glass flex flex-col rounded-3xl p-5 text-center">
                {/* Badge */}
                {s.badge ? (
                  <div className="mb-3 flex justify-center">
                    <span className="rounded-full bg-warn px-3 py-1 text-xs font-bold text-bg">
                      {s.badge}
                    </span>
                  </div>
                ) : null}

                {/* Images */}
                <div className="mb-4 flex min-h-28 items-center justify-center gap-3">
                  {(s.images ?? []).map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className={
                        (s.images ?? []).length === 1
                          ? "h-28 w-28 object-contain"
                          : "h-24 w-20 object-contain"
                      }
                    />
                  ))}
                </div>

                <h3 className="mb-2 text-xl font-extrabold">{s.name}</h3>
                <p className="mb-6 min-h-12 text-sm font-medium text-muted">
                  {s.description}
                </p>

                <div className="mt-auto mb-4 flex items-center justify-between px-1">
                  <div className="flex items-baseline gap-1 font-extrabold">
                    {s.oldPrice ? (
                      <span className="text-sm text-muted line-through">
                        {s.oldPrice}
                      </span>
                    ) : null}
                    <span className="text-2xl">{s.price}</span>
                    <span className="text-xs text-muted">{s.currency}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted">
                    <Clock className="size-4" />
                    {s.estimatedTime}
                  </div>
                </div>

                <Link
                  to="/order"
                  search={{ service: s.id }}
                  className="btn-primary inline-flex min-h-12 items-center justify-center rounded-full text-lg font-extrabold"
                >
                  أطلب الآن
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
