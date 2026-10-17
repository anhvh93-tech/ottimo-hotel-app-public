// Device storage of the staff PWA – IndexedDB only (SR-PWA-01, SR-PWA-07: no localStorage for data).
// Three stores, nothing else:
//   snapshot – last copy of today's tasks, the 10 rooms and checklists (allow-listed fields, src/data/cache.ts)
//   queue    – actions waiting to be sent (ADR-005 mục 3)
//   blobs    – incident / inspection photos waiting to be sent (compressed ≤ 300 KB), deleted once sent
// Logout / another user → `clear()` wipes all of it (SR-PWA-04).

export type StoreName = 'snapshot' | 'queue' | 'blobs';
const STORES: readonly StoreName[] = ['snapshot', 'queue', 'blobs'];

export interface KvStore {
  get<T>(store: StoreName, key: string): Promise<T | undefined>;
  put<T>(store: StoreName, key: string, value: T): Promise<void>;
  delete(store: StoreName, key: string): Promise<void>;
  all<T>(store: StoreName): Promise<T[]>;
  keys(store: StoreName): Promise<string[]>;
  clear(): Promise<void>;
}

/** Fallback when IndexedDB is unavailable (private mode, tests): same API, lost on reload. */
export class MemoryStore implements KvStore {
  private data = new Map<StoreName, Map<string, unknown>>(STORES.map((s) => [s, new Map()]));

  private s(store: StoreName) {
    return this.data.get(store)!;
  }
  async get<T>(store: StoreName, key: string) {
    return this.s(store).get(key) as T | undefined;
  }
  async put<T>(store: StoreName, key: string, value: T) {
    this.s(store).set(key, structuredClone(value));
  }
  async delete(store: StoreName, key: string) {
    this.s(store).delete(key);
  }
  async all<T>(store: StoreName) {
    return [...this.s(store).values()] as T[];
  }
  async keys(store: StoreName) {
    return [...this.s(store).keys()];
  }
  async clear() {
    for (const s of STORES) this.s(s).clear();
  }
}

export const DB_NAME = 'ottimo-staff';
const DB_VERSION = 1;

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export class IdbStore implements KvStore {
  private db: Promise<IDBDatabase>;

  constructor(private readonly factory: IDBFactory = indexedDB) {
    this.db = new Promise((resolve, reject) => {
      const open = this.factory.open(DB_NAME, DB_VERSION);
      open.onupgradeneeded = () => {
        for (const s of STORES) {
          if (!open.result.objectStoreNames.contains(s)) open.result.createObjectStore(s);
        }
      };
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
      open.onblocked = () => reject(new Error('indexeddb blocked'));
    });
  }

  private async tx(store: StoreName, mode: IDBTransactionMode) {
    return (await this.db).transaction(store, mode).objectStore(store);
  }
  async get<T>(store: StoreName, key: string) {
    return (await req((await this.tx(store, 'readonly')).get(key))) as T | undefined;
  }
  async put<T>(store: StoreName, key: string, value: T) {
    await req((await this.tx(store, 'readwrite')).put(value, key));
  }
  async delete(store: StoreName, key: string) {
    await req((await this.tx(store, 'readwrite')).delete(key));
  }
  async all<T>(store: StoreName) {
    return (await req((await this.tx(store, 'readonly')).getAll())) as T[];
  }
  async keys(store: StoreName) {
    return (await req((await this.tx(store, 'readonly')).getAllKeys())).map(String);
  }
  async clear() {
    const db = await this.db;
    const t = db.transaction([...STORES], 'readwrite');
    await Promise.all(STORES.map((s) => req(t.objectStore(s).clear())));
  }
}

/** IndexedDB when the browser has it, memory otherwise (the app still works, offline copy is lost). */
export function openStore(): KvStore {
  try {
    if (typeof indexedDB !== 'undefined' && indexedDB) return new IdbStore(indexedDB);
  } catch {
    /* blocked by the browser */
  }
  return new MemoryStore();
}
