// Staff PWA calls (OpenAPI 0.3.7 – tags auth, housekeeping, maintenance). Only operations the
// housekeeping/maintenance screens need: nothing C3 (no guest documents, door codes, `…/sensitive`),
// nothing about money (ADR-005 mục 6, SR-DEV-09, rbac 8.7) – guard.test.ts checks the source.
import {
  ApiError,
  createApiClient,
  isApiError,
  newIdempotencyKey,
  type ChangePasswordBody,
  type components,
  type HttpMethod,
  type LoginMfaBody,
} from '@ottimo/api-client';

type Schemas = components['schemas'];
export type Me = Schemas['Me'];
export type Role = Schemas['Role'];
export type RoomStatusCode = Schemas['RoomStatusCode'];
export type RoomStatusEntry = Schemas['RoomStatusEntry'];
export type HkTask = Schemas['HkTask'];
export type HkTaskType = Schemas['HkTaskType'];
export type WorkOrder = Schemas['WorkOrder'];
export type WorkOrderCreate = Schemas['WorkOrderCreate'];
export type WorkOrderCategory = Schemas['WorkOrderCategory'];
export type WorkOrderStatus = Schemas['WorkOrderStatus'];
export type Severity = Schemas['Severity'];
export type Inspection = Schemas['Inspection'];
export type StaffNotification = Schemas['StaffNotification'];
export type OccupancyConflict = Schemas['OccupancyConflict'];
export type InspectionInput = Schemas['InspectionInput'];
export type RoomEvent = 'start_cleaning' | 'finish_cleaning' | 'needs_cleaning';
export type HkTaskAction = 'start' | 'complete' | 'cancel';
export type WorkOrderAction = 'accept' | 'wait-parts' | 'resume' | 'complete' | 'cancel' | 'reopen';

export interface ChecklistItem {
  code: string;
  label: string;
  required: boolean;
  photoRequired?: boolean;
  dynamic?: boolean;
}
export interface Checklist {
  version: number;
  items: ChecklistItem[];
}
export interface RoomStatusList {
  asOf: string;
  data: RoomStatusEntry[];
}
export interface HkTaskList {
  summary: { done?: number; total?: number };
  data: HkTask[];
}

let csrfToken: string | undefined;
const unauthorized = new Set<() => void>();

/** Session cookie expired / logged out elsewhere → the app shows the login screen (queue is kept). */
export function onUnauthorized(fn: () => void): () => void {
  unauthorized.add(fn);
  return () => unauthorized.delete(fn);
}

/**
 * Restricted session (OpenAPI `login`): a temporary password (`403 PASSWORD_CHANGE_REQUIRED`) or 2-step
 * verification still to set up (`403 MFA_ENROLLMENT_REQUIRED` – owner/manager under `MFA_ENFORCED`, or after a
 * sign-in with a recovery code). Every other call is refused until then – BUG-R3-052: the app must say so,
 * not "the connection may be weak".
 */
export type Restriction = 'password_change' | 'mfa_enrollment';
const restricted = new Set<(r: Restriction) => void>();

export function restrictionOf(e: unknown): Restriction | undefined {
  if (!isApiError(e) || e.status !== 403) return undefined;
  if (e.code === 'PASSWORD_CHANGE_REQUIRED') return 'password_change';
  if (e.code === 'MFA_ENROLLMENT_REQUIRED') return 'mfa_enrollment';
  return undefined;
}

/** Which restricted screen a profile opens on (`Me` after sign-in), if any. */
export function meRestriction(me: Me): Restriction | undefined {
  if (me.mustChangePassword === true) return 'password_change';
  if (me.mfaEnrollmentRequired === true) return 'mfa_enrollment';
  return undefined;
}

export function onRestricted(fn: (r: Restriction) => void): () => void {
  restricted.add(fn);
  return () => restricted.delete(fn);
}

