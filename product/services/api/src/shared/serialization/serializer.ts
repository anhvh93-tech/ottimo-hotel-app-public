/**
 * Role serializer – "mặc định từ chối trường" (SR-AZ-04, rbac 8.1, coding-standards 1.5 / 7.7).
 *
 * The JSON sent to a caller is rebuilt from the OpenAPI response schema of the operation:
 * - only properties DECLARED in the schema are copied (undeclared keys are dropped unless the schema is
 *   open: `additionalProperties: true` or a free object);
 * - a property with `x-visible-to` is copied only when the caller has one of those roles;
 * - a property with `x-rbac-field` is copied only when rbac-matrix 6 does not say K for all caller roles;
 * - `writeOnly` properties never leave the server;
 * - `x-classification: C3` properties only in responses of `x-c3-log` operations;
 * - a removed property is ABSENT from the JSON, never `null`.
 *
 * Used automatically for every @Operation handler (SerializeInterceptor). Modules that build payloads
 * outside an HTTP response (SSE, outbox, idempotent replay) call serializeSchema()/serializeResponse().
 */
import { OPENAPI_SCHEMAS } from '../../generated/openapi-schemas';
import type { PropShape, Shape } from '../openapi-types';
import { rbacFieldAllows, visibleToAllows } from './field-policy';

export interface SerializeContext {
  /** Roles of the caller at the property of the request (empty for public operations). */
  roles: readonly string[];
  /** The operation declares x-c3-log (C3 properties allowed). */
  c3?: boolean;
  /** Guest-session level of a guest caller: properties with a higher x-guest-level are removed (ĐK-2). */
  guestLevel?: number;
}

/** Marker for values the serializer removed (so arrays/objects can drop them). */
const DROP = Symbol('drop');
type Out = unknown | typeof DROP;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v) as unknown;
  return proto === Object.prototype || proto === null;
}

function isScalar(v: unknown): boolean {
  return (
    v === null ||
    typeof v === 'string' ||
    typeof v === 'number' ||
    typeof v === 'boolean' ||
    v instanceof Date
  );
}

/** Deep copy of JSON-like data for free (`any`/open) values; functions/symbols are dropped. */
function copyFree(v: unknown): Out {
  if (isScalar(v)) return v;
  if (Array.isArray(v)) return v.map(copyFree).filter((x) => x !== DROP);
  if (isPlainObject(v)) {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      const c = copyFree(x);
      if (c !== DROP && x !== undefined) out[k] = c;
    }
    return out;
  }
  return DROP;
}

export function propertyAllowed(p: PropShape, ctx: SerializeContext): boolean {
  if (p.w) return false;
  if (p.c3 && !ctx.c3) return false;
  if (p.g !== undefined && ctx.guestLevel !== undefined && p.g > ctx.guestLevel) return false;
  if (p.v && !visibleToAllows(p.v, ctx.roles)) return false;
  if (p.f && !rbacFieldAllows(p.f, ctx.roles)) return false;
  return true;
}

function walk(value: unknown, shape: Shape, ctx: SerializeContext, depth: number): Out {
  if (value === undefined) return DROP;
  if (value === null) return null;
  if (depth > 64) return DROP;
  switch (shape.k) {
    case 'any':
      return copyFree(value);
    case 'scalar':
      return isScalar(value) ? value : DROP;
    case 'ref': {
      const target = OPENAPI_SCHEMAS.schemas[shape.name];
      return target ? walk(value, target, ctx, depth + 1) : DROP;
    }
    case 'array':
      if (!Array.isArray(value)) return DROP;
      return value.map((x) => walk(x, shape.items, ctx, depth + 1)).filter((x) => x !== DROP);
    case 'union': {
      const kind = Array.isArray(value) ? 'array' : isPlainObject(value) ? 'object' : 'scalar';
      const branch = shape.of.find((b) => resolveKind(b) === kind) ?? shape.of[0];
      return branch ? walk(value, branch, ctx, depth + 1) : DROP;
    }
    case 'object': {
      if (!isPlainObject(value)) return DROP;
      const out: Record<string, unknown> = {};
      for (const [key, x] of Object.entries(value)) {
        const p = shape.props[key];
        let c: Out = DROP;
        if (p) {
          if (propertyAllowed(p, ctx)) c = walk(x, p.s, ctx, depth + 1);
        } else if (shape.extra) {
          c = walk(x, shape.extra, ctx, depth + 1);
        } else if (shape.open) {
          c = copyFree(x);
        }
        if (c !== DROP) out[key] = c;
      }
      return out;
    }
  }
}

function resolveKind(shape: Shape): string {
  if (shape.k === 'ref') {
    const t = OPENAPI_SCHEMAS.schemas[shape.name];
    return t ? resolveKind(t) : 'any';
  }
  return shape.k === 'any' || shape.k === 'union' ? 'any' : shape.k;
}

/** Serialize `value` against an inline shape. Returns undefined when nothing may be returned. */
export function serializeShape(value: unknown, shape: Shape, ctx: SerializeContext): unknown {
  const out = walk(value, shape, ctx, 0);
  return out === DROP ? undefined : out;
}

/** Serialize against a component schema (e.g. 'ApprovalRequest') – for SSE/outbox payloads. */
export function serializeSchema(
  schemaName: string,
  value: unknown,
  ctx: SerializeContext,
): unknown {
  if (!OPENAPI_SCHEMAS.schemas[schemaName]) throw new Error(`unknown schema ${schemaName}`);
  return serializeShape(value, { k: 'ref', name: schemaName }, ctx);
}

/** JSON 2xx response shapes of an operation (empty when it declares none). */
export function responseShapes(operationId: string): Record<string, Shape> {
  return OPENAPI_SCHEMAS.responses[operationId] ?? {};
}

/**
 * Pick the response shape for a status: exact match, else the single declared 2xx shape, else 201/200.
 * Returns null when the operation has no JSON 2xx response.
 */
export function responseShapeFor(operationId: string, status: number | undefined): Shape | null {
  const shapes = responseShapes(operationId);
  const keys = Object.keys(shapes);
  if (keys.length === 0) return null;
  const exact = status !== undefined ? shapes[String(status)] : undefined;
  if (exact) return exact;
  if (keys.length === 1) return shapes[keys[0] as string] ?? null;
  return shapes['201'] ?? shapes['200'] ?? shapes[keys[0] as string] ?? null;
}

export class UndeclaredResponseError extends Error {
  constructor(operationId: string) {
    super(`operation ${operationId} returned a JSON body but declares no JSON 2xx response`);
    this.name = 'UndeclaredResponseError';
  }
}

/** Serialize an operation's response body for the caller (used by SerializeInterceptor). */
export function serializeResponse(
  operationId: string,
  status: number | undefined,
  body: unknown,
  ctx: SerializeContext,
): unknown {
  if (body === undefined || body === null) return body;
  // Binary/stream bodies (images, CSV) are not JSON: their own endpoints control what they send.
  if (Buffer.isBuffer(body) || isStream(body)) return body;
  const shape = responseShapeFor(operationId, status);
  if (!shape) throw new UndeclaredResponseError(operationId);
  return serializeShape(body, shape, ctx) ?? {};
}

function isStream(v: unknown): boolean {
  return (
    typeof v === 'object' && v !== null && typeof (v as { pipe?: unknown }).pipe === 'function'
  );
}
