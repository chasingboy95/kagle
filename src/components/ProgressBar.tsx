import { motion } from 'framer-motion';

interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="tracking-widest text-warm-500 font-medium">PROGRESS</span>
        <span className="tabular-nums text-warm-400 font-medium">{Math.round(pct)}%</span>
      </div>
      <div className="relative h-[3px] w-full rounded-full bg-warm-200/[0.06] overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #e8944a, #d4726a)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', damping: 25, stiffness: 120, mass: 0.5 }}
        />
      </div>
    </div>
  );
}
