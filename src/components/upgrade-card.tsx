import { Link } from "@tanstack/react-router";
import { Star, Zap } from "lucide-react";
import type { PlayerDoc } from "@/lib/firebase-types";
import { SkillBoosterIcon, SKILLS_META, useBoosterIcons } from "@/lib/booster-icons";

const STYLE: Record<PlayerDoc["style"], string> = {
  epic: "card-epic",
  showtime: "card-showtime",
  legend: "card-legend",
  highlight: "card-highlight",
};

export function UpgradeCard({ player }: { player: PlayerDoc }) {
  const customIcons = useBoosterIcons();

  return (
    <article className="flex flex-col items-center w-full">
      <Link to="/order" search={{ service: "player" }} className="block w-full max-w-52 sm:max-w-56 transition-transform duration-300 hover:scale-[1.03]">
        {/* ── Card shell ── */}
        <div
          className={`relative aspect-[3/4] overflow-hidden rounded-2xl shadow-xl ${STYLE[player.style] ?? "card-epic"}`}
          style={{ padding: "3.5px" }}
        >
          <div className="relative flex h-full flex-col rounded-[12px] bg-[#1a1028] overflow-hidden">

            {/* ── Full player image as background ── */}
            {player.imageUrl ? (
              <img
                src={player.imageUrl}
                alt={player.name}
                className="absolute inset-0 w-full h-full object-cover object-top"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-extrabold text-white/20 select-none">
                  {initials(player.name)}
                </span>
              </div>
            )}

            {/* ── Professional downward & upward reflection gradient overlays ── */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

            {/* ── Top row: rating + position | club badge ── */}
            <div className="relative z-10 flex items-start justify-between p-2.5 text-white">
              <div className="leading-none">
                <div className="text-2xl font-extrabold tabular-nums drop-shadow">
                  {player.rating}
                </div>
                <div className="text-[10px] font-bold tracking-wider opacity-90">
                  {player.position}
                </div>
              </div>
              <span className="rounded-lg bg-black/40 px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-sm border border-white/20">
                {player.club}
              </span>
            </div>

            {/* ── Bottom area: name + stars ── */}
            <div className="relative z-10 mt-auto p-2.5 text-white">
              <div className="text-center text-[13px] font-extrabold leading-tight drop-shadow">
                {player.name}
              </div>
              <div className="mt-1 flex items-center justify-center gap-0.5 text-yellow-400">
                {Array.from({ length: player.stars || 5 }).map((_, i) => (
                  <Star key={i} className="size-3 fill-current drop-shadow" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* ── Skill Booster icons row ── */}
      <div className="mt-2.5 flex w-full max-w-52 justify-between gap-0.5">
        {(player.boosters ?? [0, 0, 0, 0, 0, 0, 0, 0, 0]).map((n, i) => (
          <div
            key={SKILLS_META[i]?.id ?? i}
            className="flex flex-1 flex-col items-center gap-0.5"
            title={SKILLS_META[i]?.name}
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
              <SkillBoosterIcon
                index={i}
                customUrl={customIcons[i]}
                className="size-3.5"
              />
            </span>
            <span className="text-[9px] font-bold tabular-nums text-primary">
              {n}
            </span>
          </div>
        ))}
      </div>

      {/* ── Per-player Booster Badge ── */}
      {player.boosterName && (
        <div className="mt-2 flex items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary shadow-sm">
          {player.boosterIconUrl ? (
            <img
              src={player.boosterIconUrl}
              alt={player.boosterName}
              className="size-4 object-contain rounded-full"
            />
          ) : (
            <Zap className="size-3.5 fill-primary/40" />
          )}
          {player.boosterName}
        </div>
      )}
    </article>
  );
}

function initials(name?: string) {
  if (!name) return "R";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "R";
}
