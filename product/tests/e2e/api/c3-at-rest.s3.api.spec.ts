// SEC – dữ liệu C3 lúc lưu (ADR-013, SEC s3-checklist B1/C2, SR-C3): số giấy tờ, ngày sinh, địa chỉ, thị thực chỉ
// nằm trong DB dưới dạng bản mã (cột *_enc, DEK riêng) + băm HMAC để chống trùng; ảnh giấy tờ trên đĩa là bản mã
// (không còn chữ ký PNG/JPEG/WebP). Kiểm trực tiếp trên stack DÙNG MỘT LẦN (E2E_COMPOSE_CONTROL=1): psql siêu người
// dùng đọc nguyên dòng guest_document, node trong container api đọc thư mục blob (BLOBSTORE_LOCAL_PATH).
// Không chạy trên stack dùng chung / staging (skip có lý do). Dữ liệu giả: CCCD ngẫu nhiên, địa chỉ có chuỗi đánh dấu.
import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import {
  call,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
  versionTag,
} from '../support/api.js';
import { PRODUCT_DIR } from '../support/env.js';
import { bookFree, cleanupTracked, room, s2Context } from '../support/s2.js';
import {
  CAN_CLEAN_ROOMS,
  EP3,
  addDocument,
  callMultipart,
  dev,
  fakeCccd,
  getRegistration,
  registrationOf,
  stackSql,
  vnDoc,
} from '../support/s3.js';

test.afterEach(async ({ request }) => cleanupTracked(request));

/** Run a node one-liner inside the api container (same image as production minus test-support). */
function inApi(js: string): string {
  return execFileSync(
    'docker',
    [
      'compose',
      ...(process.env.E2E_COMPOSE_PROJECT ? ['-p', process.env.E2E_COMPOSE_PROJECT] : []),
      '--env-file',
      process.env.E2E_COMPOSE_ENV_FILE ?? '.env',
      '-f',
      process.env.E2E_COMPOSE_FILE ?? 'infra/docker-compose.yml',
      'exec',
      '-T',
      'api',
      'node',
      '-e',
      js,
    ],
    { cwd: PRODUCT_DIR, stdio: 'pipe' },
  ).toString();
}

