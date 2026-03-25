import type { FastifyInstance } from 'fastify';
import { getRegisteredVenues } from '@oggregator/core';
import { currentReadinessStatus, isTrafficReady } from '../readiness.js';
import { isBlockFlowReady, isDvolReady, isFlowReady, isSpotReady } from '../services.js';

export async function healthRoute(app: FastifyInstance) {
  app.get('/health', async () => ({
    status: currentReadinessStatus(),
    venues: getRegisteredVenues(),
    services: {
      flow: isFlowReady(),
      dvol: isDvolReady(),
      spot: isSpotReady(),
      blockFlow: isBlockFlowReady(),
    },
    ts: Date.now(),
  }));

  app.get('/ready', async (_req, reply) => {
    if (!isTrafficReady()) {
      return reply.status(503).send({ status: currentReadinessStatus() });
    }
    return { status: 'ok' };
  });
}
