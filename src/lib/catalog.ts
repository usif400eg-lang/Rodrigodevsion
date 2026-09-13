export type Service = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice?: number;
  currency: string;
  estimatedTime: string;
  badge?: string;
  type: "division_boost" | "player_guarantee";
  images: string[];
};

export const SERVICES: Service[] = [
  {
    id: "div3",
    name: "Division 3 → Division 1",
    slug: "division-3-to-1",
    description: "الوصول من دفيجن 3 الي دفيجن 1",
    price: 400,
    currency: "EGP",
    estimatedTime: "غير محدد",
    badge: "الأكثر طلباً",
    type: "division_boost",
    images: ["/badges/div-1.svg", "/badges/div-3.svg"],
  },
  {
    id: "div2",
    name: "Division 2 → Division 1",
    slug: "division-2-to-1",
    description: "الوصول من دفيجن 2 الي دفيجن 1",
    price: 300,
    currency: "EGP",
    estimatedTime: "غير محدد",
    type: "division_boost",
    images: ["/badges/div-1.svg", "/badges/div-2.svg"],
  },
  {
    id: "player",
    name: "Player Guarantee",
    slug: "player-guarantee",
    description: "العب لحد ضمان اللاعب +1950 نقطة",
    price: 500,
    currency: "EGP",
    estimatedTime: "غير محدد",
    type: "player_guarantee",
    images: ["/badges/player-epic.svg"],
  },
];

export type Player = {
  id: string;
  name: string;
  position: string;
  rating: number;
  price: number;
};

export const PLAYERS: Player[] = [
  { id: "p1", name: "Messi", position: "RWF", rating: 99, price: 500 },
  { id: "p2", name: "Ronaldo", position: "CF", rating: 101, price: 550 },
  { id: "p3", name: "Mbappé", position: "LWF", rating: 100, price: 520 },
  { id: "p4", name: "Vinicius", position: "LWF", rating: 98, price: 480 },
];

export const FAQ = [
  {
    q: "كيف أدفع؟",
    a: "بعد تقديم الطلب هتتواصل معانا على تليجرام أو واتساب، وبنرتب معاك طريقة الدفع المناسبة.",
  },
  {
    q: "قد إيه بياخد الرفع من ديفيجن 3 لـ 1؟",
    a: "عادة من 24 إلى 48 ساعة حسب حالة الحساب ومستوى المنافسة.",
  },
  {
    q: "هل الحساب آمن؟",
    a: "بنشتغل يدوي 100% وما بنستخدمش برامج ممنوعة.",
  },
  {
    q: "أقدر أتابع تقدم الطلب؟",
    a: "أيوه، من خلال رقم الطلب (RDG-xxxx) تقدر تشوف الحالة والخطوات.",
  },
];

export function formatPrice(price: number, currency = "EGP") {
  return currency === "EGP" ? `${price} جنيه` : `${price} ${currency}`;
}

export function getService(id: string | null | undefined) {
  return SERVICES.find((s) => s.id === id) ?? SERVICES[0];
}
