/**
 * BlobStore (ADR-013 point 1): opaque storage of ENCRYPTED blobs. Names are random (32 hex), never derived
 * from a guest, a document or the original file name; the volume is outside Caddy's web root (SEC C2 –
 * OPS keeps it unserved) – files are only read back through the api with the DEK.
 *
 * - LocalBlobStore: directory 0700, files 0600, written via a temp name + rename (no half-written blob).
 *   Only ciphertext ever touches the disk (no clear temp file – SR-FILE-04).
 * - MemoryBlobStore: tests.
 * An S3-compatible store in VN (ESC-002 A) can implement the same interface later.
 */
import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { chmod, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const BLOB_STORE = Symbol('BLOB_STORE');

export interface BlobStore {
  put(data: Buffer): Promise<string>;
  /** null when the blob does not exist (deleted, never written). */
  get(key: string): Promise<Buffer | null>;
  /** Idempotent. */
  delete(key: string): Promise<void>;
}

const KEY = /^[0-9a-f]{32}$/;

function newKey(): string {
  return randomBytes(16).toString('hex');
}

export class LocalBlobStore implements BlobStore {
  readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
    mkdirSync(this.root, { recursive: true, mode: 0o700 });
  }

  private path(key: string): string {
    if (!KEY.test(key)) throw new Error('invalid blob key');
    // Two-level fan-out keeps directories small.
    return join(this.root, key.slice(0, 2), key);
  }

  async put(data: Buffer): Promise<string> {
    const key = newKey();
    const file = this.path(key);
    const dir = join(this.root, key.slice(0, 2));
    await mkdir(dir, { recursive: true, mode: 0o700 });
    await chmod(dir, 0o700);
    const tmp = `${file}.${randomBytes(4).toString('hex')}.part`;
    await writeFile(tmp, data, { mode: 0o600, flag: 'wx' });
    await rename(tmp, file);
    return key;
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.path(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.path(key), { force: true });
  }
}

export class MemoryBlobStore implements BlobStore {
  readonly blobs = new Map<string, Buffer>();

  async put(data: Buffer): Promise<string> {
    const key = newKey();
    this.blobs.set(key, Buffer.from(data));
    return key;
  }

  async get(key: string): Promise<Buffer | null> {
    return this.blobs.get(key) ?? null;
  }

  async delete(key: string): Promise<void> {
    this.blobs.delete(key);
  }
}

/**
 * From the environment: BLOBSTORE_PROVIDER = local (default) | memory (tests only);
 * BLOBSTORE_LOCAL_PATH (default ./.data/blobs, gitignored; test runs without a path → a temp directory).
 */
export function blobStoreFromEnv(env: NodeJS.ProcessEnv): BlobStore {
  const provider = env.BLOBSTORE_PROVIDER || 'local';
  const appEnv = env.APP_ENV ?? 'dev';
  if (provider === 'memory') {
    if (appEnv === 'staging' || appEnv === 'production') {
      throw new Error('BLOBSTORE_PROVIDER=memory is only allowed in dev/test');
    }
    return new MemoryBlobStore();
  }
  if (provider !== 'local') throw new Error('BLOBSTORE_PROVIDER must be local or memory');
  if (
    (appEnv === 'staging' || appEnv === 'production') &&
    !env.BLOBSTORE_LOCAL_PATH?.startsWith('/')
  ) {
    // The encrypted blobs must live on the mounted volume (OPS), never inside the container image.
    throw new Error(
      `BLOBSTORE_LOCAL_PATH (absolute path of the volume) is required when APP_ENV=${appEnv}`,
    );
  }
  // Test runs (APP_ENV=test or under Vitest) never write into the working tree.
  const testRun = appEnv === 'test' || !!env.VITEST;
  const path =
    env.BLOBSTORE_LOCAL_PATH ||
    (testRun ? join(tmpdir(), `ottimo-blobs-${process.pid}`) : './.data/blobs');
  return new LocalBlobStore(path);
}
