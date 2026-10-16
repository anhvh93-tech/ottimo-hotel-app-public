#!/usr/bin/env node
// Generates src/generated/openapi-meta.ts from docs/api/openapi.yaml (contract-first, coding-standards 7):
//   - per operation: method, path, x-roles, x-rbac, x-scope, Idempotency-Key / If-Match declared,
//     x-requires-trusted-device, x-step-up, x-guest-level, public (security: [])
//   - Problem.code -> HTTP status table from info.description ("Mã lỗi")
//   - setParameter.x-security-parameters (SEC hard bounds)
// and src/generated/openapi-schemas.ts: response shapes for the role serializer (SR-AZ-04) –
//   per component schema the declared properties with x-visible-to / x-rbac-field / writeOnly / C3, and per
//   operation the JSON schema of each 2xx response.
// The api reads authorisation from this file, never from hand-written role lists.
// The Docker build does not read docs/, so the output is committed; `--check` (run by
// test/openapi-meta.test.ts) fails when the committed file is stale.
//
//   node scripts/gen-openapi-meta.mjs          write the file
//   node scripts/gen-openapi-meta.mjs --check  exit 1 when the file differs from the spec
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parse } from 'yaml';

const here = dirname(fileURLToPath(import.meta.url));
const apiDir = join(here, '..');
const specPath = join(apiDir, '..', '..', 'docs', 'api', 'openapi.yaml');
const outPath = join(apiDir, 'src', 'generated', 'openapi-meta.ts');
const schemasOutPath = join(apiDir, 'src', 'generated', 'openapi-schemas.ts');
const METHODS = ['get', 'put', 'post', 'patch', 'delete'];

function refName(p) {
  return typeof p?.$ref === 'string' ? p.$ref.split('/').pop() : undefined;
}

function headerNames(op, pathItem, spec) {
  const params = [...(pathItem.parameters ?? []), ...(op.parameters ?? [])];
  const names = new Set();
  for (const p of params) {
    const resolved = refName(p) ? spec.components?.parameters?.[refName(p)] : p;
    if (resolved?.in === 'header') names.add(String(resolved.name).toLowerCase());
  }
  return names;
}

/** The JSON request body declares a `dryRun` property (tính thử – SEC-BE-21: only these may skip headers). */
function supportsDryRun(op, spec) {
  let schema = op.requestBody?.content?.['application/json']?.schema;
  const seen = new Set();
  while (schema && refName(schema) && !seen.has(refName(schema))) {
    seen.add(refName(schema));
    schema = spec.components?.schemas?.[refName(schema)];
  }
  const parts = [schema, ...(schema?.allOf ?? [])].map((x) =>
    refName(x) ? spec.components?.schemas?.[refName(x)] : x,
  );
  return parts.some((x) => x?.properties?.dryRun !== undefined);
}

export function buildMeta(spec) {
  const operations = {};
  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of METHODS) {
      const op = pathItem[method];
      if (!op) continue;
      if (!op.operationId) throw new Error(`${method.toUpperCase()} ${path} has no operationId`);
      if (operations[op.operationId]) throw new Error(`duplicate operationId ${op.operationId}`);
      const headers = headerNames(op, pathItem, spec);
      operations[op.operationId] = {
        method: method.toUpperCase(),
        path,
        roles: op['x-roles'] ?? [],
        rbac: op['x-rbac'] ?? [],
        ...(op['x-scope'] !== undefined ? { scope: op['x-scope'] } : {}),
        idempotencyKey: headers.has('idempotency-key'),
        ifMatch: headers.has('if-match'),
        ...(supportsDryRun(op, spec) ? { dryRun: true } : {}),
        trustedDevice: op['x-requires-trusted-device'] === true,
        stepUp: op['x-step-up'] === true,
        ...(op['x-guest-level'] !== undefined ? { guestLevel: op['x-guest-level'] } : {}),
        public: Array.isArray(op.security) && op.security.length === 0,
        c3Log: op['x-c3-log'] !== undefined,
      };
    }
  }

  const problemCodes = {};
  const description = spec.info?.description ?? '';
  for (const line of description.split('\n')) {
    const m = /^\s*\|\s*([A-Z][A-Z0-9_]+)\s*\|\s*(\d{3})\s*\|/.exec(line);
    if (m) problemCodes[m[1]] = Number(m[2]);
  }
  if (Object.keys(problemCodes).length === 0) throw new Error('no Problem.code table found');

  let securityParameters = {};
  for (const pathItem of Object.values(spec.paths ?? {})) {
    for (const method of METHODS) {
      const op = pathItem[method];
      if (op?.operationId === 'setParameter')
        securityParameters = op['x-security-parameters'] ?? {};
    }
  }
  return { version: spec.info?.version, operations, problemCodes, securityParameters };
}

