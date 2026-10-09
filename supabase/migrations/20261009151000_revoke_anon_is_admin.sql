-- Exposing the `personal` schema made personal.is_admin() callable by anon through /rest/v1/rpc.
-- Anon never needs it (no anon policy uses it); authenticated keeps it because admin RLS policies call it.

revoke execute on function personal.is_admin() from public, anon;
