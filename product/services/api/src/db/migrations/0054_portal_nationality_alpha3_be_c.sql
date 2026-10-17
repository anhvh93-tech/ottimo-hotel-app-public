-- 0054 (hand-written, data only – BE-C, Sprint 3 testing step): INV answered ESC-018 – the accommodation
-- declaration portal takes the nationality as the bare upper-case ISO 3166-1 alpha-3 code (e.g. KOR), no
-- country name; dates stay dd/MM/yyyy (already the default). `name_vi_alpha3` remains an allowed value.
-- No schema change: meta/0054_snapshot.json = the 0053 head snapshot with a new id (ARC rule 4.2a-2b).
UPDATE config_parameter_def SET default_value = '"alpha3"'::jsonb WHERE key = 'portal_nationality_format';
