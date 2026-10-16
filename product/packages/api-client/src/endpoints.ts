// One function per OpenAPI operation used by the web apps. Request/response types come from the
// generated contract, so a contract change breaks the build here instead of at runtime.
import type { ApiClient } from './client';
import type {
  BodyOf,
  ChangePasswordBody,
  Guest,
  GuestInput,
  GuestSummary,
  LoginBody,
  LookupGuestBody,
  Me,
  Parameter,
  PageInfo,
  PropertyRole,
  Room,
  RoomGroup,
  RoomPatch,
  SetParameterBody,
  TrustDeviceBody,
  TrustedDevice,
  UpdateUserBody,
  User,
} from './types';

type P = { propertyId: string };
type Paged<T> = { data: T[]; page: PageInfo };

export function createEndpoints(api: ApiClient) {
  const r = api.request.bind(api);
  return {
    // auth (S01)
    login: (body: LoginBody) => r<Me>('POST', '/v1/auth/login', { body, local: true }),
    logout: () => r<void>('POST', '/v1/auth/logout'),
    getMe: () => r<Me>('GET', '/v1/me'),
    // 401 here means "current password wrong" (EP00 1.3), not an expired session.
    changeMyPassword: (body: ChangePasswordBody) =>
      r<void>('POST', '/v1/me/password', { body, local: true }),

    // rooms (S25)
    listRooms: ({ propertyId }: P) =>
      r<{ data: Room[] }>('GET', '/v1/properties/{propertyId}/rooms', { path: { propertyId } }),
    listRoomGroups: ({ propertyId }: P) =>
      r<{ data: RoomGroup[] }>('GET', '/v1/properties/{propertyId}/room-groups', {
        path: { propertyId },
      }),
    updateRoom: (
      { propertyId, roomId }: P & { roomId: string },
      body: RoomPatch,
      version: number,
    ) =>
      r<Room>('PATCH', '/v1/properties/{propertyId}/rooms/{roomId}', {
        path: { propertyId, roomId },
        body,
        ifMatch: version,
      }),

    // parameters (S24)
    listParameters: ({ propertyId }: P) =>
      r<{ data: Parameter[] }>('GET', '/v1/properties/{propertyId}/parameters', {
        path: { propertyId },
      }),
    getParameterHistory: ({ propertyId, key }: P & { key: string }) =>
      r<{ current: Parameter; history: Parameter[] }>(
        'GET',
        '/v1/properties/{propertyId}/parameters/{key}',
        { path: { propertyId, key } },
      ),
    setParameter: ({ propertyId, key }: P & { key: string }, body: SetParameterBody) =>
      r<Parameter>('PUT', '/v1/properties/{propertyId}/parameters/{key}', {
        path: { propertyId, key },
        body,
      }),

    // guests (S14)
    searchGuests: ({ propertyId }: P, q: string, picker = false) =>
      r<Paged<GuestSummary>>('GET', '/v1/properties/{propertyId}/guests', {
        path: { propertyId },
        query: { q, picker: picker || undefined, limit: picker ? 5 : 20 },
      }),
    lookupGuestByContact: ({ propertyId }: P, body: LookupGuestBody) =>
      r<{ matches: GuestSummary[] }>('POST', '/v1/properties/{propertyId}/guests/lookup', {
        path: { propertyId },
        body,
      }),
    createGuest: ({ propertyId }: P, body: GuestInput, idempotencyKey: string) =>
      r<Guest>('POST', '/v1/properties/{propertyId}/guests', {
        path: { propertyId },
        body,
        idempotencyKey,
      }),
    getGuest: ({ propertyId, guestId }: P & { guestId: string }) =>
      r<Guest>('GET', '/v1/properties/{propertyId}/guests/{guestId}', {
        path: { propertyId, guestId },
      }),
    updateGuest: (
      { propertyId, guestId }: P & { guestId: string },
      body: GuestInput,
      version: number,
    ) =>
      r<Guest>('PATCH', '/v1/properties/{propertyId}/guests/{guestId}', {
        path: { propertyId, guestId },
        body,
        ifMatch: version,
      }),

    // users & devices (S26, owner only)
    listUsers: () => r<Paged<User>>('GET', '/v1/users', { query: { limit: 100 } }),
    setUserRoles: (userId: string, roles: PropertyRole[], version: number) =>
      r<User>('PUT', '/v1/users/{userId}/roles', {
        path: { userId },
        body: { roles } satisfies BodyOf<'setUserRoles'>,
        ifMatch: version,
      }),
    updateUser: (userId: string, body: UpdateUserBody, version: number) =>
      r<User>('PATCH', '/v1/users/{userId}', { path: { userId }, body, ifMatch: version }),
    listTrustedDevices: ({ propertyId }: P) =>
      r<{ data: TrustedDevice[] }>('GET', '/v1/properties/{propertyId}/trusted-devices', {
        path: { propertyId },
      }),
    trustCurrentDevice: ({ propertyId }: P, body: TrustDeviceBody, idempotencyKey: string) =>
      r<TrustedDevice>('POST', '/v1/properties/{propertyId}/trusted-devices', {
        path: { propertyId },
        body,
        idempotencyKey,
        local: true,
      }),
    revokeTrustedDevice: (
      { propertyId, deviceId }: P & { deviceId: string },
      reason: string | undefined,
      idempotencyKey: string,
    ) =>
      r<TrustedDevice>(
        'POST',
        '/v1/properties/{propertyId}/trusted-devices/{deviceId}/actions/revoke',
        { path: { propertyId, deviceId }, body: reason ? { reason } : {}, idempotencyKey },
      ),
  };
}

export type Endpoints = ReturnType<typeof createEndpoints>;
