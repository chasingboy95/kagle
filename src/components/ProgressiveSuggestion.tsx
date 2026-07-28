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
  const isDowngrade = suggestion.type === 'downgrade';
  const isSame = suggestion.before[suggestion.changedKey] === suggestion.after[suggestion.changedKey];

  if (isSame) {
    return (
      <div className="w-full max-w-sm mx-auto rounded-xl bg-slate-500/10 border border-slate-500/20 p-4">
        <p className="text-sm text-slate-400 leading-relaxed">
          <span className="text-slate-300 font-medium">训练提示</span>
          {' '}{suggestion.reason}
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-sm mx-auto rounded-xl p-4 space-y-3 ${
      isDowngrade
        ? 'bg-amber-500/10 border border-amber-500/20'
        : 'bg-indigo-500/10 border border-indigo-500/20'
    }`}>
      <p className="text-sm text-slate-300 leading-relaxed">
        <span className={`font-medium ${
          isDowngrade ? 'text-amber-300' : 'text-indigo-300'
        }`}>
          {isDowngrade ? '训练调整' : '训练建议'}
        </span>
        {' '}{suggestion.reason}
      </p>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500">
          {LABEL_MAP[suggestion.changedKey] || suggestion.changedKey}
          {': '}
          {suggestion.before[suggestion.changedKey]}
        </span>
        <span className={isDowngrade ? 'text-amber-400' : 'text-indigo-400'}>→</span>
        <span className={`font-semibold ${
          isDowngrade ? 'text-amber-300' : 'text-indigo-300'
        }`}>
          {suggestion.after[suggestion.changedKey]}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAction('accept')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            isDowngrade
              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
          }`}
        >
          {isDowngrade ? '采纳调整' : '接受建议'}
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