export function setCsrfToken(token: string | undefined) {
  csrfToken = token; // memory only (SR-PWA-07)
}

const client = createApiClient({
  getCsrfToken: () => csrfToken,
  onError: (e) => {
    if (e.status === 401 && e.code === 'UNAUTHENTICATED') unauthorized.forEach((fn) => fn());
    const r = restrictionOf(e);
    if (r) restricted.forEach((fn) => fn(r));
  },
});

const P = '/v1/properties/{propertyId}';

/**
 * Writes need the CSRF token of the session. After an offline start the app runs on the cached profile
 * without one → read it from `getMe` (session cookie) before the first write; a network error here makes
 * the queue retry later, a 401 pauses it until sign-in.
 */
export async function ensureCsrf(): Promise<void> {
  if (csrfToken) return;
  const me = (await client.request<Me>('GET', '/v1/me', { local: true })).data;
  csrfToken = me.csrfToken;
}

export interface StaffRequest {
  method: HttpMethod;
  template: string;
  path?: Record<string, string>;
  body?: unknown;
  form?: FormData;
  idempotencyKey?: string;
  ifMatch?: number;
  /** The app's language (VI/EN button), not the browser's – labels the server translates (0.3.7 bổ sung 1 #13). */
  acceptLanguage?: AppLanguage;
}

export type AppLanguage = 'vi' | 'en';

/** No answer from the API itself: network down, or the gateway says the API is not there (502/503/504 – UXR P-09). */
export function unreachable(e: unknown): boolean {
  return isApiError(e) && (e.isNetwork || e.status === 502 || e.status === 503 || e.status === 504);
}

/** Raw request used by the offline queue (src/queue) – one queued item = one request. */
export async function sendRequest<T>(req: StaffRequest): Promise<T> {
  const res = await client.request<T>(req.method, req.template, {
    path: req.path,
    body: req.body,
    form: req.form,
    idempotencyKey: req.idempotencyKey,
    ifMatch: req.ifMatch,
    acceptLanguage: req.acceptLanguage,
    local: true, // the queue classifies its own failures (ADR-005), no global handler
  });
  return res.data;
}

