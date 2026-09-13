import { Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Home, Search } from "lucide-react";

export function NotFoundComponent() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      {/* Visual Badge / Ball Graphic */}
      <div className="relative mb-6">
        <div className="size-32 sm:size-40 rounded-full bg-gradient-to-tr from-primary/20 via-primary/5 to-amber-500/10 flex items-center justify-center mx-auto border border-primary/20 shadow-xl">
          <span className="text-5xl sm:text-6xl select-none">⚽</span>
        </div>
        <span className="absolute -bottom-2 inset-x-0 mx-auto w-max rounded-full bg-warn px-4 py-1 text-xs font-black text-white shadow-md">
          تسلل! خارج الملعب 🚩
        </span>
      </div>

      <h1 className="text-5xl sm:text-7xl font-black text-fg mb-3 tracking-tight">
        404
      </h1>
      <h2 className="text-xl sm:text-2xl font-black text-fg mb-3">
        الصفحة التي تبحث عنها غير موجودة!
      </h2>
      <p className="text-xs sm:text-sm text-muted max-w-md mx-auto mb-8 leading-relaxed">
        يبدو أن الكرة خرجت عن خط التماس، أو تم نقل الصفحة إلى مسار آخر. يمكنك العودة للصفحة الرئيسية أو استكشاف خدماتنا.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="btn-primary inline-flex min-h-12 items-center gap-2 rounded-2xl px-7 text-xs font-extrabold shadow-md hover:shadow-primary/30 transition"
        >
          <Home className="size-4" />
          <span>العودة للرئيسية</span>
        </Link>
        <Link
          to="/services"
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-white px-7 text-xs font-extrabold text-fg hover:border-primary hover:text-primary transition shadow-sm"
        >
          <Search className="size-4" />
          <span>تصفح الخدمات</span>
        </Link>
      </div>
    </div>
  );
}
