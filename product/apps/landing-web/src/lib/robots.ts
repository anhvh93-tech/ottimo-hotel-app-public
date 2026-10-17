// robots.txt (ADR-014 5): production allows everything except the API paths and points to the sitemap;
// a preview build (default until gate LP-v1) disallows everything (US-146 AC4).
export function robotsTxt(indexable: boolean, siteUrl: string): string {
  if (!indexable) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\nDisallow: /v1/\n\nSitemap: ${siteUrl}/sitemap-index.xml\n`;
}
