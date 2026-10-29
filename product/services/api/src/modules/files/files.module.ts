/**
 * files module (BE-C Sprint 3): one image pipeline + encrypted blob store for every upload (SEC C1, C2,
 * I2), operational attachments (uploadAttachment / getAttachment, B-01). Global exports:
 * - EncryptedBlobService (registration, guest-portal);
 * - AttachmentService, also bound to BE-B's ATTACHMENT_USAGE port (payments: deposit receipts, refund
 *   proofs, penalty evidence – replaces the UnverifiedAttachmentUsage stand-in).
 */
import { type DynamicModule, Global, Module } from '@nestjs/common';
import { ATTACHMENT_USAGE } from '../payments/public/attachment-usage';
import { AttachmentsController } from './internal/attachments.controller';
import { BLOB_STORE, type BlobStore, blobStoreFromEnv } from './internal/blob-store';
import { UploadSessionCheck } from './internal/upload-session.check';
import { AttachmentService } from './public/attachment.service';
import { EncryptedBlobService } from './public/encrypted-blob.service';
import './audit-entities';

export interface FilesModuleOptions {
  env?: NodeJS.ProcessEnv;
  /** Explicit store (tests). */
  blobStore?: BlobStore;
}

@Global()
@Module({})
export class FilesModule {
  static register(options: FilesModuleOptions = {}): DynamicModule {
    const store = options.blobStore ?? blobStoreFromEnv(options.env ?? process.env);
    return {
      module: FilesModule,
      controllers: [AttachmentsController],
      providers: [
        { provide: BLOB_STORE, useValue: store },
        EncryptedBlobService,
        AttachmentService,
        { provide: ATTACHMENT_USAGE, useExisting: AttachmentService },
        // Real session of a multipart upload checked before its body is read (src/http.ts readMultipart).
        UploadSessionCheck,
      ],
      exports: [EncryptedBlobService, AttachmentService, ATTACHMENT_USAGE, BLOB_STORE],
    };
  }
}
