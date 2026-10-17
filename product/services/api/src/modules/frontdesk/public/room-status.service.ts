/**
 * Room status SM-03 store – moved to the housekeeping module (OpenAPI 0.3.7 B-14, BE-C Sprint 4). Re-exported
 * here so the front desk (B9/B14/B17/B18) keeps its import path; FrontdeskModule still provides its instance.
 */
export {
  RoomStatusService,
  type RoomStatusCode,
} from '../../housekeeping/public/room-status.service';