export const staffApi = {
  login: async (username: string, password: string) =>
    (
      await client.request<Me>('POST', '/v1/auth/login', {
        body: { username, password },
        local: true,
      })
    ).data,
  /**
   * Sign-in step 2 (`loginMfa`, SEC 06.17): `mfaToken` from the `401 MFA_REQUIRED` of `login` – kept in
   * React state only, never stored, logged or put in a URL. Every wrong answer is the same `401 MFA_INVALID`.
   */
  loginMfa: async (body: LoginMfaBody) =>
    (await client.request<Me>('POST', '/v1/auth/login/mfa', { body, local: true })).data,
  /**
   * Own password (`changeMyPassword`, US-001 AC4): + `totpCode`/`recoveryCode` once 2-step is on (S2). Every
   * session ends and this phone gets a new one with a new CSRF token → read `getMe` right after.
   */
  changeMyPassword: async (body: ChangePasswordBody) => {
    await client.request<void>('POST', '/v1/me/password', { body, local: true });
  },
  getMe: async () => (await client.request<Me>('GET', '/v1/me', { local: true })).data,
  logout: async () => {
    await client.request<void>('POST', '/v1/auth/logout', { local: true });
  },
  listRoomStatuses: async (propertyId: string) =>
    (
      await client.request<RoomStatusList>('GET', `${P}/room-statuses`, {
        path: { propertyId },
      })
    ).data,
  listHkTasks: async (propertyId: string, date?: string) =>
    (
      await client.request<HkTaskList>('GET', `${P}/hk-tasks`, {
        path: { propertyId },
        query: { date },
      })
    ).data,
  getInspectionChecklist: async (propertyId: string, roomId: string, lang: AppLanguage) =>
    (
      await client.request<Checklist>('GET', `${P}/inspection-checklist`, {
        path: { propertyId },
        query: { roomId },
        acceptLanguage: lang,
      })
    ).data,
  listWorkOrders: async (propertyId: string) =>
    (
      await client.request<{ data: WorkOrder[] }>('GET', `${P}/work-orders`, {
        path: { propertyId },
        query: { limit: 100 },
      })
    ).data,
  getWorkOrder: async (propertyId: string, workOrderId: string) =>
    (
      await client.request<WorkOrder>('GET', `${P}/work-orders/{workOrderId}`, {
        path: { propertyId, workOrderId },
      })
    ).data,
  /** In-app inbox (R2; Web Push R3) – kind + reference only, never C2/C3 (SR-PWA-06). */
  listMyNotifications: async () =>
    (
      await client.request<{ data: StaffNotification[]; unreadCount: number }>(
        'GET',
        '/v1/me/notifications',
        { query: { limit: 50 } },
      )
    ).data,
  markNotificationRead: async (notificationId: string) => {
    await client.request<void>('POST', '/v1/me/notifications/{notificationId}/read', {
      path: { notificationId },
    });
  },
  /** Photo of a work order (C2, not C3 – `getAttachment`, B-01). Never cached (`no-store`). */
  getAttachment: async (propertyId: string, attachmentId: string) =>
    (
      await client.request<Blob>('GET', `${P}/attachments/{attachmentId}`, {
        path: { propertyId, attachmentId },
        blob: true,
      })
    ).data,
  /** Online only (ADR-005 mục 3: `transitionWorkOrder` is never queued). */
  transitionWorkOrder: async (
    propertyId: string,
    wo: Pick<WorkOrder, 'id' | 'version'>,
    action: WorkOrderAction,
    body: Record<string, unknown>,
    idempotencyKey: string,
  ) =>
    (
      await client.request<WorkOrder>('POST', `${P}/work-orders/{workOrderId}/actions/{action}`, {
        path: { propertyId, workOrderId: wo.id, action },
        body,
        idempotencyKey,
        ifMatch: wo.version,
      })
    ).data,
};

/** Request builders for the operations the queue may hold (ADR-005 mục 3 list). */
export const queuedOps = {
  transitionRoomStatus: (
    propertyId: string,
    roomId: string,
    body: { event: RoomEvent; expectedFrom: RoomStatusCode; performedAt: string; taskId?: string },
  ): StaffRequest => ({
    method: 'POST',
    template: `${P}/rooms/{roomId}/status-transitions`,
    path: { propertyId, roomId },
    body,
  }),
  transitionHkTask: (
    propertyId: string,
    taskId: string,
    action: HkTaskAction,
    body: {
      performedAt: string;
      cancelReasonCode?: 'guest_refused' | 'dnd' | 'other';
      cancelNote?: string;
    },
  ): StaffRequest => ({
    method: 'POST',
    template: `${P}/hk-tasks/{taskId}/actions/{action}`,
    path: { propertyId, taskId, action },
    body,
  }),
  recordInspection: (
    propertyId: string,
    roomId: string,
    body: InspectionInput,
    lang: AppLanguage,
  ): StaffRequest => ({
    method: 'POST',
    template: `${P}/rooms/{roomId}/inspections`,
    path: { propertyId, roomId },
    body,
    acceptLanguage: lang,
  }),
  createWorkOrder: (propertyId: string, body: WorkOrderCreate): StaffRequest => ({
    method: 'POST',
    template: `${P}/work-orders`,
    path: { propertyId },
    body,
  }),
  uploadAttachment: (
    propertyId: string,
    file: Blob,
    purpose: 'work_order' | 'inspection',
  ): StaffRequest => {
    const form = new FormData();
    form.append('file', file, 'photo.jpg');
    form.append('purpose', purpose);
    return { method: 'POST', template: `${P}/attachments`, path: { propertyId }, form };
  },
};

export { ApiError, isApiError, newIdempotencyKey };
