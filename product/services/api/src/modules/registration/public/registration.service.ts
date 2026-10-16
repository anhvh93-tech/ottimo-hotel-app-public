/**
 * Public surface of the registration module for guest-portal (same zone, BE-C): the service (uploads,
 * consent, registration of a booking) and the read-only booking view. Other zones use
 * registration.port.ts (FD_REGISTRATION_PORT) instead.
 */
export { RegistrationService } from '../internal/registration.service';
export type { StaffActor } from '../internal/registration.service';
export { SYSTEM_ACTOR, readStay } from '../internal/stay-reader';
export type { StayView } from '../internal/stay-reader';
