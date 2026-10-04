export class TtlCache<V> {
  private readonly values = new Map<string, { value: V; expiresAt: number }>();
  constructor(private readonly ttlMs: number, private readonly maxEntries = 100) {}
  get(key: string): V | undefined {
    const hit = this.values.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) { this.values.delete(key); return undefined; }
    return hit.value;
  }
  set(key: string, value: V): void {
    if (this.values.size >= this.maxEntries && !this.values.has(key)) this.values.delete(this.values.keys().next().value as string);
    this.values.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
