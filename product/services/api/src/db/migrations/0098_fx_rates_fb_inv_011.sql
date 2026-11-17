-- 0098 (BE, R5 – FB-INV-011, INV 17/11; contract rounds/round-05/fb-inv-011/contract.md). Number: 0096 is retired
-- (ARC 04/11), 0097 is PR #172 (V5-17) – provisional, ORC confirms; `when` = 0095 + 4000 so 0097 can go before it.
-- No schema change: the snapshot is 0095's (pattern 0064/0067/0071/0073). Two catalogue keys (erd 9.3) of the landing price estimate in the
-- currency of the page language (EN USD, KO KRW, ZH CNY, RU RUB – VND stays the price and the payment):
--   * `fx_rates.vietcombank` (json, OWN – read on the Desk; WRITTEN BY THE WORKER ONLY: setParameter → 403 by the
--     public-site hook) – `{asOf, publishedAt, rates:{USD,KRW,CNY,RUB}}`, Vietcombank SELL rates (VND for 1 unit),
--     job `fx.refresh` once a day. Default `{}` = no rate yet (the landing shows VND only).
--   * `fx_rate_overrides` (json, OWN only) – `{"USD": 25500}`: OWN's rate for a code (allowlist USD/KRW/CNY/RUB, sanity
--     band per code – public-site hook), effective-dated like every key (source `manual` on the web; ≤ 7 days old
--     from its effectiveFrom, then the Vietcombank rate again). Default `{}` = no override.
-- Both have a catalogue default, so the production bootstrap writes no row (production-defaults.ts unchanged).
-- The bill's USD reference keeps `fx_usd_vnd` (BR-004, OWN/MGR typed) – not changed here.
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('fx_rates.vietcombank', 'json', '{owner}', 'BR-004', false, NULL, '{}'::jsonb),
  ('fx_rate_overrides', 'json', '{owner}', 'BR-004', false, NULL, '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
