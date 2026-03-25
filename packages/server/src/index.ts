import 'dotenv/config';
import type { FastifyInstance } from 'fastify';
import { buildApp, startShutdown } from './app.js';

const PORT = Number(process.env['PORT'] ?? 3100);

async function main() {
  const app = await buildApp();
  registerShutdownHandlers(app);
  await app.listen({ port: PORT, host: '0.0.0.0' });
}

function registerShutdownHandlers(app: FastifyInstance) {
  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    startShutdown();
    app.log.info({ signal }, 'shutdown requested');

    try {
      await app.close();
      process.exit(0);
    } catch (err: unknown) {
      app.log.error({ err }, 'graceful shutdown failed');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Fatal: ${message}\n`);
  process.exit(1);
});
