# @oggregator/server

Fastify REST API. Bootstraps venue adapters from `@oggregator/core`, serves enriched chain data.

## Commands

```bash
pnpm dev            # tsx watch on :3100 (hot reload)
pnpm build          # tsc
pnpm start          # node dist/index.js
pnpm typecheck      # tsc --noEmit
```

## Structure

```
src/
  index.ts           Entry point (PORT from env, default 3100)
  app.ts             Fastify factory, plugin registration, adapter bootstrap
  adapters.ts        Instantiates + registers all 5 venue adapters
  routes/
    health.ts        GET /api/health
    venues.ts        GET /api/venues
    underlyings.ts   GET /api/underlyings
    expiries.ts      GET /api/expiries?underlying=BTC
    chains.ts        GET /api/chains?underlying=BTC&expiry=2026-03-28&venues=deribit,okx
    surface.ts       GET /api/surface?underlying=BTC
```

## Non-obvious decisions

- **Adapters bootstrap async after server starts** — routes return 503 via `isReady()` check until adapters finish loading (~5-15s). Server accepts connections immediately while feeds connect in the background.

- **Server imports only from `@oggregator/core` package root** — never from internal feeds/core paths. If something is needed, it must be exported from core's `index.ts`.

- **New venues need zero route changes** — add the adapter in `adapters.ts`, call `registerAdapter()`, all routes pick it up via `getAllAdapters()`.

- **Auto-subscribes on first request** — `chains.ts` calls `ensureSubscribed()` per venue/underlying on first `/api/chains` request, opening WS connections lazily.

- **Enrichment happens per request** — each `/api/chains` call rebuilds the enriched response from the current QuoteStore. No caching layer between store and response.
