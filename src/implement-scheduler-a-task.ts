// bloom-deps:

import { randomUUID } from 'crypto';

type TaskId = string;

interface SchedulerOptions {
  maxConcurrent?: number;
  clock?: () => number;
}

interface Task {
  id: TaskId;
  fn: () => Promise<void> | void;
  delayMs: number;
  priority: number;
  scheduledAt: number;
}

export class Scheduler {
  private readonly maxConcurrent: number;
  private readonly clock: () => number;
  private pending: Map<TaskId, Task> = new Map();
  private runningIds: Set<TaskId> = new Set();

  constructor(options: SchedulerOptions = {}) {
    this.maxConcurrent = options.maxConcurrent ?? 1;
    this.clock = options.clock ?? Date.now;
  }

  schedule(
    fn: () => Promise<void> | void,
    opts: { delayMs?: number; priority?: number; id?: string } = {}
  ): TaskId {
    if (typeof fn !== 'function') {
      throw new TypeError('fn must be a function');
    }

    const delayMs = opts.delayMs ?? 0;

    if (delayMs < 0) {
      throw new RangeError('delayMs must be >= 0');
    }

    const id: TaskId = opts.id ?? `${randomUUID()}-${Math.random().toString(36).slice(2)}`;

    if (this.pending.has(id) || this.runningIds.has(id)) {
      throw new RangeError(`Task with id "${id}" already exists`);
    }

    const task: Task = {
      id,
      fn,
      delayMs,
      priority: opts.priority ?? 0,
      scheduledAt: this.clock(),
    };

    this.pending.set(id, task);
    return id;
  }

  cancel(id: TaskId): boolean {
    if (this.runningIds.has(id)) {
      return false;
    }
    if (this.pending.has(id)) {
      this.pending.delete(id);
      return true;
    }
    return false;
  }

  get pendingCount(): number {
    return this.pending.size;
  }

  run(): Promise<void> {
    return this._run();
  }

  drain(): Promise<void> {
    return this._run();
  }

  private async _run(): Promise<void> {
    while (true) {
      const now = this.clock();

      const ready = [...this.pending.values()].filter(
        (task) => task.scheduledAt + task.delayMs <= now
      );

      if (ready.length === 0 && this.pending.size === 0) {
        break;
      }

      if (ready.length === 0) {
        // There are pending tasks but none are ready yet.
        // Find the minimum wait time and yield.
        const minWait = Math.min(
          ...[...this.pending.values()].map(
            (task) => task.scheduledAt + task.delayMs - this.clock()
          )
        );
        await new Promise<void>((resolve) =>
          setTimeout(resolve, Math.max(0, minWait))
        );
        continue;
      }

      ready.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.scheduledAt - b.scheduledAt;
      });

      const batch = ready.slice(0, this.maxConcurrent);

      for (const task of batch) {
        this.pending.delete(task.id);
        this.runningIds.add(task.id);
      }

      await Promise.all(
        batch.map(async (task) => {
          try {
            await task.fn();
          } finally {
            this.runningIds.delete(task.id);
          }
        })
      );
    }
  }
}