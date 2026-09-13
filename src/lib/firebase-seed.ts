/**
 * Seeds initial Firestore data on first run.
 * Called once from the app when collections are found empty.
 * Safe to call multiple times — each seeder checks before writing.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  ContactSettingsDoc,
  FaqDoc,
  OrderCounterDoc,
  PlayerDoc,
  ServiceDoc,
  SiteSettingsDoc,
} from "./firebase-types";

let seeded = false;

export async function seedFirestoreIfEmpty(): Promise<void> {
  if (seeded) return;
  seeded = true;

  await Promise.all([
    seedServices(),
    seedPlayers(),
    seedFaq(),
    seedSiteSettings(),
    seedContactSettings(),
    seedOrderCounter(),
  ]);
}

// ─── Services ──────────────────────────────────────────────────────────────
async function seedServices() {
  const snap = await getDocs(query(collection(db, "services"), limit(1)));
  if (!snap.empty) return;

  const batch = writeBatch(db);
  const services: Omit<ServiceDoc, "id">[] = [
    {
      name: "Player Guarantee",
      slug: "player-guarantee",
      description: "العب لحد ضمان اللاعب +1950 نقطة",
      price: 500,
      currency: "EGP",
      estimatedTime: "24-48 ساعة",
      badge: "الأكثر طلباً",
      type: "player_guarantee",
      images: ["/badges/player-epic.svg"],
      active: true,
      featured: true,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: "Division 2 → Division 1",
      slug: "division-2-to-1",
      description: "الوصول من ديفيجن 2 إلى ديفيجن 1",
      price: 300,
      currency: "EGP",
      estimatedTime: "12-24 ساعة",
      type: "division_boost",
      images: ["/badges/div-1.svg", "/badges/div-2.svg"],
      active: true,
      featured: false,
      sortOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: "Division 3 → Division 1",
      slug: "division-3-to-1",
      description: "الوصول من ديفيجن 3 إلى ديفيجن 1",
      price: 400,
      currency: "EGP",
      estimatedTime: "24-48 ساعة",
      type: "division_boost",
      images: ["/badges/div-1.svg", "/badges/div-3.svg"],
      active: true,
      featured: false,
      sortOrder: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const s of services) {
    const ref = doc(collection(db, "services"));
    batch.set(ref, { ...s, id: ref.id });
  }
  await batch.commit();
}

// ─── Players ───────────────────────────────────────────────────────────────
async function seedPlayers() {
  const snap = await getDocs(query(collection(db, "players"), limit(1)));
  if (!snap.empty) return;

  const batch = writeBatch(db);
  const players: Omit<PlayerDoc, "id">[] = [
    {
      name: "Lionel Messi",
      position: "RWF",
      rating: 109,
      club: "Barça",
      style: "epic",
      stars: 4,
      boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
      active: true,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: "Bruno",
      position: "AMF",
      rating: 105,
      club: "United",
      style: "showtime",
      stars: 4,
      boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
      active: true,
      sortOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: "Pelé",
      position: "SS",
      rating: 107,
      club: "Brazil",
      style: "legend",
      stars: 5,
      boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
      active: true,
      sortOrder: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: "Ibrahimović",
      position: "CF",
      rating: 104,
      club: "Milan",
      style: "legend",
      stars: 4,
      boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
      active: true,
      sortOrder: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: "Courtois",
      position: "GK",
      rating: 103,
      club: "Belgium",
      style: "highlight",
      stars: 5,
      boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
      active: true,
      sortOrder: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: "Mbappé",
      position: "CF",
      rating: 106,
      club: "Paris",
      style: "epic",
      stars: 4,
      boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
      active: true,
      sortOrder: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: "Cruyff",
      position: "SS",
      rating: 108,
      club: "Barça",
      style: "legend",
      stars: 5,
      boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
      active: true,
      sortOrder: 7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: "G. Jesus",
      position: "CF",
      rating: 102,
      club: "Arsenal",
      style: "showtime",
      stars: 4,
      boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
      active: true,
      sortOrder: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const p of players) {
    const ref = doc(collection(db, "players"));
    batch.set(ref, { ...p, id: ref.id });
  }
  await batch.commit();
}

// ─── FAQ ───────────────────────────────────────────────────────────────────
async function seedFaq() {
  const snap = await getDocs(query(collection(db, "faq"), limit(1)));
  if (!snap.empty) return;

  const batch = writeBatch(db);
  const faqs: Omit<FaqDoc, "id">[] = [
    {
      question: "كيف أدفع؟",
      answer:
        "بعد تقديم الطلب هتتواصل معانا على تليجرام أو واتساب، وبنرتب معاك طريقة الدفع المناسبة.",
      sortOrder: 1,
      active: true,
    },
    {
      question: "قد إيه بياخد الرفع من ديفيجن 3 لـ 1؟",
      answer: "عادة من 24 إلى 48 ساعة حسب حالة الحساب ومستوى المنافسة.",
      sortOrder: 2,
      active: true,
    },
    {
      question: "هل الحساب آمن؟",
      answer: "بنشتغل يدوي 100% وما بنستخدمش برامج ممنوعة.",
      sortOrder: 3,
      active: true,
    },
    {
      question: "أقدر أتابع تقدم الطلب؟",
      answer:
        "أيوه، من خلال رقم الطلب (RDG-xxxx) تقدر تشوف الحالة والخطوات.",
      sortOrder: 4,
      active: true,
    },
    {
      question: "إيه هو ضمان اللاعب؟",
      answer:
        "خدمة Player Guarantee معناها إننا بنلعب على حسابك لحد ما توصل 1950 نقطة الضرورية للحصول على اللاعب المضمون.",
      sortOrder: 5,
      active: true,
    },
  ];

  for (const f of faqs) {
    const ref = doc(collection(db, "faq"));
    batch.set(ref, { ...f, id: ref.id });
  }
  await batch.commit();
}

// ─── Site Settings ─────────────────────────────────────────────────────────
async function seedSiteSettings() {
  const ref = doc(db, "settings", "site");
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const data: SiteSettingsDoc = {
    siteName: "Rodrigo",
    tagline: "رودريجو — خدمات eFootball Mobile",
    heroHeadline: "العب أقل. وصل أكتر.",
    heroSub:
      "خدمات احترافية لرفع الديفيجن وضمان اللاعبين في eFootball Mobile. فريق متخصص، سرعة في التنفيذ، ودعم مستمر.",
    stat1Value: "+1200",
    stat1Label: "طلب مكتمل",
    stat2Value: "24/7",
    stat2Label: "دعم فني",
    stat3Value: "~18س",
    stat3Label: "متوسط الإنجاز",
    showHero: true,
    showTrustStrip: true,
    showServices: true,
    showHowItWorks: true,
    showFaq: true,
    showCta: true,
    showUpgrades: true,
    maintenanceMode: false,
    maintenanceMessage: "الموقع تحت الصيانة، نعود قريباً.",
    updatedAt: new Date().toISOString(),
  };
  await setDoc(ref, data);
}

// ─── Contact Settings ──────────────────────────────────────────────────────
async function seedContactSettings() {
  const ref = doc(db, "settings", "contact");
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const data: ContactSettingsDoc = {
    whatsappNumber: "201012345678",
    telegramUsername: "RodrigoServices",
    supportHours: "يومياً 10 صباحاً — 2 فجراً",
    updatedAt: new Date().toISOString(),
  };
  await setDoc(ref, data);
}

// ─── Order Counter ─────────────────────────────────────────────────────────
async function seedOrderCounter() {
  const ref = doc(db, "settings", "orderCounter");
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const data: OrderCounterDoc = { current: 1000 };
  await setDoc(ref, data);
}
