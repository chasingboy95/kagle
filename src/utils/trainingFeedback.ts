export function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function completionSummary(completedRepetitions: number, totalRepetitions: number) {
  return `本次完成 1 组（${completedRepetitions}/${totalRepetitions} 次）`;
}
