/** approvals module (SM-10, US-007): ApprovalService (public) + S23 HTTP endpoints. */
import { Module } from '@nestjs/common';
import { ApprovalsController } from './internal/approvals.controller';
import { ApprovalService } from './public/approval.service';

@Module({
  controllers: [ApprovalsController],
  providers: [ApprovalService],
  exports: [ApprovalService],
})
export class ApprovalsModule {}
