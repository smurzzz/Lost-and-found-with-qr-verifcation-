-- ============================================================================
-- ClaimIt — Phase 4 (staff logging): unique QR tags
-- ----------------------------------------------------------------------------
-- A partial unique index on items.qr_code guarantees a server-minted FND-xxxxx
-- tag cannot be issued twice (the log-found Edge Function checks before insert;
-- this index is the hard backstop if two calls race).
--
-- Student-reported items keep qr_code NULL until staff confirm receipt
-- (Phase 8 / confirmReceipt), so the partial (WHERE qr_code IS NOT NULL) form
-- leaves those rows untouched.
-- ============================================================================

create unique index if not exists items_qr_code_key
  on items (qr_code)
  where qr_code is not null;