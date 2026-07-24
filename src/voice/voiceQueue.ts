export type VoicePriority = 'critical' | 'important' | 'normal' | 'ambient';

export interface VoiceQueueItem<TEvent = unknown> {
  id: string;
  event: TEvent;
  priority: VoicePriority;
  interrupt: boolean;
  createdAt: number;
  expiresAt?: number;
}

const PRIORITY_SCORE: Record<VoicePriority, number> = {
  critical: 4,
  important: 3,
  normal: 2,
  ambient: 1,
};

export class VoiceQueue<TEvent = unknown> {
  private items: VoiceQueueItem<TEvent>[] = [];

  enqueue(item: VoiceQueueItem<TEvent>) {
    this.removeExpired();
    this.items.push(item);
    this.items.sort(
      (a, b) => PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority] || a.createdAt - b.createdAt,
    );
  }

  dequeue(): VoiceQueueItem<TEvent> | undefined {
    this.removeExpired();
    return this.items.shift();
  }

  clear() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  private removeExpired() {
    const now = Date.now();
    this.items = this.items.filter((item) => !item.expiresAt || item.expiresAt > now);
  }
}
