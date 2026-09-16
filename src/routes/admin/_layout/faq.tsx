import { createFileRoute } from "@tanstack/react-router";
import {
  Edit2,
  Eye,
  EyeOff,
  HelpCircle,
  Plus,
  Trash2,
  X,
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
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import { appAlert, appConfirm } from "@/components/ui/app-modal";
import type { FaqDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/admin/_layout/faq")({
  component: AdminFaqPage,
});

function AdminFaqPage() {
  const { session } = useAdminStore();
  const [faqs, setFaqs] = useState<FaqDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqDoc | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState(1);

  // Subscribe to FAQ
  useEffect(() => {
    const q = query(collection(db, "faq"), orderBy("sortOrder", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setFaqs(snap.docs.map((d) => d.data() as FaqDoc));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  function openCreateModal() {
    setEditingFaq(null);
    setQuestion("");
    setAnswer("");
    setSortOrder(faqs.length + 1);
    setIsModalOpen(true);
  }

  function openEditModal(f: FaqDoc) {
    setEditingFaq(f);
    setQuestion(f.question);
    setAnswer(f.answer);
    setSortOrder(f.sortOrder);
    setIsModalOpen(true);
  }

  async function handleSaveFaq(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    try {
      const faqId = editingFaq ? editingFaq.id : doc(collection(db, "faq")).id;
      const data: FaqDoc = {
        id: faqId,
        question: question.trim(),
        answer: answer.trim(),
        sortOrder: Number(sortOrder),
        active: editingFaq ? editingFaq.active : true,
      };

      await setDoc(doc(db, "faq", faqId), data);
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: editingFaq ? `تعديل سؤال شائع: ${question}` : `إضافة سؤال شائع جديد: ${question}`,
        entityType: "faq",
        entityId: faqId,
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggleActive(f: FaqDoc) {
    if (!session) return;
    try {
      await updateDoc(doc(db, "faq", f.id), { active: !f.active });
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `${f.active ? "تعطيل" : "تفعيل"} سؤال شائع: ${f.question}`,
        entityType: "faq",
        entityId: f.id,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(f: FaqDoc) {
    if (!session) return;
    const confirmed = await appConfirm({
      title: "تأكيد حذف السؤال",
      message: `هل أنت متأكد من حذف السؤال "${f.question}"؟`,
      confirmText: "نعم، حذف",
      type: "danger",
    });
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "faq", f.id));
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `حذف سؤال شائع: ${f.question}`,
        entityType: "faq",
        entityId: f.id,
      });
      await appAlert({
        title: "تم الحذف",
        message: "تم حذف السؤال بنجاح.",
        type: "success",
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">الأسئلة الشائعة (FAQ)</h1>
          <p className="text-sm text-muted">
            إدارة الأسئلة والإجابات المعروضة على الصفحة الرئيسية
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm"
        >
          <Plus className="size-4" />
          إضافة سؤال جديد
        </button>
      </div>

      {/* Faqs List */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden p-4 space-y-3">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">لا توجد أسئلة مضافة بعد.</div>
        ) : (
          faqs.map((f) => (
            <div
              key={f.id}
              className={`flex items-start justify-between gap-4 rounded-xl border p-4 text-xs transition ${
                f.active ? "border-border bg-surface/50" : "border-border/60 bg-surface/20 opacity-60"
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {f.sortOrder}
                  </span>
                  <h3 className="font-bold text-fg text-sm">{f.question}</h3>
                </div>
                <p className="text-muted leading-relaxed pr-7">{f.answer}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleToggleActive(f)}
                  className="rounded-lg p-1.5 text-muted hover:bg-card hover:text-fg transition"
                  title={f.active ? "تعطيل" : "تفعيل"}
                >
                  {f.active ? <Eye className="size-4 text-ok" /> : <EyeOff className="size-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(f)}
                  className="rounded-lg p-1.5 text-muted hover:bg-card hover:text-primary transition"
                  title="تعديل"
                >
                  <Edit2 className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(f)}
                  className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 transition"
                  title="حذف"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-bg p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-fg">
                {editingFaq ? "تعديل السؤال" : "إضافة سؤال شائع جديد"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-fg"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSaveFaq} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-bold text-fg">السؤال *</label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="مثال: كيف أدفع مقابل الخدمة؟"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-fg">الإجابة *</label>
                <textarea
                  rows={4}
                  required
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="اكتب الإجابة بالتفصيل..."
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-fg">ترتيب الظهور</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 font-semibold text-muted"
                >
                  إلغاء
                </button>
                <button type="submit" className="btn-primary rounded-xl px-5 py-2 font-bold">
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
