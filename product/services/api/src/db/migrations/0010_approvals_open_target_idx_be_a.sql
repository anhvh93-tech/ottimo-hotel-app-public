-- BE-A, Round 2 Sprint 1 review fix FB-R2-ARC-BE-16: open requests of one target (checkout guard AC5,
-- ApprovalService.pendingFor). Partial – approval_request is kept forever (BR-434), open rows stay few.
CREATE INDEX "approval_request_open_target_idx" ON "approval_request" USING btree ("property_id","target_type","target_id") WHERE "approval_request"."status" IN ('pending', 'escalated');
