import React, { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface SkillMeta {
  index: number;
  id: string;
  name: string;
  enName: string;
  description: string;
}

export const SKILLS_META: SkillMeta[] = [
  { index: 0, id: "shooting", name: "تسديد", enName: "Shooting", description: "إنهاء الهجمات وقوة التسديد والركلات الحرة" },
  { index: 1, id: "passing", name: "تمرير", enName: "Passing", description: "التمرير المنخفض والعرضيات والدقة" },
  { index: 2, id: "dribbling", name: "مراوغة", enName: "Dribbling", description: "التحكم بالكرة والرشاقة والمراوغة في المساحات الضيقة" },
  { index: 3, id: "dexterity", name: "لياقة / براعة", enName: "Dexterity", description: "التسارع والتوازن والاستجابة السريعة" },
  { index: 4, id: "speed", name: "سرعة / جزء سفلي", enName: "Lower Body / Speed", description: "السرعة القصوى وقوة الركل والتحمل" },
  { index: 5, id: "aerial", name: "قوة بدنية / صراعات هوائية", enName: "Aerial / Physical", description: "الارتقاء والضربات الرأسية والالتحام الجسدي" },
  { index: 6, id: "defending", name: "دفاع", enName: "Defending", description: "الوعي الدفاعي والافتكاك والتدخلات" },
  { index: 7, id: "gk1", name: "حراسة 1", enName: "Goalkeeping 1", description: "التصدي والوعي بالمرمى والقفز" },
  { index: 8, id: "gk2", name: "حراسة 2", enName: "Goalkeeping 2", description: "ردود الفعل والارتداد والامساك بالكرة" },
];

const STORAGE_KEY = "rdg-booster-icons-cache";

export function useBoosterIcons() {
  const [icons, setIcons] = useState<Record<number, string>>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, "settings", "boosterIcons"),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const map: Record<number, string> = (data.icons as Record<number, string>) || {};
            setIcons(map);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
            } catch {
              // ignore
            }
          }
        },
        (err) => {
          console.warn("Could not listen to boosterIcons:", err);
        },
      );
      return () => unsub();
    } catch (e) {
      console.warn("boosterIcons setup error:", e);
    }
  }, []);

  return icons;
}

