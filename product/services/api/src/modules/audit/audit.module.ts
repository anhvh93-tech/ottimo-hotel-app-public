/** audit module HTTP surface: S27 activity log (US-006). AuditService itself is provided by CoreModule. */
import { Module } from '@nestjs/common';
import { AuditLogController } from './internal/audit-log.controller';

@Module({ controllers: [AuditLogController] })
export class AuditModule {}
