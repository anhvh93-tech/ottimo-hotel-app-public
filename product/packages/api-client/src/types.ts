import type { components, operations } from './generated/openapi';

type Schemas = components['schemas'];

export type Me = Schemas['Me'];
export type MeProperty = Me['properties'][number];
export type Problem = Schemas['Problem'];
export type FieldError = Schemas['FieldError'];
export type Role = Schemas['Role'];
export type Room = Schemas['Room'];
export type RoomPatch = Schemas['RoomPatch'];
export type RoomGroup = Schemas['RoomGroup'];
export type Parameter = Schemas['Parameter'];
export type Guest = Schemas['Guest'];
export type GuestInput = Schemas['GuestInput'];
export type GuestSummary = Schemas['GuestSummary'];
export type User = Schemas['User'];
export type PropertyRole = Schemas['PropertyRole'];
export type TrustedDevice = Schemas['TrustedDevice'];
export type PageInfo = Schemas['PageInfo'];

/** JSON request body of an operation (generated from OpenAPI). */
export type BodyOf<K extends keyof operations> = operations[K] extends {
  requestBody?: { content: { 'application/json': infer B } };
}
  ? B
  : never;

/** JSON body of the first 2xx response of an operation. */
export type ResponseOf<K extends keyof operations> = operations[K]['responses'] extends infer R
  ? R extends { 200: { content: { 'application/json': infer B } } }
    ? B
    : R extends { 201: { content: { 'application/json': infer B } } }
      ? B
      : undefined
  : never;

export type LoginBody = BodyOf<'login'>;
export type ChangePasswordBody = BodyOf<'changeMyPassword'>;
export type SetParameterBody = BodyOf<'setParameter'>;
export type TrustDeviceBody = BodyOf<'trustCurrentDevice'>;
export type UpdateUserBody = BodyOf<'updateUser'>;
export type LookupGuestBody = BodyOf<'lookupGuestByContact'>;
