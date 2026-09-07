DELETE FROM correction_reports
WHERE delete_after IS NOT NULL
  AND delete_after <= unixepoch('now') * 1000;

PRAGMA optimize;
