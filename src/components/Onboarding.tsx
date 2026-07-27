import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Page {
  title: string;
  body: string;
}

const PAGES: Page[] = [
  {
    title: '什么是凯格尔训练',
    body: '凯格尔训练通过反复收缩和放松盆底肌来增强肌肉力量。\n\n训练时请收缩盆底肌（像憋尿一样的感觉），同时保持腹部、大腿和臀部放松，避免代偿用力。\n\n本应用提供计时和节奏引导，不能判断动作是否正确。',
  },
  {
    title: '训练中的呼吸与安全',
    body: '训练时请保持自然呼吸，不要屏气。\n\n如果在训练中出现疼痛、头晕或明显不适，请立即停止，并咨询医生或物理治疗师。\n\n孕妇、产后不久或患有特定疾病者，建议在专业人士指导下进行。',
  },
  {
    title: '关于本应用',
    body: '本应用仅提供计时和节奏引导，不是医疗设备，不能诊断或治疗任何疾病。\n\n训练参数（收缩/保持/放松时间、次数）均为节奏模板，不代表个体化治疗建议。\n\n所有数据仅存储在您的设备本地，不会上传至任何服务器。',
  },
];

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [page, setPage] = useState(0);
  const isLast = page === PAGES.length - 1;

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setPage((p) => p + 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-4 pb-8 sm:pb-0"
        role="dialog"
        aria-modal="true"
        aria-label="新手引导"
      >
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm bg-slate-900 border border-white/[0.08] rounded-2xl px-6 py-6 space-y-5"
        >
          {/* Page indicator */}
          <div className="flex justify-center gap-1.5">
            {PAGES.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === page ? 'bg-indigo-400' : 'bg-white/15'
                }`}
              />
            ))}
          </div>

          <h2 className="text-lg font-semibold text-slate-100 text-center">
            {PAGES[page].title}
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line text-center">
            {PAGES[page].body}
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onComplete}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
            >
              跳过
            </button>
            <button
              type="button"
              onClick={next}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-indigo-500/30 text-indigo-200 hover:bg-indigo-500/40 transition-colors"
            >
              {isLast ? '开始训练' : '下一步'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
