-- 0073 (BE-A, R2 Sprint 4 tuần Ổn định – number from ORC 18/10). No schema change: the snapshot is 0072's (pattern
-- 0064/0067/0071). BR-525 (DOM 18/10 – G-4): the due date of a debt the system records itself (a receipt
-- reversed after check-out – CheckoutService.debtAfterReversal) = business date + `debt_default_due_days`.
-- Catalogue key (erd 9, OWN + MGR like the other business keys): default 3 (DOM 18/10, BR-525 + BR section 13 –
-- [GIẢ ĐỊNH – chờ INV]), bounds 1–30 =
-- the bound of a due date typed at B18 (BA EP03-05 5.5, `DEBT_MAX_DAYS`). A property changes it with
-- setParameter (config_parameter row); without a row the default applies.
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value)
VALUES ('debt_default_due_days', 'int', '{owner,manager}', 'BR-525', false, '{"min":1,"max":30}'::jsonb,
        '3'::jsonb)
ON CONFLICT (key) DO NOTHING;
