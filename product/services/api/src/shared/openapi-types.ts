/** Shape of src/generated/openapi-meta.ts (scripts/gen-openapi-meta.mjs). */
export interface OperationMeta {
  method: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE' | string;
  /** OpenAPI path template, e.g. /v1/properties/{propertyId}/parameters/{key} */
  path: string;
  /** x-roles: staff roles allowed to call the operation (empty for guest/public operations). */
  roles: string[];
  rbac: string[];
  scope?: unknown;
  /** The operation declares Idempotency-Key: the middleware requires it (428 when missing). */
  idempotencyKey: boolean;
  /** The operation declares If-Match: the middleware requires it (428 when missing). */
  ifMatch: boolean;
  /** The request body declares `dryRun` (tính thử): only then may `dryRun: true` skip the two headers. */
  dryRun?: boolean;
  trustedDevice: boolean;
  stepUp: boolean;
  guestLevel?: number;
  /** security: [] – no staff session needed. */
  public: boolean;
  /** x-c3-log: the operation returns/writes C3 values (C3 properties may appear in its response). */
  c3Log: boolean;
}

export interface SecurityParameterBounds {
  /** 'object' (0.3.4: session_policy, login_lockout) = nested bounds in `properties`. */
  type: 'integer' | 'array' | 'object';
  minimum?: number;
  maximum?: number;
  uniqueItems?: boolean;
  items?: { enum: string[] };
  required?: string[];
  properties?: Record<string, Omit<SecurityParameterBounds, 'default'> & { default?: unknown }>;
  description?: string;
  default: unknown;
  ref?: string;
}

export interface OpenApiMeta {
  version: string;
  operations: Record<string, OperationMeta>;
  /** Problem.code → HTTP status (info.description "Mã lỗi"). */
  problemCodes: Record<string, number>;
  securityParameters: Record<string, SecurityParameterBounds>;
}

/** Response shapes (src/generated/openapi-schemas.ts) used by the role serializer – SR-AZ-04. */
export type Shape =
  | { k: 'any' }
  | { k: 'scalar' }
  | { k: 'ref'; name: string }
  | { k: 'array'; items: Shape }
  | { k: 'object'; props: Record<string, PropShape>; open: boolean; extra?: Shape }
  | { k: 'union'; of: Shape[] };

export interface PropShape {
  s: Shape;
  /** x-visible-to: roles allowed to see the property. */
  v?: string[];
  /** x-rbac-field: rbac-matrix 6 data code (D01…D29). */
  f?: string;
  /** writeOnly: never in a response. */
  w?: boolean;
  /** x-classification C3: only in responses of x-c3-log operations. */
  c3?: boolean;
}

export interface OpenApiSchemas {
  schemas: Record<string, Shape>;
  /** operationId → HTTP status (2xx) → JSON response shape. */
  responses: Record<string, Record<string, Shape>>;
}
