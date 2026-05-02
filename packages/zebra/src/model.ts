import { signal, isSignal } from 'alien-signals';

export class Model {
  loading = signal(false);
  error = signal<string | null>(null);

  protected async run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    this.loading(true);
    this.error(null);
    try {
      return await fn();
    } catch (e) {
      this.error(e instanceof Error ? e.message : String(e));
      return undefined;
    } finally {
      this.loading(false);
    }
  }

  toJSON(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(this)) {
      if (key === 'loading' || key === 'error') continue;
      const val = (this as Record<string, unknown>)[key];
      if (isSignal(val as never)) {
        out[key] = (val as () => unknown)();
      }
    }
    return out;
  }

  fromJSON(json: Record<string, unknown>): this {
    for (const [key, val] of Object.entries(json)) {
      const sig = (this as Record<string, unknown>)[key];
      if (isSignal(sig as never)) {
        (sig as (v: unknown) => void)(val);
      }
    }
    return this;
  }
}
