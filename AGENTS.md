# oggregator — Agent Quick Reference

```bash
pnpm dev            # server + web
pnpm typecheck      # all packages
pnpm test           # all tests
pnpm precommit      # typecheck + test (gate)
```

```
packages/core/      Feeds + types + enrichment (see its CLAUDE.md)
packages/server/    Fastify REST API (see its CLAUDE.md)
packages/web/       React dashboard (see its CLAUDE.md)
references/         Official API docs per venue
```

Zod at I/O boundaries. No `any`. No vendor SDKs. Pino logging. IV stored as fractions (0–1+). `pnpm precommit` must pass.