test.describe(
  'SEC C3 – mã hóa lúc lưu (giấy tờ, ảnh)',
  { tag: ['@api', '@sprint3', '@sec'] },
  () => {
    test.beforeEach(() => needSeedPassword());

    test('TC-SEC-010 mọi endpoint x-requires-trusted-device: máy chưa cấp → 403 DEVICE_NOT_TRUSTED, không nội dung, không ghi gì (audit access.denied kiểm ở tầng A BE); máy quầy đã cấp → qua cổng thiết bị', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-SEC-010', [
        EP3.addGuestDocument,
        EP3.getGuestDocumentSensitive,
        EP3.getPortalData,
      ]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const res = await bookFree(request, fd, c, {
        room: room(c, '102'),
        nights: 2,
        today: await stackToday(request),
      });
      const regId = await registrationOf(request, fd, res);
      const docNumber = fakeCccd();
      const add = await addDocument(
        request,
        fd,
        regId,
        vnDoc('Nguyen Thi Thiet Bi', { docNumber }),
        1,
      );
      expect(add.status, JSON.stringify(add.body)).toBe(201);
      const doc = add.body.documents.find((d) => d.isMain)!;
      const imageId = doc.imageIds?.[0] ?? '00000000-0000-7000-8000-000000000000';
      const pid = propertyIdOf(fd);
      const R = `/v1/properties/${pid}/registrations/${regId}`;
      const cur = await getRegistration(request, fd, regId);
      // mã cửa GET/PUT: US-128 dời R3 (route không đăng ký → 404, kiểm ở runner RBAC S3)
      const ops: Array<[string, string, string, unknown?]> = [
        ['addGuestDocument', 'POST', `${R}/documents`, 'multipart'],
        [
          'updateGuestDocument',
          'PATCH',
          `${R}/documents/${doc.id}`,
          vnDoc('Nguyen Thi Thiet Bi', { docNumber }),
        ],
        ['getGuestDocumentSensitive', 'GET', `${R}/documents/${doc.id}/sensitive?reason=recheck`],
        ['getDocumentImage', 'GET', `${R}/documents/${doc.id}/images/${imageId}?reason=recheck`],
        ['getPortalData', 'GET', `${R}/portal-data`],
        ['purgeRegistrationImages', 'DELETE', `${R}/images?reason=guest_request`],
        [
          'recordDocumentCheck',
          'PUT',
          `${R}/documents/${doc.id}/checks/name_match`,
          { manualResult: 'pass', note: 'E2E' },
        ],
      ];
      for (const [op, method, path, body] of ops) {
        const r =
          body === 'multipart'
            ? await callMultipart(request, method, path, {
                session: fd,
                idempotencyKey: true,
                fields: { data: vnDoc('Nguyen Thi Khac', { isMain: false }) },
              })
            : await call(request, method, path, {
                session: fd,
                ...(method !== 'GET'
                  ? { idempotencyKey: true, ifMatch: versionTag(cur.body.version) }
                  : {}),
                ...(body !== undefined ? { body } : {}),
              });
        expect(r.status, `${op} không cookie thiết bị: ${JSON.stringify(r.body)}`).toBe(403);
        expect((r.body as { code?: string }).code, op).toBe('DEVICE_NOT_TRUSTED');
        expect(JSON.stringify(r.body), `${op}: không lộ số giấy tờ`).not.toContain(docNumber);
      }
      // ảnh còn nguyên (purge không chạy), giấy tờ không bị sửa
      const after = await getRegistration(request, fd, regId);
      expect(after.body.documents.length).toBe(cur.body.documents.length);
      expect(after.body.imagesPurgedAt ?? null).toBeNull();
      // máy quầy đã cấp: qua cổng thiết bị (đọc nhạy cảm còn cần step-up → 401 REAUTH_REQUIRED, không còn 403)
      const g = await call(
        request,
        'GET',
        `${R}/documents/${doc.id}/sensitive?reason=recheck`,
        dev(fd),
      );
      expect([200, 401]).toContain(g.status);
      expect((g.body as { code?: string }).code).not.toBe('DEVICE_NOT_TRUSTED');
    });

    test('SEC-C3 lưu trữ: số giấy tờ/ngày sinh/địa chỉ không có bản rõ trong DB; ảnh giấy tờ trên đĩa là bản mã (ADR-013)', async ({
      request,
    }) => {
      test.skip(
        !CAN_CLEAN_ROOMS,
        'môi trường: cần stack dùng một lần (E2E_COMPOSE_CONTROL=1) để đọc DB/đĩa trực tiếp',
      );
      await requireEndpoints(request, 'SEC-C3', [EP3.addGuestDocument]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const res = await bookFree(request, fd, c, {
        room: room(c, '103'),
        nights: 2,
        today: await stackToday(request),
      });
      const regId = await registrationOf(request, fd, res);
      const docNumber = fakeCccd();
      const marker = `Hem Danh Dau ${docNumber.slice(-5)}`;
      const add = await addDocument(
        request,
        fd,
        regId,
        vnDoc('Nguyen Thi Ma Hoa', { docNumber, dateOfBirth: '1991-07-23', address: marker }),
        1,
      );
      expect(add.status, JSON.stringify(add.body)).toBe(201);
      // phản hồi chỉ có 4 số cuối
      expect(JSON.stringify(add.body)).not.toContain(docNumber);
      const doc = add.body.documents.find((d) => d.isMain)!;
      expect(doc.docNumberLast4).toBe(docNumber.slice(-4));

      // DB: nguyên dòng guest_document (siêu người dùng, bỏ qua RLS) không chứa bản rõ
      const row = stackSql(
        `SELECT row_to_json(d)::text FROM guest_document d WHERE d.id = '${doc.id}';`,
      ).trim();
      expect(row.length, 'có dòng guest_document').toBeGreaterThan(10);
      for (const plain of [docNumber, marker, '1991-07-23', '23/07/1991']) {
        expect(row.includes(plain), `bản rõ "${plain}" trong guest_document`).toBe(false);
      }
      const r = JSON.parse(row) as Record<string, unknown>;
      expect(r.doc_number_enc, 'doc_number_enc').toBeTruthy();
      expect(r.address_enc, 'address_enc').toBeTruthy();
      expect(r.date_of_birth_enc, 'date_of_birth_enc').toBeTruthy();
      expect(String(r.doc_number_hmac ?? '')).toMatch(/^[0-9a-f]{32,}$/);
      // toàn bộ bảng dữ liệu đăng ký/khai báo không có số giấy tờ ở dạng rõ (cột khác, nhật ký, idempotency)
      const leak = stackSql(
        `SELECT string_agg(t, ',') FROM (
         SELECT 'audit_event' t FROM audit_event WHERE row_to_json(audit_event)::text LIKE '%${docNumber}%'
         UNION ALL SELECT 'idempotency_key' FROM idempotency_key WHERE row_to_json(idempotency_key)::text LIKE '%${docNumber}%'
         UNION ALL SELECT 'c3_access_log' FROM c3_access_log WHERE row_to_json(c3_access_log)::text LIKE '%${docNumber}%'
         UNION ALL SELECT 'registration' FROM registration WHERE row_to_json(registration)::text LIKE '%${docNumber}%'
       ) x;`,
      ).trim();
      expect(leak, `bản rõ số giấy tờ ở bảng: ${leak}`).toBe('');

      // Đĩa: mọi tệp blob không bắt đầu bằng chữ ký ảnh và không chứa chữ ký PNG đầy đủ
      const report = JSON.parse(
        inApi(`
        const fs=require('fs'),p=require('path');
        const root=process.env.BLOBSTORE_LOCAL_PATH||'./.data/blobs';
        const out={root,files:0,plainImage:[]};
        const sig=[Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),Buffer.from([0xff,0xd8,0xff]),Buffer.from('RIFF')];
        const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=p.join(d,e.name);
          if(e.isDirectory())walk(f);else{out.files++;const b=fs.readFileSync(f);
            if(sig.some(s=>b.subarray(0,s.length).equals(s))||b.includes(sig[0]))out.plainImage.push(e.name);}}};
        walk(root);console.log(JSON.stringify(out));`),
      ) as { root: string; files: number; plainImage: string[] };
      expect(report.files, `tệp blob trong ${report.root}`).toBeGreaterThan(0);
      expect(report.plainImage, 'tệp ảnh bản rõ trên đĩa').toEqual([]);
    });
  },
);