// ───────────── Response shapes for the role serializer (SR-AZ-04, coding-standards 7.7) ─────────────
// Shape kinds: any (free value) · scalar · ref (component schema) · array · object (declared props; `open`
// = additionalProperties allowed, `extra` = shape of additional values) · union (oneOf/anyOf of mixed kinds).
// Property flags: v = x-visible-to roles, f = x-rbac-field code, w = writeOnly, c3 = x-classification C3.

function resolveComponent(spec, schema) {
  const name = typeof schema?.$ref === 'string' ? schema.$ref.split('/').pop() : undefined;
  return name ? spec.components?.schemas?.[name] : schema;
}

function propFlags(node) {
  const flags = {};
  if (Array.isArray(node?.['x-visible-to'])) flags.v = node['x-visible-to'];
  if (typeof node?.['x-rbac-field'] === 'string') flags.f = node['x-rbac-field'];
  if (node?.writeOnly === true) flags.w = true;
  if (node?.['x-classification'] === 'C3') flags.c3 = true;
  return flags;
}

function intersectVisible(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a.filter((r) => b.includes(r));
}

function mergeObjects(shapes) {
  const props = {};
  let open = shapes.length > 0;
  let extra;
  for (const sh of shapes) {
    for (const [k, p] of Object.entries(sh.props)) {
      const prev = props[k];
      if (!prev) props[k] = p;
      else {
        // Same property in two branches: keep the stricter visibility and flags.
        const v = intersectVisible(prev.v, p.v);
        props[k] = {
          ...prev,
          ...p,
          ...(v ? { v } : {}),
          ...(prev.w || p.w ? { w: true } : {}),
          ...(prev.c3 || p.c3 ? { c3: true } : {}),
        };
      }
    }
    open = open && sh.open;
    if (sh.extra) extra = sh.extra;
  }
  return { k: 'object', props, open, ...(extra ? { extra } : {}) };
}

function shapeOf(spec, schema, depth = 0) {
  if (!schema || typeof schema !== 'object') return { k: 'any' };
  if (depth > 40) throw new Error('schema nesting too deep');
  if (typeof schema.$ref === 'string') {
    const name = schema.$ref.split('/').pop();
    if (!spec.components?.schemas?.[name]) throw new Error(`unknown schema ${schema.$ref}`);
    return { k: 'ref', name };
  }
  if (Array.isArray(schema.allOf)) {
    const parts = schema.allOf.map((s) => objectView(spec, s, depth + 1));
    const own = schema.properties
      ? [objectView(spec, { ...schema, allOf: undefined }, depth + 1)]
      : [];
    const merged = mergeObjects([...parts, ...own].filter(Boolean));
    // allOf is closed unless every part is open.
    return merged;
  }
  const branches = schema.oneOf ?? schema.anyOf;
  if (Array.isArray(branches)) {
    const views = branches.map((s) => objectView(spec, s, depth + 1));
    if (views.every(Boolean)) return mergeObjects(views);
    return { k: 'union', of: branches.map((s) => shapeOf(spec, s, depth + 1)) };
  }
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (types.includes('array') || schema.items) {
    return { k: 'array', items: shapeOf(spec, schema.items, depth + 1) };
  }
  if (types.includes('object') || schema.properties || schema.additionalProperties !== undefined) {
    const props = {};
    for (const [k, node] of Object.entries(schema.properties ?? {})) {
      props[k] = { s: shapeOf(spec, node, depth + 1), ...propFlags(node) };
    }
    const ap = schema.additionalProperties;
    const hasProps = Object.keys(props).length > 0;
    const open =
      ap === true || (ap === undefined && !hasProps) || (typeof ap === 'object' && ap !== null);
    const extra = typeof ap === 'object' && ap !== null ? shapeOf(spec, ap, depth + 1) : undefined;
    return { k: 'object', props, open, ...(extra ? { extra } : {}) };
  }
  if (types.length === 0 && !schema.enum && !schema.format && !schema.const) return { k: 'any' };
  return { k: 'scalar' };
}

