/**
 * Minimal multipart/form-data parser over the raw body buffer (no dependency, no temp files – SR-FILE-04:
 * uploads stay in memory until they are re-encoded and encrypted). Fastify hands the body as a Buffer
 * (content-type parser registered in http.ts with a body limit of MULTIPART_BODY_LIMIT); larger bodies are
 * refused by Fastify with 413 before they reach a handler.
 *
 * Only what the contract uses: `Content-Disposition: form-data; name="…"; filename="…"` and an optional
 * `Content-Type` per part. The client file name is never kept (random names – SR-FILE-04).
 */
import { problem } from '../../../shared/problem';

export { MULTIPART_BODY_LIMIT } from '../../../http';
const MAX_PARTS = 12;
const MAX_TEXT_PART = 64 * 1024;

export interface MultipartPart {
  name: string;
  /** Present for file parts (value not kept – only "is a file"). */
  isFile: boolean;
  contentType: string | null;
  data: Buffer;
}

function boundaryOf(contentType: string | undefined): string | null {
  if (!contentType || !/^multipart\/form-data\s*;/i.test(contentType)) return null;
  const m = /boundary=(?:"([^"]{1,70})"|([^\s;]{1,70}))/i.exec(contentType);
  return m ? (m[1] ?? m[2] ?? null) : null;
}

function invalid(): never {
  throw problem('VALIDATION_FAILED', { errors: [{ field: 'body', code: 'VALIDATION_FAILED' }] });
}

export function parseMultipart(body: unknown, contentType: string | undefined): MultipartPart[] {
  const boundary = boundaryOf(contentType);
  if (!boundary || !Buffer.isBuffer(body)) invalid();
  const delimiter = Buffer.from(`--${boundary}`);
  const parts: MultipartPart[] = [];
  let pos = body.indexOf(delimiter);
  if (pos < 0) invalid();
  for (;;) {
    pos += delimiter.length;
    // "--" right after the delimiter = closing boundary.
    if (body[pos] === 0x2d && body[pos + 1] === 0x2d) break;
    if (body[pos] === 0x0d && body[pos + 1] === 0x0a) pos += 2;
    else invalid();
    const headerEnd = body.indexOf('\r\n\r\n', pos);
    if (headerEnd < 0) invalid();
    const headers = body.subarray(pos, headerEnd).toString('latin1');
    const next = body.indexOf(Buffer.concat([Buffer.from('\r\n'), delimiter]), headerEnd + 4);
    if (next < 0) invalid();
    const data = body.subarray(headerEnd + 4, next);
    const disposition = /^content-disposition:\s*form-data\s*;(.*)$/im.exec(headers)?.[1] ?? '';
    const name = /(?:^|;)\s*name="([^"]{1,64})"/i.exec(disposition)?.[1];
    if (!name) invalid();
    const isFile = /(?:^|;)\s*filename\*?=/i.test(disposition);
    const ct = /^content-type:\s*([^\r\n;]+)/im.exec(headers)?.[1]?.trim().toLowerCase() ?? null;
    if (!isFile && data.length > MAX_TEXT_PART) invalid();
    parts.push({ name, isFile, contentType: ct, data });
    if (parts.length > MAX_PARTS) {
      throw problem('FILE_REJECTED', { errors: [{ field: name, code: 'TOO_MANY_FILES' }] });
    }
    pos = next + 2;
  }
  return parts;
}

/** Text value of a non-file part (UTF-8), or undefined. */
export function textPart(parts: MultipartPart[], name: string): string | undefined {
  const p = parts.find((x) => x.name === name && !x.isFile);
  return p ? p.data.toString('utf8') : undefined;
}

/** File parts with this field name (`image`, `file`), in order. */
export function fileParts(parts: MultipartPart[], name: string): Buffer[] {
  return parts.filter((x) => x.name === name).map((x) => x.data);
}
