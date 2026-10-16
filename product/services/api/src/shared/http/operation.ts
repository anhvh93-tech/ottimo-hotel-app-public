/**
 * Binds a controller handler to its OpenAPI operation (contract-first, coding-standards 7).
 * The guard reads x-roles / Idempotency-Key / If-Match / x-requires-trusted-device from the generated
 * metadata of that operation – there is no hand-written role list anywhere in the api.
 * A handler without @Operation is refused by the guard (default deny); only @PublicRoute opts out.
 */
import { SetMetadata } from '@nestjs/common';
import { OPENAPI_META } from '../../generated/openapi-meta';
import type { OperationMeta } from '../openapi-types';

export const OPERATION_KEY = 'ottimo:operation';
export const PUBLIC_ROUTE_KEY = 'ottimo:public-route';

export function operationMeta(operationId: string): OperationMeta {
  const meta = OPENAPI_META.operations[operationId];
  if (!meta) throw new Error(`@Operation('${operationId}'): no such operationId in openapi.yaml`);
  return meta;
}

/** Fails at import time when the operationId is not in the spec. */
export const Operation = (operationId: string): MethodDecorator & ClassDecorator => {
  operationMeta(operationId);
  return SetMetadata(OPERATION_KEY, operationId);
};

/** Infrastructure routes outside the guard (health). Never for business endpoints. */
export const PublicRoute = (): MethodDecorator & ClassDecorator =>
  SetMetadata(PUBLIC_ROUTE_KEY, true);
