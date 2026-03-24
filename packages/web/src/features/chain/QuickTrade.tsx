import type { EnrichedSide } from "@shared/enriched";
import { VENUES } from "@lib/venue-meta";
import { fmtUsd, fmtIv } from "@lib/format";
import { useStrategyStore } from "@features/architect/strategy-store";
import { useAppStore } from "@stores/app-store";
import styles from "./QuickTrade.module.css";

interface QuickTradeProps {
  strike:    number;
  type:      "call" | "put";
  direction: "buy" | "sell";
  side:      EnrichedSide;
  onClose:   () => void;
}

export default function QuickTrade({ strike, type, direction, side, onClose }: QuickTradeProps) {
  const addLeg = useStrategyStore((s) => s.addLeg);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const activeTab = useAppStore((s) => s.activeTab);
  const expiry = useAppStore((s) => s.expiry);
  const activeVenues = useAppStore((s) => s.activeVenues);

  const venues = Object.entries(side.venues)
    .filter(([v]) => activeVenues.includes(v))
    .map(([venueId, q]) => {
      if (!q) return null;
      const price = direction === "buy" ? q.ask : q.bid;
      const oppositePrice = direction === "buy" ? q.bid : q.ask;
      const spreadCost = price != null && oppositePrice != null ? Math.abs(price - oppositePrice) / 2 : null;
      const size = direction === "buy" ? q.askSize : q.bidSize;
      return {
        venueId, price, spreadCost, size,
        iv: q.markIv, delta: q.delta, gamma: q.gamma, theta: q.theta, vega: q.vega,
        spreadPct: q.spreadPct,
      };
    })
    .filter(Boolean)
    .filter((v) => v!.price != null && v!.price > 0)
    .sort((a, b) => {
      if (direction === "buy") return (a!.price ?? Infinity) - (b!.price ?? Infinity);
      return (b!.price ?? 0) - (a!.price ?? 0);
    }) as Array<{
      venueId: string; price: number; spreadCost: number | null; size: number | null;
      iv: number | null; delta: number | null; gamma: number | null;
      theta: number | null; vega: number | null; spreadPct: number | null;
    }>;

  const isOnArchitect = activeTab === "architect";

  function handleAdd(v: typeof venues[0]) {
    addLeg({
      type, direction, strike, expiry, quantity: 1,
      entryPrice: v.price, venue: v.venueId,
      delta: v.delta, gamma: v.gamma, theta: v.theta, vega: v.vega, iv: v.iv,
    });
    if (!isOnArchitect) {
      setActiveTab("architect");
    }
    onClose();
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.direction} data-direction={direction}>
            {direction === "buy" ? "BUY" : "SELL"}
          </span>
          <span className={styles.strike}>{strike.toLocaleString()}</span>
          <span className={styles.type} data-type={type}>{type === "call" ? "CALL" : "PUT"}</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div className={styles.venueList}>
        {venues.map((v, i) => {
          const meta = VENUES[v.venueId];
          const isBest = i === 0;
          return (
            <div key={v.venueId} className={styles.venueCard} data-best={isBest || undefined}>
              <div className={styles.venueCardHeader}>
                {meta?.logo && <img src={meta.logo} className={styles.venueLogo} alt="" />}
                <span className={styles.venueName}>{meta?.label ?? v.venueId}</span>
                {isBest && <span className={styles.bestTag}>BEST</span>}
                <span className={styles.venuePrice}>{fmtUsd(v.price)}</span>
              </div>

              <div className={styles.venueDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>IV</span>
                  <span className={styles.detailValue}>{v.iv != null ? fmtIv(v.iv) : "–"}</span>
                  <span className={styles.detailLabel}>Spread</span>
                  <span className={styles.detailValue}>{v.spreadPct != null ? `${v.spreadPct.toFixed(1)}%` : "–"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Delta</span>
                  <span className={styles.detailValue}>{v.delta?.toFixed(3) ?? "–"}</span>
                  <span className={styles.detailLabel}>Size</span>
                  <span className={styles.detailValue}>{v.size != null ? v.size.toFixed(1) : "–"}</span>
                </div>
                {v.spreadCost != null && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Spread cost</span>
                    <span className={styles.detailValue}>{fmtUsd(v.spreadCost)}</span>
                  </div>
                )}
              </div>

              <button className={styles.addBtn} onClick={() => handleAdd(v)}>
                {isOnArchitect ? "+ Add Leg" : "+ Architect"}
              </button>
            </div>
          );
        })}
        {venues.length === 0 && (
          <div className={styles.empty}>No quotes available for this option</div>
        )}
      </div>
    </div>
  );
}
