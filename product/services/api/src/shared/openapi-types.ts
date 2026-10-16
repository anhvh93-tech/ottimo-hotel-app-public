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
  trustedDevice: boolean;
  stepUp: boolean;
  guestLevel?: number;
  /** security: [] – no staff session needed. */
  public: boolean;
}

export interface SecurityParameterBounds {
  type: 'integer' | 'array';
  minimum?: number;
  maximum?: number;
  uniqueItems?: boolean;
  items?: { enum: string[] };
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
