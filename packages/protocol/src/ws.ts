import { z } from 'zod';

// ── Venue primitives ──────────────────────────────────────────────

export const VENUE_IDS = ['deribit', 'okx', 'bybit', 'binance', 'derive'] as const;
export type VenueId = (typeof VENUE_IDS)[number];

export const VenueIdSchema = z.enum(VENUE_IDS);

export type VenueConnectionState = 'connected' | 'polling' | 'reconnecting' | 'degraded' | 'down';

/** Browser-side socket lifecycle — distinct from venue health */
export type WsConnectionState = 'connecting' | 'live' | 'reconnecting' | 'stale' | 'error' | 'closed';

// ── Subscription request ──────────────────────────────────────────

export const WsSubscriptionRequestSchema = z.object({
  underlying: z.string().min(1),
  expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  venues: z.array(VenueIdSchema).min(1),
});

export type WsSubscriptionRequest = z.infer<typeof WsSubscriptionRequestSchema>;

// ── Snapshot metadata ─────────────────────────────────────────────

export const SnapshotMetaSchema = z.object({
  generatedAt: z.number(),
  maxQuoteTs: z.number(),
  staleMs: z.number(),
});

export type SnapshotMeta = z.infer<typeof SnapshotMetaSchema>;

// ── Venue failure ─────────────────────────────────────────────────

export const VenueFailureSchema = z.object({
  venue: VenueIdSchema,
  reason: z.string(),
});

export type VenueFailure = z.infer<typeof VenueFailureSchema>;

// ── Client → Server ───────────────────────────────────────────────

export const ClientWsMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subscribe'),
    subscriptionId: z.string().min(1),
    request: WsSubscriptionRequestSchema,
  }),
  z.object({
    type: z.literal('unsubscribe'),
  }),
]);

export type ClientWsMessage = z.infer<typeof ClientWsMessageSchema>;

// ── Server → Client ──────────────────────────────────────────────

const VenueStateSchema = z.enum(['connected', 'polling', 'reconnecting', 'degraded', 'down']);

export const ServerWsMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subscribed'),
    subscriptionId: z.string(),
    request: WsSubscriptionRequestSchema,
    serverTime: z.number(),
    failedVenues: z.array(VenueFailureSchema).optional(),
  }),
  z.object({
    type: z.literal('snapshot'),
    subscriptionId: z.string(),
    seq: z.number(),
    request: WsSubscriptionRequestSchema,
    meta: SnapshotMetaSchema,
    data: z.unknown(),
  }),
  z.object({
    type: z.literal('status'),
    subscriptionId: z.string(),
    venue: VenueIdSchema,
    state: VenueStateSchema,
    ts: z.number(),
    message: z.string().optional(),
  }),
  z.object({
    type: z.literal('error'),
    subscriptionId: z.string().nullable(),
    code: z.string(),
    message: z.string(),
    retryable: z.boolean(),
  }),
]);

export type ServerWsMessage = z.infer<typeof ServerWsMessageSchema>;
