import type { ProgressiveSuggestion as SuggestionType, SuggestionAction } from '../utils/progressiveTraining';

interface ProgressiveSuggestionProps {
  suggestion: SuggestionType;
  onAction: (action: SuggestionAction) => void;
}

const LABEL_MAP: Record<string, string> = {
  holdTime: '保持时间',
  rounds: '次数',
  contractTime: '收缩时间',
  relaxTime: '放松时间',
};

export default function ProgressiveSuggestion({
  suggestion,
  onAction,
}: ProgressiveSuggestionProps) {
  return (
    <div className="w-full max-w-sm mx-auto rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4 space-y-3">
      <p className="text-sm text-slate-300 leading-relaxed">
        <span className="text-indigo-300 font-medium">训练建议</span>
        {' '}{suggestion.reason}
      </p>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500">
          {LABEL_MAP[suggestion.changedKey] || suggestion.changedKey}
          {': '}
          {suggestion.before[suggestion.changedKey]}
        </span>
        <span className="text-indigo-400">→</span>
        <span className="text-indigo-300 font-semibold">
          {suggestion.after[suggestion.changedKey]}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAction('accept')}
          className="flex-1 rounded-lg bg-indigo-500/20 text-indigo-300 py-2 text-sm font-medium hover:bg-indigo-500/30 transition-colors"
        >
          接受建议
        </button>
        <button
          onClick={() => onAction('ignore')}
          className="flex-1 rounded-lg bg-white/5 text-slate-400 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          暂不考虑
        </button>
        <button
          onClick={() => onAction('dismiss')}
          className="px-3 rounded-lg bg-white/5 text-slate-500 py-2 text-sm hover:bg-white/10 transition-colors"
        >
          不再提示
        </button>
      </div>
    </div>
  );
}
