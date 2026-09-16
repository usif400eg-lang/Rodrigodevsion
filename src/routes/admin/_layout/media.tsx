import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { deleteFileFromStorage, uploadFileToStorage } from "@/lib/firebase-storage";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import { appAlert, appConfirm } from "@/components/ui/app-modal";

export const Route = createFileRoute("/admin/_layout/media")({
  component: AdminMediaPage,
});

interface MediaItem {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  sizeBytes?: number;
  uploadedBy: string;
  createdAt: string;
}

function AdminMediaPage() {
  const { session } = useAdminStore();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Subscribe to media collection
  useEffect(() => {
    const q = query(collection(db, "media"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => d.data() as MediaItem));
        setLoading(false);
      },
      (err) => {
        console.warn(err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  async function handleUploadFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !session) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const ext = file.name.split(".").pop() || "png";
        const storagePath = `media/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const url = await uploadFileToStorage(storagePath, file, (p) => setUploadProgress(p));

        const ref = doc(collection(db, "media"));
        const mediaDoc: MediaItem = {
          id: ref.id,
          name: file.name,
          url,
          storagePath,
          sizeBytes: file.size,
          uploadedBy: session.admin.displayName,
          createdAt: new Date().toISOString(),
        };

        await setDoc(ref, mediaDoc);
      }

      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `رفع ${files.length} ملفات وسائط جديدة إلى التخزين`,
        entityType: "settings",
        entityId: "media",
      });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(item: MediaItem) {
    if (!session) return;
    const confirmed = await appConfirm({
      title: "تأكيد حذف الملف",
      message: `هل أنت متأكد من حذف الملف "${item.name}"؟`,
      confirmText: "نعم، حذف",
      type: "danger",
    });
    if (!confirmed) return;

    try {
      await deleteFileFromStorage(item.storagePath);
      await deleteDoc(doc(db, "media", item.id));
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `حذف ملف وسائط ${item.name}`,
        entityType: "settings",
        entityId: item.id,
      });
      await appAlert({
        title: "تم الحذف",
        message: "تم حذف الملف بنجاح.",
        type: "success",
      });
    } catch (err) {
      console.error(err);
    }
  }

  function handleCopy(url: string, id: string) {
    void navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">مكتبة الوسائط والتخزين</h1>
          <p className="text-sm text-muted">
            رفع وإدارة الصور والشعارات في Firebase Storage واستخدام روابطها في المنصة
          </p>
        </div>
        <label className="btn-primary inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm">
          <Upload className="size-4" />
          {uploading ? `جاري الرفع ${uploadProgress}%...` : "رفع صور جديدة"}
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={uploading}
            onChange={(e) => void handleUploadFiles(e)}
            className="hidden"
          />
        </label>
      </div>

      {/* Grid of media */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-xs text-muted">
          لا توجد وسائط مضافة بعد. اضغط على "رفع صور جديدة" للبدء.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl border border-border bg-card p-2 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div className="aspect-square w-full rounded-xl bg-surface overflow-hidden flex items-center justify-center relative">
                <img
                  src={item.url}
                  alt={item.name}
                  className="size-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-fg/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-bg/90 p-1.5 text-fg hover:text-primary transition"
                    title="معاينة بالحجم الكامل"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.url, item.id)}
                    className="rounded-lg bg-bg/90 p-1.5 text-fg hover:text-primary transition"
                    title="نسخ الرابط"
                  >
                    {copiedId === item.id ? <Check className="size-4 text-ok" /> : <Copy className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item)}
                    className="rounded-lg bg-red-600/90 p-1.5 text-white hover:bg-red-700 transition"
                    title="حذف"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="mt-2 px-1 text-xs">
                <p className="font-bold text-fg truncate text-[11px]" title={item.name}>
                  {item.name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted mt-0.5">
                  <span>{item.sizeBytes ? `${Math.round(item.sizeBytes / 1024)} KB` : ""}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString("ar-EG")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
