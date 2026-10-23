-- Row counts + money totals recorded with every backup (infra/server/bin/backup.sh, in the SAME snapshot as pg_dump)
-- and recomputed by the restore drill (restore-drill.sh) on the restored database: they must be equal (R3 v1.0 –
-- "kiểm số đơn/folio"). Only numbers – no personal data. Run as the database superuser (RLS does not hide rows).
SELECT 'migrations', count(*) FROM drizzle.__drizzle_migrations
UNION ALL SELECT 'properties', count(*) FROM property
UNION ALL SELECT 'users', count(*) FROM app_user
UNION ALL SELECT 'reservations', count(*) FROM reservation
UNION ALL SELECT 'guests', count(*) FROM guest
UNION ALL SELECT 'folios', count(*) FROM folio
UNION ALL SELECT 'folio_lines', count(*) FROM folio_line
UNION ALL SELECT 'folio_lines_sum_vnd', coalesce(sum(amount_vnd), 0) FROM folio_line
UNION ALL SELECT 'payments', count(*) FROM payment
UNION ALL SELECT 'payments_sum_vnd', coalesce(sum(amount_vnd), 0) FROM payment
UNION ALL SELECT 'data_keys_live', count(*) FROM data_key WHERE destroyed_at IS NULL
UNION ALL SELECT 'purge_journal', count(*) FROM purge_journal;