export async function saveBoosterIcon(index: number, url: string): Promise<void> {
  const docRef = doc(db, "settings", "boosterIcons");
  const snap = await getDoc(docRef);
  const current = snap.exists() ? (snap.data().icons || {}) : {};
  current[index] = url;
  await setDoc(docRef, { icons: current, updatedAt: new Date().toISOString() }, { merge: true });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export async function removeBoosterIcon(index: number): Promise<void> {
  const docRef = doc(db, "settings", "boosterIcons");
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const current = snap.data().icons || {};
    delete current[index];
    await setDoc(docRef, { icons: current, updatedAt: new Date().toISOString() }, { merge: true });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
}

// ── Extra Icons Library (dynamic — admin can add/delete freely) ───────────────

export interface ExtraIcon {
  id: string;      // unique id (nanoid-like)
  name: string;    // display label
  url: string;     // image URL
  createdAt: string;
}

const EXTRA_KEY = "rdg-extra-icons-cache";

export function useExtraIcons() {
  const [extras, setExtras] = useState<ExtraIcon[]>(() => {
    try {
      const c = localStorage.getItem(EXTRA_KEY);
      return c ? (JSON.parse(c) as ExtraIcon[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, "settings", "boosterIcons"),
        (snap) => {
          if (snap.exists()) {
            const list: ExtraIcon[] = (snap.data().extras as ExtraIcon[]) ?? [];
            setExtras(list);
            try { localStorage.setItem(EXTRA_KEY, JSON.stringify(list)); } catch { /* ignore */ }
          }
        },
        (err) => console.warn("extraIcons listener error:", err),
      );
      return () => unsub();
    } catch (e) {
      console.warn("extraIcons setup error:", e);
    }
  }, []);

  return extras;
}

export async function addExtraIcon(name: string, url: string): Promise<void> {
  const docRef = doc(db, "settings", "boosterIcons");
  const snap = await getDoc(docRef);
  const extras: ExtraIcon[] = snap.exists() ? ((snap.data().extras as ExtraIcon[]) ?? []) : [];
  const newIcon: ExtraIcon = {
    id: `xi_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    url,
    createdAt: new Date().toISOString(),
  };
  extras.push(newIcon);
  await setDoc(docRef, { extras, updatedAt: new Date().toISOString() }, { merge: true });
  try { localStorage.setItem(EXTRA_KEY, JSON.stringify(extras)); } catch { /* ignore */ }
}

export async function deleteExtraIcon(id: string): Promise<void> {
  const docRef = doc(db, "settings", "boosterIcons");
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const extras: ExtraIcon[] = ((snap.data().extras as ExtraIcon[]) ?? []).filter((e) => e.id !== id);
  await setDoc(docRef, { extras, updatedAt: new Date().toISOString() }, { merge: true });
  try { localStorage.setItem(EXTRA_KEY, JSON.stringify(extras)); } catch { /* ignore */ }
}


// ── Realistic Football / eFootball SVG Icons by default ──────────────────────

function ShootingSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Soccer Ball with Target Crosshair */}
      <circle cx="12" cy="12" r="9" />
      <polygon points="12,8 14.5,10 13.5,13 10.5,13 9.5,10" fill="currentColor" opacity="0.4" />
      <line x1="12" y1="3" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="3" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function PassingSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Two balls with passing trajectory line */}
      <circle cx="6" cy="16" r="3.5" />
      <circle cx="18" cy="8" r="3.5" />
      <path d="M9 14.5 C 12 11, 14 10, 15 9.5" strokeDasharray="2 2" />
      <polyline points="12,8 16,8 15,12" />
    </svg>
  );
}

function DribblingSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Zig-zag agile foot control with ball */}
      <circle cx="18" cy="6" r="3" />
      <path d="M4 19 L9 14 L6 11 L13 6" />
      <path d="M12 18 L16 14" />
    </svg>
  );
}

function DexteritySvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Flash agility / reflex spark */}
      <polygon points="13,2 4,14 11,14 10,22 20,9 13,9" fill="currentColor" opacity="0.3" />
      <polygon points="13,2 4,14 11,14 10,22 20,9 13,9" />
    </svg>
  );
}

function SpeedSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Speed shoe / motion winds */}
      <path d="M3 8h6M2 12h8M4 16h5" />
      <path d="M11 15l3-6 5 2 2 5-9 1z" />
      <circle cx="17" cy="18" r="1.5" />
    </svg>
  );
}

function AerialSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Jumping header / Aerial strength */}
      <circle cx="12" cy="5" r="2.5" />
      <path d="M8 12l4-3 4 3" />
      <path d="M12 9v7" />
      <path d="M9 20l3-4 3 4" />
      <circle cx="17" cy="4" r="1.5" fill="currentColor" />
    </svg>
  );
}

function DefendingSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Defensive shield with tackle bar */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function Goalkeeping1Svg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Goalkeeper catching glove with soccer ball */}
      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v4" />
      <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8a6 6 0 0 0 12 0v-3" />
      <circle cx="6" cy="18" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function Goalkeeping2Svg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Goalkeeper diving reflexes / goal post */}
      <path d="M3 21h18M5 21V6h14v15" />
      <circle cx="12" cy="11" r="3" />
      <path d="M9 14l3-3 3 3" />
    </svg>
  );
}

export const DEFAULT_SVGS = [
  ShootingSvg,
  PassingSvg,
  DribblingSvg,
  DexteritySvg,
  SpeedSvg,
  AerialSvg,
  DefendingSvg,
  Goalkeeping1Svg,
  Goalkeeping2Svg,
];

export function SkillBoosterIcon({
  index,
  customUrl,
  className = "size-3.5",
}: {
  index: number;
  customUrl?: string;
  className?: string;
}) {
  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt={SKILLS_META[index]?.name || "Skill"}
        className={`${className} object-contain rounded-full`}
        loading="lazy"
      />
    );
  }

  const SvgComponent = DEFAULT_SVGS[index] ?? ShootingSvg;
  return <SvgComponent className={className} />;
}
