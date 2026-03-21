# oggregator — Roadmap & Status

Last updated from code: 2026-03-21

## Tier 1 — Core Chain Data ✅ COMPLETE

| Feature | Backend | Frontend | Status |
|---|---|---|---|
| 1.1 Index price in LiveQuote | ✅ All 5 adapters | ✅ Shown in stats | Done |
| 1.2 Enriched chain response | ✅ `GET /api/chains` | ✅ Chain tab | Done |
| 1.3 ATM IV per expiry | ✅ In chain stats | ✅ StatStrip | Done |
| 1.4 25-delta skew | ✅ In chain stats | ✅ StatStrip | Done |
| 1.5 IV Surface grid | ✅ `GET /api/surface` | ✅ Surface tab + asset picker | Done |
| 1.6 GEX per strike | ✅ In chain response | ✅ GEX tab + asset/expiry pickers | Done |
| 1.7 Term structure | ✅ In surface response | ✅ Surface header | Done |

## Tier 2 — Live Market Data ✅ COMPLETE

| Feature | Backend | Frontend | Status |
|---|---|---|---|
| 2.1 IVR via Deribit DVOL | ✅ `DvolService` | ✅ StatStrip shows IVR + 52w range | Done |
| 2.2 Flow monitor | ✅ `FlowService` 9 assets | ✅ Flow tab with flash/whale/block | Done |
| 2.3 24h spot change | ✅ `SpotService` 9 assets | ✅ ExpiryBar arrow + StatStrip | Done |
| 2.4 ATM IV 1d change | ✅ In DVOL stats | ✅ StatStrip IV Δ1d | Done |

## Tier 3 — Advanced

| Feature | Backend | Frontend | Status |
|---|---|---|---|
| 3.1 GEX dealer model | ✅ Standard model | ✅ GEX chart | Done |
| 3.2 Flow signal interpretation | — | — | Skipped (v1 shows raw data) |
| 3.3 DVOL history chart | ✅ `GET /api/dvol-history` | ❌ Needs chart component | **Next** |
| 3.4 Option strategy builder | ✅ Execution cost engine exists | ❌ Not wired to UI | **Next** |

## Data Quality & Reliability ✅ VERIFIED

- Cross-venue audit tool: `pnpm tsx src/scripts/audit-venues.ts BTC 2026-03-27`
- Last audit: **472/472 checks pass** across Deribit, OKX, Binance, Bybit, Derive
- Deribit: live `deribit_price_index` subscription for real-time USD conversion
- Deribit: all expiries eagerly subscribed (live bid/ask from boot)
- Binance: zero bid/ask and -1 IV sentinels filtered to null
- Derive: phantom quotes (bid=ask, OI=0) excluded from bestVenue
- Derive: ghost expiries (no ticker data) pruned at adapter layer

## What's Next

### Tier 4 — Historical & Analytics

| Feature | Data source | Status |
|---|---|---|
| Historical volatility (HV) line on DVOL chart | Deribit `public/get_historical_volatility` — 384 hourly HV snapshots, BTC+ETH | Ready to build |
| Cross-venue 24h volume aggregation | All 5 venues have public 24h volume in their ticker endpoints | Ready to build |
| Volume by expiry chart | OKX Rubik `open-interest-volume-expiry` — pre-aggregated | Ready to build |
| Volume by strike chart | OKX Rubik `open-interest-volume-strike` — pre-aggregated | Ready to build |
| Historical price klines | Deribit `get_tradingview_chart_data`, Binance `/eapi/v1/klines`, Bybit `/v5/market/kline` | Ready to build |
| Block trade feed | Binance `/eapi/v1/blockTrades`, already in Flow (Bybit BT flag, Derive rfq_id) | Partially done |

### Tier 5 — Strategy Builder

| Feature | Status |
|---|---|
| Execution cost engine | ✅ Built (`features/builder/compute-execution.ts`) |
| Per-venue cost comparison | ✅ Built (`features/builder/OptionBuilder.tsx`) |
| Strategy presets (straddle, strangle, spread) | Not started |
| Multi-leg P&L chart | Not started |
| Custom leg builder UI | Not started |

## Architecture

```
5 exchanges → WebSocket adapters → quoteStore → enrichment → REST/WS API → React frontend

Adapters:     Deribit, OKX, Binance, Bybit, Derive
Services:     DvolService, SpotService, FlowService
Endpoints:    /chains, /surface, /flow, /stats, /dvol-history, /expiries, /underlyings
WebSocket:    /ws/chain (live push to browser)
Frontend:     Chain, Surface, Flow (LIVE), GEX (PRO) tabs
```

## Venue Coverage

| Asset | Deribit | OKX | Binance | Bybit | Derive |
|---|---|---|---|---|---|
| BTC | ✅ | ✅ | ✅ | ✅ | ✅ |
| ETH | ✅ | ✅ | ✅ | ✅ | ✅ |
| SOL | ✅ (USDC) | — | ✅ | ✅ | ✅ |
| DOGE | — | — | ✅ | ✅ | — |
| XRP | ✅ (USDC) | — | ✅ | ✅ | — |
| BNB | — | — | ✅ | — | — |
| AVAX | ✅ (USDC) | — | — | — | — |
| TRX | ✅ (USDC) | — | — | — | — |
| HYPE | — | — | — | — | ✅ |
