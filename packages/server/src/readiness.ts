import { isReady, isShuttingDown } from './app.js';
import { isBlockFlowReady, isFlowReady, isSpotReady } from './services.js';

export function isTrafficReady(): boolean {
  return isReady() && isSpotReady() && isFlowReady() && isBlockFlowReady();
}

export function currentReadinessStatus(): 'ok' | 'initializing' | 'stopping' {
  if (isShuttingDown()) return 'stopping';
  return isTrafficReady() ? 'ok' : 'initializing';
}