/** Object view of a schema (resolving component refs) for allOf/oneOf merging; null when not an object. */
function objectView(spec, schema, depth) {
  const target = resolveComponent(spec, schema);
  if (!target) return null;
  const sh = shapeOf(spec, target, depth);
  return sh.k === 'object' ? sh : null;
}

export function buildSchemas(spec) {
  const schemas = {};
  for (const [name, schema] of Object.entries(spec.components?.schemas ?? {})) {
    schemas[name] = shapeOf(spec, schema);
  }
  const responses = {};
  for (const [, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of METHODS) {
      const op = pathItem[method];
      if (!op) continue;
      const out = {};
      for (const [status, resp] of Object.entries(op.responses ?? {})) {
        if (!/^2\d\d$/.test(status)) continue;
        const resolved =
          typeof resp?.$ref === 'string'
            ? spec.components?.responses?.[resp.$ref.split('/').pop()]
            : resp;
        const json = resolved?.content?.['application/json'];
        if (json?.schema) out[status] = shapeOf(spec, json.schema);
      }
      if (Object.keys(out).length > 0) responses[op.operationId] = out;
    }
  }
  return { schemas, responses };
}

export async function renderSchemas(spec) {
  const { version } = spec.info ?? {};
  const data = buildSchemas(spec);
  const src = `// GENERATED by scripts/gen-openapi-meta.mjs from docs/api/openapi.yaml ${version} – do not edit.
// Response shapes for the role serializer (src/shared/serialization, SR-AZ-04).
import type { OpenApiSchemas } from '../shared/openapi-types';

export const OPENAPI_SCHEMAS: OpenApiSchemas = ${JSON.stringify(data)};
`;
  const require = createRequire(import.meta.url);
  const prettier = require('prettier');
  const config = (await prettier.resolveConfig(schemasOutPath)) ?? {};
  return prettier.format(src, { ...config, parser: 'typescript' });
}

export async function render(spec) {
  const meta = buildMeta(spec);
  const src = `// GENERATED by scripts/gen-openapi-meta.mjs from docs/api/openapi.yaml ${meta.version} – do not edit.
// Regenerate: pnpm --filter @ottimo/api gen:openapi (test/openapi-meta.test.ts fails when stale).
import type { OpenApiMeta } from '../shared/openapi-types';

export const OPENAPI_META: OpenApiMeta = ${JSON.stringify(meta)};
`;
  const require = createRequire(import.meta.url);
  const prettier = require('prettier');
  const config = (await prettier.resolveConfig(outPath)) ?? {};
  return prettier.format(src, { ...config, parser: 'typescript' });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const spec = parse(readFileSync(specPath, 'utf8'));
  const outputs = [
    [outPath, await render(spec)],
    [schemasOutPath, await renderSchemas(spec)],
  ];
  if (process.argv.includes('--check')) {
    let stale = false;
    for (const [path, out] of outputs) {
      let current = '';
      try {
        current = readFileSync(path, 'utf8');
      } catch {
        current = '';
      }
      if (current !== out) {
        console.error(`${path} is stale – run: pnpm --filter @ottimo/api gen:openapi`);
        stale = true;
      }
    }
    if (stale) process.exit(1);
    console.log('openapi-meta.ts and openapi-schemas.ts are up to date');
  } else {
    for (const [path, out] of outputs) {
      writeFileSync(path, out);
      console.log(`wrote ${path}`);
    }
  }
}
