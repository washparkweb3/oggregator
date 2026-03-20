# @oggregator/server — Quick Reference

```bash
pnpm dev            # hot reload on :3100
pnpm build          # tsc
pnpm typecheck      # tsc --noEmit
```

```
GET /api/health          → service status
GET /api/venues          → registered venue IDs
GET /api/underlyings     → base assets across venues
GET /api/expiries        → expiry dates (query: underlying)
GET /api/chains          → enriched cross-venue chain (query: underlying, expiry, venues?)
GET /api/surface         → IV surface grid (query: underlying)
```

Imports from `@oggregator/core` only. Returns 503 until adapters ready.
