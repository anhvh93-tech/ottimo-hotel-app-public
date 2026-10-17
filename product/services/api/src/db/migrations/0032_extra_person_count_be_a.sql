-- 0032 (custom, hand-written – BE-A Sprint 3 testing fix; blocker verification ARC-S3-01 follow-up). Runs as
-- ottimo_owner. Number of extra persons of a night (BR-110) next to its fee: the bill prints "{n} người" per
-- night (`extra_person` line label) – NULL = the booking-level count of pricing_snapshot (every night alike).
ALTER TABLE stay_night ADD COLUMN extra_person_count smallint;
--> statement-breakpoint
ALTER TABLE stay_night ADD CONSTRAINT stay_night_extra_person_count_check
  CHECK (extra_person_count IS NULL OR extra_person_count >= 0);
