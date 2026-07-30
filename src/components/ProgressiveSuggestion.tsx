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
      <div className="w-full max-w-sm mx-auto rounded-xl bg-warm-500/10 border border-warm-500/20 p-4">
        <p className="text-sm text-warm-400 leading-relaxed">
          <span className="text-warm-200 font-medium">训练提示</span>
          {' '}{suggestion.reason}
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-sm mx-auto rounded-xl p-4 space-y-3 ${
      isDowngrade
        ? 'bg-amber-500/10 border border-amber-500/20'
        : 'bg-accent/10 border border-accent/20'
    }`}>
      <p className="text-sm text-warm-200 leading-relaxed">
        <span className={`font-medium ${
          isDowngrade ? 'text-amber-300' : 'text-accent'
        }`}>
          {isDowngrade ? '训练调整' : '训练建议'}
        </span>
        {' '}{suggestion.reason}
      </p>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-warm-400">
          {LABEL_MAP[suggestion.changedKey] || suggestion.changedKey}
          {': '}
          {suggestion.before[suggestion.changedKey]}
        </span>
        <span className={isDowngrade ? 'text-amber-400' : 'text-accent'}>→</span>
        <span className={`font-semibold ${
          isDowngrade ? 'text-amber-300' : 'text-accent'
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
              : 'bg-accent/20 text-accent hover:bg-accent/30'
          }`}
        >
          {isDowngrade ? '采纳调整' : '接受建议'}
        </button>
        <button
          onClick={() => onAction('ignore')}
          className="flex-1 rounded-lg bg-warm-200/5 text-warm-400 py-2 text-sm font-medium hover:bg-warm-200/10 transition-colors"
        >
          暂不考虑
        </button>
        <button
          onClick={() => onAction('dismiss')}
          className="px-3 rounded-lg bg-warm-200/5 text-warm-400 py-2 text-sm hover:bg-warm-200/10 transition-colors"
        >
          不再提示
        </button>
      </div>
    </div>
  );
}
