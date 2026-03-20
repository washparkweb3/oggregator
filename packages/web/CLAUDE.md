# @oggregator/web

Vite 8 + React 19 + TypeScript SPA. Multi-venue crypto options dashboard.

## Commands

```bash
pnpm dev          # dev server on :5173 (proxies /api → :3100)
pnpm build        # tsc --noEmit && vite build
pnpm typecheck    # tsc --noEmit
```

## Structure — feature-first

```
src/
  features/
    chain/          Main view: cross-venue option chain with stats, expiry tabs
    surface/        IV surface heatmap (expiry × delta grid)
    gex/            Gamma exposure bar chart per strike
    builder/        Execution cost calculator (not yet wired into app)
    debug/          Raw JSON view for development (not mounted)
  components/
    ui/             IvChip, SpreadPill, VenueDot, CommandPalette, Tabs
    layout/         AppShell, TopBar
  lib/              query-client, http, format, colors, venue-meta, token-meta
  stores/           Zustand (UI state only: underlying, expiry, activeTab, venues, myIv)
  shared-types/     Types mirroring core enrichment output (kept in sync manually)
  styles/           CSS tokens, reset, base theme
  assets/           Token + venue SVG/PNG logos
```

## Non-obvious decisions

- **State split**: TanStack Query v5 = server state (chain data, surface data). Zustand v5 = UI state (selected underlying, active tab, venue filter). Never mix these.

- **3s polling via `refetchInterval`**: Frontend polls `/api/chains` every 3 seconds. Backend has real-time WS data — the polling is the latency bottleneck. Server→browser WS push is planned to eliminate this.

- **Shared types are manually synced**: `shared-types/enriched.ts` mirrors `core/enrichment.ts`. No package dependency between web and core — the types are duplicated intentionally to keep the web package independent.

- **IV displayed as percentage**: `fmtIv()` does `value × 100`. Backend stores IV as fractions (0.50 = 50%). This means the value arriving from the API should always be a fraction.

- **Path aliases synced in two places**: `tsconfig.json` paths AND `vite.config.ts` resolve.alias. If you add one, update both.

- **CSS Modules throughout**: every component has a `.module.css` file. Zero global class names except in `styles/`.

## Don't

- Don't use `process.env` — use `import.meta.env.VITE_*`
- Don't store API data in Zustand — that's TanStack Query's job
- Don't fetch with raw `useEffect` + `useState` — use TanStack Query
- Don't use `const enum` (breaks `isolatedModules`)
- Don't import from another feature's internals — only from its `index.ts`
