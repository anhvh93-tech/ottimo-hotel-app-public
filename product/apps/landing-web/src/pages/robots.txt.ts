import type { APIRoute } from 'astro';
import { INDEXABLE, SITE_URL } from '../lib/i18n';
import { robotsTxt } from '../lib/robots';

export const GET: APIRoute = () =>
  new Response(robotsTxt(INDEXABLE, SITE_URL), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
