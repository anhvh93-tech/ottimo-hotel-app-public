// MSW mock of FB-INV-012 §12.3 (OpenAPI 0.3.15-draft) until BE `r5-fb012-golive-be` merges: the property contact
// (address + public hotline) – OWN/MGR/FDL read (S24), OWN writes (A129). Values are made up (no real contact).
import type { PropertyContact, Role } from '@ottimo/api-client';
import { http, HttpResponse, type DefaultBodyType, type StrictRequest } from 'msw';

type Guard = { roles: Role[] } | Response;
interface Ctx {
  guard: (request: StrictRequest<DefaultBodyType>, allowed: Role[] | 'any') => Guard;
  problem: (status: number, code: string, extra?: Record<string, unknown>) => Response;
}

const prop = '*/v1/properties/:propertyId';
const seed = (): PropertyContact => ({
  addressLine: '1 Example Street, Ward 1, Da Lat',
  hotline: '+84000000000',
});
const noStore = (body: PropertyContact) =>
  HttpResponse.json(body as unknown as Record<string, unknown>, {
    headers: { 'cache-control': 'no-store' },
  });

export function createGoLiveMock(ctx: Ctx) {
  let contact = seed();
  const handlers = [
    http.get(`${prop}/contact`, ({ request }) => {
      const g = ctx.guard(request, ['owner', 'manager', 'front_desk_lead']);
      return g instanceof Response ? g : noStore(contact);
    }),
    http.put(`${prop}/contact`, async ({ request }) => {
      const g = ctx.guard(request, ['owner', 'manager', 'front_desk_lead']);
      if (g instanceof Response) return g;
      if (!g.roles.includes('owner')) return ctx.problem(403, 'FORBIDDEN_ACTION');
      const b = (await request.json()) as Partial<PropertyContact>;
      const errors: Array<{ field: string; code: string }> = [];
      const a = typeof b.addressLine === 'string' ? b.addressLine.trim() : null;
      // eslint-disable-next-line no-control-regex
      if (a !== null && (a.length < 5 || a.length > 200 || /[\u0000-\u001f\u007f]/.test(a)))
        errors.push({ field: 'addressLine', code: 'VALIDATION_FAILED' });
      const h = typeof b.hotline === 'string' ? b.hotline.trim() : null;
      if (h !== null && !/^\+?[0-9][0-9 .-]{7,19}$/.test(h))
        errors.push({ field: 'hotline', code: 'VALIDATION_FAILED' });
      if (errors.length) return ctx.problem(422, 'VALIDATION_FAILED', { errors });
      contact = { addressLine: a || null, hotline: h ? h.replace(/[ .-]/g, '') : null };
      return noStore(contact);
    }),
  ];
  return {
    handlers,
    reset() {
      contact = seed();
    },
    get contact() {
      return contact;
    },
  };
}
