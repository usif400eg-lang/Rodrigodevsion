export type UpgradePlayer = {
  id: string;
  name: string;
  position: string;
  rating: number;
  club: string;
  style: "epic" | "showtime" | "legend" | "highlight";
  stars: number;
  boosters: number[];
};

export const SKILL_LABELS = [
  "تسديد",
  "تمرير",
  "مراوغة",
  "لياقة",
  "سرعة",
  "قوة",
  "دفاع",
  "حراسة",
  "حراسة 2",
];

export const UPGRADES: UpgradePlayer[] = [
  {
    id: "messi",
    name: "Lionel Messi",
    position: "RWF",
    rating: 109,
    club: "Barça",
    style: "epic",
    stars: 4,
    boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
  },
  {
    id: "bruno",
    name: "Bruno",
    position: "AMF",
    rating: 105,
    club: "United",
    style: "showtime",
    stars: 4,
    boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
  },
  {
    id: "pele",
    name: "Pelé",
    position: "SS",
    rating: 107,
    club: "Brazil",
    style: "legend",
    stars: 5,
    boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
  },
  {
    id: "ibra",
    name: "Ibrahimović",
    position: "CF",
    rating: 104,
    club: "Milan",
    style: "legend",
    stars: 4,
    boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
  },
  {
    id: "courtois",
    name: "Courtois",
    position: "GK",
    rating: 103,
    club: "Belgium",
    style: "highlight",
    stars: 5,
    boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
  },
  {
    id: "mbappe",
    name: "Mbappé",
    position: "CF",
    rating: 106,
    club: "Paris",
    style: "epic",
    stars: 4,
    boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
  },
  {
    id: "cruyff",
    name: "Cruyff",
    position: "SS",
    rating: 108,
    club: "Barça",
    style: "legend",
    stars: 5,
    boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
  },
  {
    id: "jesus",
    name: "G. Jesus",
    position: "CF",
    rating: 102,
    club: "Arsenal",
    style: "showtime",
    stars: 4,
    boosters: [1, 2, 3, 4, 5, 6, 7, 0, 0],
  },
];
