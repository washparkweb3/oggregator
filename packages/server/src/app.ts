import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import websocket from '@fastify/websocket';
import { registerRoutes } from './routes/index.js';
import { bootstrapAdapters } from './adapters.js';
import { bootstrapServices } from './services.js';

let ready = false;

export function isReady() {
  return ready;
}

const isDev = process.env['NODE_ENV'] !== 'production';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        }
      : true,
  });

  await app.register(cors, { origin: true });
  await app.register(websocket);

  registerRoutes(app);

  // Serve the built web SPA in production (single-service deploy)
  const here = dirname(fileURLToPath(import.meta.url));
  const webDist = resolve(here, '../../web/dist');
  if (!isDev && existsSync(webDist)) {
    await app.register(fastifyStatic, { root: webDist, wildcard: false });
    app.setNotFoundHandler((_req, reply) => {
      return reply.sendFile('index.html');
    });
  }

  bootstrapAdapters(app.log).then(() => {
    ready = true;
    bootstrapServices(app.log).catch((err: unknown) => {
      app.log.warn({ err: String(err) }, 'services bootstrap failed');
    });
  });

  return app;
}
