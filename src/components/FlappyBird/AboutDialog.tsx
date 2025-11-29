import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

export const AboutDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/50 transition-colors z-10"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
        >
          <Info className="w-5 h-5 text-white drop-shadow" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-gradient-to-b from-sky-100 to-sky-200 border-sky-300">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-sky-800">
            حول المشروع
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-sm text-sky-900 leading-relaxed" dir="rtl">
          {/* Student Info */}
          <section className="bg-white/50 rounded-lg p-3">
            <h3 className="font-bold text-sky-700 mb-2 flex items-center gap-2">
              <span>👨‍🎓</span> معلومات الطالب
            </h3>
            <p><strong>الاسم:</strong> ساكر رائد</p>
            <p><strong>المستوى:</strong> سنة ثالثة ليسانس</p>
            <p><strong>الفوج:</strong> الفوج 1</p>
          </section>

          {/* Technologies Used */}
          <section className="bg-white/50 rounded-lg p-3">
            <h3 className="font-bold text-sky-700 mb-2 flex items-center gap-2">
              <span>💻</span> التقنيات المستخدمة
            </h3>
            <ul className="list-disc list-inside space-y-1 mr-2">
              <li><strong>React:</strong> مكتبة JavaScript لبناء واجهات المستخدم</li>
              <li><strong>TypeScript:</strong> لغة برمجة مع أنواع بيانات صارمة</li>
              <li><strong>Tailwind CSS:</strong> إطار عمل CSS للتصميم</li>
              <li><strong>HTML5 Canvas:</strong> لرسم عناصر اللعبة</li>
              <li><strong>Vite:</strong> أداة بناء سريعة للمشاريع</li>
            </ul>
          </section>

          {/* Development Steps */}
          <section className="bg-white/50 rounded-lg p-3">
            <h3 className="font-bold text-sky-700 mb-2 flex items-center gap-2">
              <span>📝</span> خطوات التطوير والنشر
            </h3>
            <ol className="list-decimal list-inside space-y-1 mr-2">
              <li>إنشاء المشروع باستخدام منصة Lovable</li>
              <li>تطوير منطق اللعبة والفيزياء</li>
              <li>تصميم واجهة المستخدم والرسومات</li>
              <li>ربط المشروع بـ GitHub</li>
              <li>إعداد GitHub Actions للنشر التلقائي</li>
              <li>تفعيل GitHub Pages للاستضافة</li>
            </ol>
          </section>

          {/* Game Rules */}
          <section className="bg-white/50 rounded-lg p-3">
            <h3 className="font-bold text-sky-700 mb-2 flex items-center gap-2">
              <span>🎮</span> نظام اللعب والقوانين
            </h3>
            <ul className="list-disc list-inside space-y-1 mr-2">
              <li>اضغط أو انقر على الشاشة لجعل الطائر يقفز</li>
              <li>تجنب الاصطدام بالأنابيب العلوية والسفلية</li>
              <li>كل أنبوب تمر منه يمنحك نقطة واحدة</li>
              <li>اللعبة تنتهي عند الاصطدام بأنبوب أو السقوط</li>
              <li>يتم حفظ أفضل نتيجة لكل مستوى صعوبة</li>
            </ul>
          </section>

          {/* Difficulty Levels */}
          <section className="bg-white/50 rounded-lg p-3">
            <h3 className="font-bold text-sky-700 mb-2 flex items-center gap-2">
              <span>⚡</span> مستويات الصعوبة
            </h3>
            <div className="space-y-2">
              <p><strong className="text-green-600">🌱 سهل:</strong> جاذبية أقل، سرعة أبطأ، فجوات أوسع</p>
              <p><strong className="text-red-600">🔥 صعب:</strong> جاذبية أعلى، سرعة أسرع، فجوات أضيق</p>
            </div>
          </section>

          <p className="text-center text-xs text-sky-600 pt-2">
            تم تطوير هذا المشروع كجزء من المتطلبات الأكاديمية
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
