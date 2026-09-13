import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Mail, MessageCircle, Phone, Send, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/lib/firebase";
import type { ContactSettingsDoc } from "@/lib/firebase-types";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const [contact, setContact] = useState<ContactSettingsDoc | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("استفسار عن خدمة");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDoc(doc(db, "settings", "contact"))
      .then((snap) => {
        if (snap.exists()) setContact(snap.data() as ContactSettingsDoc);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await addDoc(collection(db, "inquiries"), {
        name: name.trim(),
        phone: phone.trim(),
        subject,
        message: message.trim(),
        status: "unread",
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setName("");
      setPhone("");
      setMessage("");
    } catch (err) {
      console.warn("Error sending inquiry:", err);
      setError("حدث خطأ أثناء الإرسال. يمكنك مراسلتنا عبر الواتساب مباشرة.");
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappNumber = contact?.whatsappNumber || "201018593455";
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`;
  const telegramUrl = contact?.telegramUsername ? `https://t.me/${contact.telegramUsername.replace("@", "")}` : "https://t.me/rodrigo_division";

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1">
        {/* ── Page Header ── */}
        <section className="py-14 sm:py-20 bg-gradient-to-b from-surface via-bg to-bg border-b border-border/80">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-extrabold text-primary mb-4">
              <MessageCircle className="size-3.5" />
              <span>خدمة العملاء والدعم الفني</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              تواصل مع فريق <span className="text-primary">Rodrigo Divsion</span>
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-lg mx-auto leading-relaxed">
              فريق الدعم الفني متواجد لمساعدتك والإجابة على كافة استفساراتك حول رفع الحسابات والطلبات على مدار الساعة.
            </p>
          </div>
        </section>

        {/* ── Main Content Grid ── */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid gap-8 lg:grid-cols-12 items-start">
              
              {/* ── Quick Channels & Info (5 cols) ── */}
              <div className="lg:col-span-5 space-y-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 rounded-3xl border border-emerald-500/30 bg-emerald-50/50 p-5 shadow-sm hover:shadow-md hover:border-emerald-500 transition group"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                    <Phone className="size-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-emerald-950">واتساب المباشر</h3>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">
                        أسرع رد
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800/80 mt-1 font-medium" dir="ltr">
                      +{whatsappNumber}
                    </p>
                  </div>
                </a>

                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 rounded-3xl border border-sky-500/30 bg-sky-50/50 p-5 shadow-sm hover:shadow-md hover:border-sky-500 transition group"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/20">
                    <Send className="size-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-sky-950">قناة تيليجرام</h3>
                      <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-black text-sky-700">
                        تحديثات وتخفيضات
                      </span>
                    </div>
                    <p className="text-xs text-sky-800/80 mt-1 font-medium" dir="ltr">
                      @rodrigo_division
                    </p>
                  </div>
                </a>

                <div className="rounded-3xl border border-border bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-sm font-extrabold text-fg">
                    <Clock className="size-4 text-primary" />
                    <span>ساعات العمل والدعم</span>
                  </div>
                  <div className="space-y-2 text-xs text-muted font-medium">
                    <div className="flex items-center justify-between py-1 border-b border-border/50">
                      <span>السبت - الخميس:</span>
                      <span className="font-bold text-fg">10:00 ص - 02:00 ص</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-border/50">
                      <span>الجمعة:</span>
                      <span className="font-bold text-fg">01:00 م - 02:00 ص</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span>حالات الطوارئ:</span>
                      <span className="font-bold text-ok">متاح 24/7 عبر الواتساب</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-3">
                  <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted leading-relaxed font-medium">
                    جميع بيانات التواصل مشفرة ومحمية، ولا يتم مشاركة أي معلومات مع أي أطراف خارجية مطلقاً.
                  </p>
                </div>
              </div>

              {/* ── Direct Message Form (7 cols) ── */}
              <div className="lg:col-span-7">
                <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm">
                  <h2 className="text-xl font-black mb-2">أرسل لنا استفساراً</h2>
                  <p className="text-xs text-muted mb-6">
                    املأ النموذج التالي وسيقوم فريق الدعم بالرد عليك خلال أقل من 15 دقيقة.
                  </p>

                  {submitted ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                      <CheckCircle2 className="size-12 text-emerald-600 mx-auto mb-3" />
                      <h3 className="text-base font-extrabold text-emerald-900 mb-1">
                        تم استلام رسالتك بنجاح!
                      </h3>
                      <p className="text-xs text-emerald-700 leading-relaxed mb-4">
                        شكراً لتواصلك معنا، سيقوم فريق الدعم بمراجعة طلبك والتواصل معك قريباً.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubmitted(false)}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                      >
                        إرسال استفسار آخر
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <div className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs font-bold text-warn">
                          {error}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-fg mb-1.5">
                          الاسم الكريم <span className="text-warn">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="مثال: أحمد محمد"
                          className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-fg mb-1.5">
                          رقم الواتساب أو البريد الإلكتروني <span className="text-warn">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="010XXXXXXXX أو your@email.com"
                          className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-fg mb-1.5">
                          نوع الاستفسار
                        </label>
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary transition font-medium"
                        >
                          <option value="استفسار عن خدمة">استفسار عن خدمة رفع ديفيجن</option>
                          <option value="ضمان لاعبين">استفسار عن باقات ضمان اللاعبين</option>
                          <option value="تطوير طاقات">استفسار عن تطوير طاقات لاعب</option>
                          <option value="مشكلة في طلب">متابعة أو مشكلة في طلب سابق</option>
                          <option value="أخرى">استفسار عام آخر</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-fg mb-1.5">
                          تفاصيل الرسالة <span className="text-warn">*</span>
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="اكتب استفسارك بالتفصيل وسنوافيك بكافة الإجابات..."
                          className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary transition resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full min-h-12 items-center justify-center rounded-2xl text-sm font-extrabold shadow-md hover:shadow-primary/30 transition flex gap-2"
                      >
                        <Send className="size-4" />
                        <span>{submitting ? "جاري الإرسال..." : "إرسال الرسالة"}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
