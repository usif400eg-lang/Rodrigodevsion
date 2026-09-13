import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { UpgradeCard } from "@/components/upgrade-card";
import { db } from "@/lib/firebase";
import type { PlayerDoc } from "@/lib/firebase-types";

import { UPGRADES } from "@/lib/upgrades";

export const Route = createFileRoute("/upgrades")({ component: UpgradesPage });

function CardSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <div className="aspect-[3/4] w-full max-w-48 animate-pulse rounded-xl bg-surface" />
      <div className="mt-3 flex w-full max-w-52 justify-between gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="size-6 rounded-full bg-surface" />
            <div className="h-2 w-4 rounded bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_PLAYERS_LIST: PlayerDoc[] = UPGRADES.map((u, idx) => ({
  ...u,
  active: true,
  sortOrder: idx + 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

function UpgradesPage() {
  const [players, setPlayers] = useState<PlayerDoc[]>(() => {
    try {
      const cached = localStorage.getItem("rdg-cached-players");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_PLAYERS_LIST;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "players"));
        const list = snap.docs
          .map((d) => {
            const data = d.data() as PlayerDoc;
            return {
              ...data,
              id: data.id || d.id,
              boosters: data.boosters ?? [0, 0, 0, 0, 0, 0, 0, 0, 0],
              stars: data.stars ?? 5,
              style: data.style ?? "epic",
            };
          })
          .filter((p) => p.active !== false)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (isMounted && list.length > 0) {
          setPlayers(list);
          try {
            localStorage.setItem("rdg-cached-players", JSON.stringify(list));
          } catch {
            /* ignore */
          }
        }
      } catch (e) {
        console.warn("Firestore players fetch error:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-36">
          <h1 className="mb-3 -rotate-2 text-center text-5xl font-extrabold text-warn sm:text-6xl">
            تطويرات
          </h1>
          <p className="mb-10 text-center text-muted">
            اختر اللاعب المطلوب تطويره واطلب الخدمة مباشرة
          </p>

          {loading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : players.length === 0 ? (
            <p className="py-16 text-center text-muted">
              لا توجد تطويرات متاحة حالياً
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {players.map((p) => (
                <UpgradeCard key={p.id} player={p} />
              ))}
            </div>
          )}
        </div>
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 h-36 w-full text-primary"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="currentColor"
            opacity="0.35"
            d="M0 80 C360 160 720 10 1080 90 C1260 130 1380 70 1440 90 V200 H0 Z"
          />
          <path
            fill="currentColor"
            d="M0 120 C300 40 620 170 960 90 C1180 40 1320 130 1440 90 V200 H0 Z"
          />
        </svg>
      </main>
      <SiteFooter />
    </div>
  );
}
