import { createFileRoute } from "@tanstack/react-router";
import {
  Edit2,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { uploadFileToStorage } from "@/lib/firebase-storage";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import type { PlayerDoc, PlayerStyle } from "@/lib/firebase-types";
import { UpgradeCard } from "@/components/upgrade-card";

export const Route = createFileRoute("/admin/_layout/players")({
  component: AdminPlayersPage,
});

const STYLES: { id: PlayerStyle; label: string; bg: string }[] = [
  { id: "epic", label: "Epic", bg: "card-epic" },
  { id: "showtime", label: "Show Time", bg: "card-showtime" },
  { id: "legend", label: "Legend", bg: "card-legend" },
  { id: "highlight", label: "Highlight", bg: "card-highlight" },
];

function AdminPlayersPage() {
  const { session } = useAdminStore();
  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerDoc | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [position, setPosition] = useState("CF");
  const [rating, setRating] = useState(105);
  const [club, setClub] = useState("");
  const [style, setStyle] = useState<PlayerStyle>("epic");
  const [stars, setStars] = useState(5);
  const [boosters, setBoosters] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 0, 0]);
  const [imageUrl, setImageUrl] = useState("");
  const [boosterName, setBoosterName] = useState("");
  const [boosterIconUrl, setBoosterIconUrl] = useState("");
  const [uploadingBoosterIcon, setUploadingBoosterIcon] = useState(false);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState(1);

  // Subscribe to players
  useEffect(() => {
    const q = query(collection(db, "players"), orderBy("sortOrder", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setPlayers(snap.docs.map((d) => d.data() as PlayerDoc));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  function openCreateModal() {
    setEditingPlayer(null);
    setName("");
    setPosition("CF");
    setRating(105);
    setClub("");
    setStyle("epic");
    setStars(5);
    setBoosters([1, 2, 3, 4, 5, 6, 7, 0, 0]);
    setImageUrl("");
    setBoosterName("");
    setBoosterIconUrl("");
    setPrice(undefined);
    setSortOrder(players.length + 1);
    setIsModalOpen(true);
  }

  function openEditModal(player: PlayerDoc) {
    setEditingPlayer(player);
    setName(player.name);
    setPosition(player.position);
    setRating(player.rating);
    setClub(player.club);
    setStyle(player.style);
    setStars(player.stars);
    setBoosters(player.boosters.length === 9 ? player.boosters : [1, 2, 3, 4, 5, 6, 7, 0, 0]);
    setImageUrl(player.imageUrl || "");
    setBoosterName(player.boosterName || "");
    setBoosterIconUrl(player.boosterIconUrl || "");
    setPrice(player.price);
    setSortOrder(player.sortOrder);
    setIsModalOpen(true);
  }

  async function handleSavePlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    try {
      const now = new Date().toISOString();
      const playerId = editingPlayer ? editingPlayer.id : doc(collection(db, "players")).id;

      const playerData: PlayerDoc = {
        id: playerId,
        name: name.trim(),
        position: position.trim().toUpperCase(),
        rating: Number(rating),
        club: club.trim(),
        style,
        stars: Number(stars),
        boosters,
        active: editingPlayer ? editingPlayer.active : true,
        sortOrder: Number(sortOrder),
        createdAt: editingPlayer ? editingPlayer.createdAt : now,
        updatedAt: now,
      };

      // Firestore rejects `undefined` — only add optional fields when they have a value
      if (imageUrl.trim()) playerData.imageUrl = imageUrl.trim();
      if (boosterName.trim()) playerData.boosterName = boosterName.trim();
      if (boosterIconUrl.trim()) playerData.boosterIconUrl = boosterIconUrl.trim();
      if (price) playerData.price = Number(price);

      await setDoc(doc(db, "players", playerId), playerData);

      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: editingPlayer ? `تعديل بطاقة لاعب ${name}` : `إضافة بطاقة لاعب جديدة ${name}`,
        entityType: "player",
        entityId: playerId,
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save player:", err);
    }
  }

  async function handleToggleActive(player: PlayerDoc) {
    if (!session) return;
    try {
      await updateDoc(doc(db, "players", player.id), {
        active: !player.active,
        updatedAt: new Date().toISOString(),
      });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `${player.active ? "تعطيل" : "تفعيل"} بطاقة لاعب ${player.name}`,
        entityType: "player",
        entityId: player.id,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(player: PlayerDoc) {
    if (!session) return;
    if (session.role !== "OWNER") {
      alert("حذف اللاعبين متاح للمالك (OWNER) فقط.");
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف اللاعب "${player.name}" نهائياً؟`)) return;

    try {
      await deleteDoc(doc(db, "players", player.id));
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `حذف بطاقة لاعب ${player.name}`,
        entityType: "player",
        entityId: player.id,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUploadCardImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `players/${Date.now()}.${ext}`;
      const url = await uploadFileToStorage(path, file);
      setImageUrl(url);
    } catch (err) {
      console.error("Card image upload failed:", err);
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">كتالوج اللاعبين والتطويرات</h1>
          <p className="text-sm text-muted">
            إدارة بطاقات اللاعبين المعروضة في صفحة التطويرات (/upgrades) والبوسترات
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm"
        >
          <Plus className="size-4" />
          إضافة لاعب جديد
        </button>
      </div>

      {/* Players Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      ) : players.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted">
          لا توجد بطاقات لاعبين مضافة بعد.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {players.map((player) => (
            <div
              key={player.id}
              className={`rounded-2xl border p-4 shadow-sm transition flex flex-col justify-between ${
                player.active ? "border-border bg-card" : "border-border/60 bg-surface/60 opacity-60"
              }`}
            >
              {/* Card preview */}
              <div className="flex justify-center mb-3">
                <UpgradeCard player={player} />
              </div>

              {/* Controls Footer */}
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void handleToggleActive(player)}
                    className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-fg transition"
                    title={player.active ? "تعطيل البطاقة" : "تفعيل البطاقة"}
                  >
                    {player.active ? <Eye className="size-4 text-ok" /> : <EyeOff className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(player)}
                    className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary transition"
                    title="تعديل البطاقة"
                  >
                    <Edit2 className="size-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted font-bold">#{player.sortOrder}</span>
                  {session?.role === "OWNER" && (
                    <button
                      type="button"
                      onClick={() => void handleDelete(player)}
                      className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 transition"
                      title="حذف اللاعب"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-bg p-6 shadow-2xl my-8">
            <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-fg">
                {editingPlayer ? "تعديل بطاقة اللاعب" : "إضافة بطاقة لاعب جديدة"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-surface"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-fg">اسم اللاعب *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Lionel Messi"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-fg">النادي / المنتخب *</label>
                  <input
                    type="text"
                    required
                    value={club}
                    onChange={(e) => setClub(e.target.value)}
                    placeholder="Barça"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block font-bold text-fg">المركز (Position)</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="RWF"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-mono uppercase outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-fg">التقييم (Rating)</label>
                  <input
                    type="number"
                    required
                    min={60}
                    max={120}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-fg">النجوم (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={stars}
                    onChange={(e) => setStars(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-fg">الترتيب</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-fg">نوع البطاقة (Style)</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as PlayerStyle)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                  >
                    {STYLES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-fg">سعر التطوير (اختياري)</label>
                  <input
                    type="number"
                    min={0}
                    value={price || ""}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="مثال: 150"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Booster row (9 numbers) */}
              <div>
                <label className="mb-1 block font-bold text-fg">
                  أرقام صف البوسترات (9 خانات للبوسترات 1-7 و 0 0)
                </label>
                <div className="grid grid-cols-9 gap-1" dir="ltr">
                  {boosters.map((val, idx) => (
                    <input
                      key={idx}
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const next = [...boosters];
                        next[idx] = Number(e.target.value);
                        setBoosters(next);
                      }}
                      className="rounded-lg border border-border bg-surface py-1 text-center font-mono text-xs outline-none focus:border-primary"
                    />
                  ))}
                </div>
              </div>

              {/* Card Image upload */}
              <div>
                <label className="mb-1 block font-bold text-fg">
                  صورة اللاعب (ستملأ الكارت بالكامل)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="رابط الصورة أو ارفع صورة جديدة"
                    className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                    dir="ltr"
                  />
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 font-bold text-fg hover:bg-surface/80">
                    <Upload className="size-4" />
                    {uploadingImage ? "جاري الرفع..." : "رفع صورة"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={(e) => void handleUploadCardImage(e)}
                      className="hidden"
                    />
                  </label>
                </div>
                {imageUrl && (
                  <div className="mt-2 flex justify-center">
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="h-24 rounded-lg object-cover border border-border shadow"
                    />
                  </div>
                )}
              </div>

              {/* Per-player Booster Badge */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-3">
                <label className="block font-bold text-fg flex items-center gap-1.5">
                  <Zap className="size-3.5 text-primary" />
                  بادج البوستر المخصص للاعب (اختياري)
                </label>
                <p className="text-muted text-[10px]">يظهر أسفل أيقونات المهارات كبادج بلون البراند مع اسم وأيقونة.</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-fg">اسم البوستر</label>
                    <input
                      type="text"
                      value={boosterName}
                      onChange={(e) => setBoosterName(e.target.value)}
                      placeholder="مثال: Big Time Booster"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-fg">أيقونة البوستر (رابط أو ارفع)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={boosterIconUrl}
                        onChange={(e) => setBoosterIconUrl(e.target.value)}
                        placeholder="رابط صورة الأيقونة"
                        className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                        dir="ltr"
                      />
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-2 font-bold text-fg hover:bg-surface/80">
                        <Upload className="size-3.5" />
                        {uploadingBoosterIcon ? "..." : "رفع"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingBoosterIcon}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingBoosterIcon(true);
                            try {
                              const { uploadFileToStorage } = await import("@/lib/firebase-storage");
                              const ext = file.name.split(".").pop() || "png";
                              const url = await uploadFileToStorage(`booster-badges/${Date.now()}.${ext}`, file);
                              setBoosterIconUrl(url);
                            } catch { /* ignore */ }
                            finally { setUploadingBoosterIcon(false); e.target.value = ""; }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                {boosterIconUrl && (
                  <div className="flex items-center gap-2">
                    <img src={boosterIconUrl} alt="booster icon preview" className="size-8 rounded-lg object-contain border border-border" />
                    <span className="text-[10px] text-muted">معاينة الأيقونة</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 font-semibold text-muted hover:bg-surface"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-primary rounded-xl px-6 py-2 font-bold shadow-sm"
                >
                  حفظ اللاعب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
