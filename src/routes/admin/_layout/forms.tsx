import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Edit2,
  FileText,
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
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import { appAlert, appConfirm } from "@/components/ui/app-modal";
import type { FieldType, FormDoc, QuestionDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/admin/_layout/forms")({
  component: AdminFormsPage,
});

const FIELD_TYPES: { id: FieldType; label: string }[] = [
  { id: "short_text", label: "نص قصير (Short Text)" },
  { id: "long_text", label: "نص طويل (Long Text)" },
  { id: "number", label: "رقم (Number)" },
  { id: "email", label: "بريد إلكتروني (Email)" },
  { id: "telegram", label: "يوزر تليجرام (@username)" },
  { id: "phone", label: "رقم هاتف / واتساب (Phone)" },
  { id: "select", label: "قائمة منسدلة (Dropdown Select)" },
  { id: "radio", label: "اختيار من متعدد (Radio)" },
  { id: "checkbox", label: "مربعات اختيار (Checkbox)" },
  { id: "yes_no", label: "نعم / لا (Yes / No)" },
  { id: "date", label: "تاريخ (Date)" },
];

function AdminFormsPage() {
  const { session } = useAdminStore();
  const [forms, setForms] = useState<FormDoc[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionDoc[]>([]);
  const [loadingForms, setLoadingForms] = useState(true);

  // Form Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  // Question Modal
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionDoc | null>(null);
  const [qType, setQType] = useState<FieldType>("short_text");
  const [qLabel, setQLabel] = useState("");
  const [qPlaceholder, setQPlaceholder] = useState("");
  const [qRequired, setQRequired] = useState(true);
  const [qOptions, setQOptions] = useState<string>("");
  const [qSortOrder, setQSortOrder] = useState(1);

  // Subscribe to forms
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "forms"), (snap) => {
      const items = snap.docs.map((d) => d.data() as FormDoc);
      setForms(items);
      if (items.length > 0 && !selectedFormId) {
        setSelectedFormId(items[0]!.id);
      }
      setLoadingForms(false);
    });
    return () => unsub();
  }, [selectedFormId]);

  // Subscribe to questions for selected form
  useEffect(() => {
    if (!selectedFormId) {
      setQuestions([]);
      return;
    }
    const q = query(
      collection(db, "questions"),
      where("formId", "==", selectedFormId),
      orderBy("sortOrder", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setQuestions(snap.docs.map((d) => d.data() as QuestionDoc));
    });
    return () => unsub();
  }, [selectedFormId]);

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    try {
      const ref = doc(collection(db, "forms"));
      const newForm: Record<string, any> = {
        id: ref.id,
        name: formName.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (formDesc.trim()) newForm.description = formDesc.trim();
      await setDoc(ref, newForm);
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `إنشاء نموذج جديد: ${formName}`,
        entityType: "settings",
        entityId: ref.id,
      });
      setSelectedFormId(ref.id);
      setIsFormModalOpen(false);
      setFormName("");
      setFormDesc("");
    } catch (err) {
      console.error("Failed to save form:", err);
    }
  }

  function openCreateQuestion() {
    setEditingQuestion(null);
    setQType("short_text");
    setQLabel("");
    setQPlaceholder("");
    setQRequired(true);
    setQOptions("");
    setQSortOrder(questions.length + 1);
    setIsQuestionModalOpen(true);
  }

  function openEditQuestion(q: QuestionDoc) {
    setEditingQuestion(q);
    setQType(q.type);
    setQLabel(q.label);
    setQPlaceholder(q.placeholder || "");
    setQRequired(q.required);
    setQOptions(q.options ? q.options.join("\n") : "");
    setQSortOrder(q.sortOrder);
    setIsQuestionModalOpen(true);
  }

  async function handleSaveQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !selectedFormId) return;

    try {
      const qId = editingQuestion ? editingQuestion.id : doc(collection(db, "questions")).id;
      const opts = ["select", "radio", "checkbox"].includes(qType)
        ? qOptions
            .split("\n")
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;

      const qDoc: Record<string, any> = {
        id: qId,
        formId: selectedFormId,
        type: qType,
        label: qLabel.trim(),
        required: qRequired,
        options: opts,
        sortOrder: Number(qSortOrder),
        active: editingQuestion ? editingQuestion.active : true,
      };
      if (qPlaceholder.trim()) qDoc.placeholder = qPlaceholder.trim();

      await setDoc(doc(db, "questions", qId), qDoc);
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: editingQuestion ? `تعديل حقل ${qLabel}` : `إضافة حقل جديد ${qLabel}`,
        entityType: "settings",
        entityId: qId,
      });

      setIsQuestionModalOpen(false);
    } catch (err) {
      console.error("Failed to save question:", err);
    }
  }

  async function handleDeleteQuestion(qId: string) {
    if (!session) return;
    const confirmed = await appConfirm({
      title: "تأكيد حذف الحقل",
      message: "هل أنت متأكد من حذف هذا الحقل؟",
      confirmText: "نعم، حذف",
      type: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, "questions", qId));
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `حذف حقل من النموذج`,
        entityType: "settings",
        entityId: qId,
      });
      await appAlert({
        title: "تم الحذف",
        message: "تم حذف الحقل بنجاح.",
        type: "success",
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteForm(form: FormDoc) {
    if (!session) return;
    if (session.role !== "OWNER") {
      await appAlert({
        title: "صلاحية غير كافية",
        message: "حذف النماذج متاح للمالك فقط.",
        type: "warning",
      });
      return;
    }
    const confirmed = await appConfirm({
      title: "تأكيد حذف النموذج",
      message: `هل أنت متأكد من حذف النموذج "${form.name}"؟`,
      confirmText: "نعم، حذف النموذج",
      type: "danger",
    });
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "forms", form.id));
      setSelectedFormId(null);
      await logActivity({
        adminUid: session.admin.uid,
        adminName: session.admin.displayName,
        action: `حذف نموذج ${form.name}`,
        entityType: "settings",
        entityId: form.id,
      });
      await appAlert({
        title: "تم الحذف",
        message: `تم حذف نموذج "${form.name}" بنجاح.`,
        type: "success",
      });
    } catch (err) {
      console.error(err);
    }
  }

  const currentForm = forms.find((f) => f.id === selectedFormId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">منشئ النماذج والحقول (Form Builder)</h1>
          <p className="text-sm text-muted">
            تصميم حقول النماذج المخصصة لكل خدمة (مثل بيانات الديفيجن، اللاعبين، المتطلبات الخاصة)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormModalOpen(true)}
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm"
        >
          <Plus className="size-4" />
          إنشاء نموذج جديد
        </button>
      </div>

      {/* Main layout: Forms tabs & Questions editor */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Forms list */}
        <div className="space-y-2 lg:col-span-1">
          <h2 className="text-xs font-bold text-muted mb-2">النماذج المتاحة</h2>
          {loadingForms ? (
            <div className="text-xs text-muted">جاري التحميل...</div>
          ) : forms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted">
              لا توجد نماذج. اضغط على "إنشاء نموذج جديد" للبدء.
            </div>
          ) : (
            forms.map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedFormId(f.id)}
                className={`group flex items-center justify-between cursor-pointer rounded-2xl border p-3.5 text-xs transition ${
                  selectedFormId === f.id
                    ? "border-primary bg-primary/10 font-bold text-primary shadow-sm"
                    : "border-border bg-card text-fg hover:bg-surface"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 shrink-0" />
                  <span>{f.name}</span>
                </div>
                {session?.role === "OWNER" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteForm(f);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-600 transition p-1"
                    title="حذف النموذج"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Selected Form & Fields */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-3 space-y-4">
          {currentForm ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-fg">{currentForm.name}</h2>
                  {currentForm.description && (
                    <p className="text-xs text-muted">{currentForm.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={openCreateQuestion}
                  className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm"
                >
                  <Plus className="size-4" />
                  إضافة حقل للنموذج
                </button>
              </div>

              {/* Fields Table / List */}
              {questions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center text-xs text-muted">
                  هذا النموذج لا يحتوي على أي حقول بعد. اضغط على "إضافة حقل للنموذج".
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q) => {
                    const typeLabel = FIELD_TYPES.find((t) => t.id === q.type)?.label || q.type;
                    return (
                      <div
                        key={q.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                              {q.sortOrder}
                            </span>
                            <span className="font-bold text-fg text-sm">{q.label}</span>
                            {q.required && (
                              <span className="rounded bg-warn/10 px-1.5 py-0.5 text-[9px] font-bold text-warn">
                                مطلوب *
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted flex items-center gap-2">
                            <span className="font-semibold text-primary">{typeLabel}</span>
                            {q.placeholder && <span>• تلميح: "{q.placeholder}"</span>}
                            {q.options && <span>• {q.options.length} خيارات</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditQuestion(q)}
                            className="rounded-lg p-1.5 text-muted hover:bg-card hover:text-primary transition"
                            title="تعديل الحقل"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteQuestion(q.id)}
                            className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 transition"
                            title="حذف الحقل"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-xs text-muted">
              اختر نموذجاً من القائمة الجانبية أو قم بإنشاء نموذج جديد
            </div>
          )}
        </div>
      </div>

      {/* New Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-bg p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-fg">إنشاء نموذج جديد</h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-muted hover:text-fg"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-bold text-fg">اسم النموذج *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: نموذج رفع الديفيجن المتقدم"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-fg">الوصف (اختياري)</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="وصف مختصر للنموذج..."
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 font-semibold text-muted"
                >
                  إلغاء
                </button>
                <button type="submit" className="btn-primary rounded-xl px-5 py-2 font-bold">
                  إنشاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New / Edit Question Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-bg p-6 shadow-2xl my-8">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-fg">
                {editingQuestion ? "تعديل الحقل" : "إضافة حقل جديد للنموذج"}
              </h3>
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(false)}
                className="text-muted hover:text-fg"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-bold text-fg">نوع الحقل</label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value as FieldType)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-fg">عنوان / نص السؤال (Label) *</label>
                <input
                  type="text"
                  required
                  value={qLabel}
                  onChange={(e) => setQLabel(e.target.value)}
                  placeholder="مثال: النقاط الحالية في الديفيجن"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-fg">نص توضيحي / تلميح (Placeholder)</label>
                <input
                  type="text"
                  value={qPlaceholder}
                  onChange={(e) => setQPlaceholder(e.target.value)}
                  placeholder="مثال: 1680"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              {["select", "radio", "checkbox"].includes(qType) && (
                <div>
                  <label className="mb-1 block font-bold text-fg">
                    الخيارات المتاحة (اكتب كل خيار في سطر منفصل)
                  </label>
                  <textarea
                    rows={4}
                    value={qOptions}
                    onChange={(e) => setQOptions(e.target.value)}
                    placeholder={"Division 3\nDivision 2\nDivision 1"}
                    className="w-full rounded-xl border border-border bg-surface p-3 text-xs outline-none focus:border-primary"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-fg">ترتيب الظهور</label>
                  <input
                    type="number"
                    value={qSortOrder}
                    onChange={(e) => setQSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="reqCheck"
                    checked={qRequired}
                    onChange={(e) => setQRequired(e.target.checked)}
                    className="size-4 rounded text-primary"
                  />
                  <label htmlFor="reqCheck" className="font-bold text-fg cursor-pointer">
                    حقل إجباري (Required)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 font-semibold text-muted"
                >
                  إلغاء
                </button>
                <button type="submit" className="btn-primary rounded-xl px-5 py-2 font-bold">
                  حفظ الحقل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
