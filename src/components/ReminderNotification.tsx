import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  show: boolean;
  onDismiss: () => void;
  onStartTraining: () => void;
}

export default function ReminderNotification({
  show,
  onDismiss,
  onStartTraining,
}: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-accent/20 bg-accent/10 p-4 backdrop-blur-xl"
        >
          <p className="text-sm font-medium text-accent">
            今天是训练日
          </p>
          <p className="mt-1 text-xs leading-5 text-accent/70">
            开始一组训练，保持好习惯！
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onStartTraining}
              className="rounded-lg bg-accent/30 px-4 py-2 text-xs font-medium text-warm-100 transition-colors hover:bg-accent/40"
            >
              开始训练
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg bg-warm-200/[0.06] px-4 py-2 text-xs font-medium text-warm-400 transition-colors hover:bg-warm-200/10"
            >
              稍后提醒
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
