// EnvCredentialProvider – MVP CredentialProvider (README 1.4, ARC-08). Owner: INT.
// Adapters never read process.env: the bootstrap builds this provider from the environment once and
// hands it to IntegrationRegistry. Supports Docker secrets with the OPS convention `<NAME>_FILE`
// (file mounted 0400, FB-R1-SEC-OPS-10, same rule as services/api/src/config.ts resolveFileSecrets).
import { readFileSync } from 'node:fs';
import { IntegrationError, type CredentialProvider } from '../contracts/common.js';

/** Integration variable groups (README section 4). Core secrets (SESSION_*, DATA_KEK_*…) are out of reach. */
export const CREDENTIAL_PREFIXES = [
  'CHANNEL',
  'PAYMENT',
  'BANKFEED',
  'EINVOICE',
  'DOORLOCK',
  'EMAIL',
  'ZALO',
] as const;

const REF_RE = /^env:([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*)$/;
const FILE_SUFFIX = '_FILE';

export interface EnvCredentialProviderOptions {
  /** Reads a secret file; default fs.readFileSync(path, 'utf8'). Injected in tests. */
  readFile?: (path: string) => string;
}

/**
 * credentialsRef format: `env:<GROUP>_<PROVIDER>[_…]` where GROUP is a group from README section 4,
 * always narrowed to one provider (FB-R2-SEC-INT-04, least privilege: `env:PAYMENT` would hand the
 * VNPay adapter the MoMo key too, so a bare group is refused with CONFIG), e.g. `env:PAYMENT_VNPAY` → `{ MODE, TMN_CODE, HASH_SECRET, PAY_URL, API_URL }`
 * (variable names with the prefix and the following '_' removed).
 *
 * `<NAME>_FILE` is read (trimmed, like config.ts) when `<NAME>` is not set. If both are set they must
 * hold the same value (the api bootstrap may already have resolved the file into `<NAME>`); otherwise
 * IntegrationError('CONFIG'). Error messages name variables, never values or file contents.
 * Results are cached per ref: rotating a secret = restart (same as the rest of the config).
 */
export class EnvCredentialProvider implements CredentialProvider {
  private readonly env: Readonly<Record<string, string | undefined>>;
  private readonly readFile: (path: string) => string;
  private readonly cache = new Map<string, Readonly<Record<string, string>>>();

  constructor(
    env: Readonly<Record<string, string | undefined>>,
    opts: EnvCredentialProviderOptions = {},
  ) {
    this.env = { ...env };
    this.readFile = opts.readFile ?? ((p) => readFileSync(p, 'utf8'));
  }

  async get(credentialsRef: string): Promise<Readonly<Record<string, string>>> {
    const cached = this.cache.get(credentialsRef);
    if (cached) return cached;

    const m = REF_RE.exec(credentialsRef);
    const prefix = m?.[1];
    if (!prefix) {
      throw new IntegrationError('CONFIG', 'credentialsRef must look like env:<GROUP>_<PROVIDER>');
    }
    const group = prefix.split('_')[0] as string;
    if (!(CREDENTIAL_PREFIXES as readonly string[]).includes(group)) {
      throw new IntegrationError(
        'CONFIG',
        `credentialsRef prefix ${prefix} is not an integration group`,
      );
    }
    if (prefix === group) {
      throw new IntegrationError(
        'CONFIG',
        `credentialsRef must name a provider: env:${group}_<PROVIDER>`,
      );
    }

    const head = `${prefix}_`;
    const names = new Set<string>();
    for (const key of Object.keys(this.env)) {
      if (!key.startsWith(head)) continue;
      names.add(key.endsWith(FILE_SUFFIX) ? key.slice(0, -FILE_SUFFIX.length) : key);
    }

    const out: Record<string, string> = {};
    for (const name of names) {
      const value = this.resolve(name);
      if (value !== undefined) out[name.slice(head.length)] = value;
    }
    if (Object.keys(out).length === 0) {
      throw new IntegrationError('CONFIG', `No credentials configured for ${prefix}`);
    }
    const frozen = Object.freeze(out);
    this.cache.set(credentialsRef, frozen);
    return frozen;
  }

  private resolve(name: string): string | undefined {
    const direct = this.env[name];
    const filePath = this.env[`${name}${FILE_SUFFIX}`];
    const hasDirect = direct !== undefined && direct !== '';
    if (!filePath) return hasDirect ? direct : undefined;

    let fromFile: string;
    try {
      fromFile = this.readFile(filePath).trim();
    } catch {
      throw new IntegrationError('CONFIG', `Cannot read ${name}${FILE_SUFFIX}`);
    }
    if (hasDirect && direct !== fromFile) {
      throw new IntegrationError(
        'CONFIG',
        `${name} and ${name}${FILE_SUFFIX} are both set – use only one`,
      );
    }
    return fromFile === '' ? undefined : fromFile;
  }
}
