import { useMemo } from "react";

import { useAppStore } from "@stores/app-store";
import { AssetPickerButton, VenuePickerButton, EmptyState } from "@components/ui";
import { useChainQuery, useExpiries } from "@features/chain/queries";
import { fmtUsd, formatExpiry } from "@lib/format";
import { useStrategyStore } from "./strategy-store";
import { computePayoff, computeMetrics, detectStrategy, type Leg } from "./payoff";
import PayoffChart from "./PayoffChart";
import VenueComparison from "./VenueComparison";
import styles from "./Architect.module.css";

function LegRow({ leg, onRemove }: { leg: Leg; onRemove: () => void }) {
  return (
    <div className={styles.legRow} data-direction={leg.direction}>
      <span className={styles.legDirection} data-direction={leg.direction}>
        {leg.direction === "buy" ? "BUY" : "SELL"}
      </span>
      <span className={styles.legQty}>{leg.quantity}×</span>
      <span className={styles.legStrike}>{leg.strike.toLocaleString()}</span>
      <span className={styles.legType} data-type={leg.type}>
        {leg.type === "call" ? "CALL" : "PUT"}
      </span>
      <span className={styles.legExpiry}>{formatExpiry(leg.expiry)}</span>
      <span className={styles.legPrice}>{fmtUsd(leg.entryPrice)}</span>
      <span className={styles.legVenue}>{leg.venue.toUpperCase()}</span>
      <button className={styles.legRemove} onClick={onRemove} title="Remove leg">×</button>
    </div>
  );
}

function MetricsPanel({ legs, spotPrice }: { legs: Leg[]; spotPrice: number }) {
  const metrics = useMemo(() => computeMetrics(legs, spotPrice), [legs, spotPrice]);
  const strategyName = useMemo(() => detectStrategy(legs), [legs]);

  return (
    <div className={styles.metrics}>
      <div className={styles.strategyName}>{strategyName}</div>
      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Net Debit/Credit</span>
          <span className={styles.metricValue} data-positive={metrics.netDebit > 0}>
            {metrics.netDebit > 0 ? "+" : ""}{fmtUsd(metrics.netDebit)}
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Max Profit</span>
          <span className={styles.metricValue} data-positive>
            {metrics.maxProfit != null ? fmtUsd(metrics.maxProfit) : "Unlimited"}
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Max Loss</span>
          <span className={styles.metricValue} data-negative>
            {metrics.maxLoss != null ? fmtUsd(metrics.maxLoss) : "Unlimited"}
          </span>
        </div>
        {metrics.breakevens.length > 0 && (
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Breakeven{metrics.breakevens.length > 1 ? "s" : ""}</span>
            <span className={styles.metricValue}>
              {metrics.breakevens.map((b) => `$${b.toLocaleString()}`).join(", ")}
            </span>
          </div>
        )}
      </div>

      <div className={styles.greeksRow}>
        <span className={styles.greekItem}>
          <span className={styles.greekLabel}>Δ</span>
          {metrics.netDelta != null ? metrics.netDelta.toFixed(3) : "–"}
        </span>
        <span className={styles.greekItem}>
          <span className={styles.greekLabel}>Γ</span>
          {metrics.netGamma != null ? metrics.netGamma.toFixed(5) : "–"}
        </span>
        <span className={styles.greekItem}>
          <span className={styles.greekLabel}>Θ</span>
          {metrics.netTheta != null ? fmtUsd(metrics.netTheta) : "–"}
        </span>
        <span className={styles.greekItem}>
          <span className={styles.greekLabel}>V</span>
          {metrics.netVega != null ? fmtUsd(metrics.netVega) : "–"}
        </span>
      </div>
    </div>
  );
}

export default function ArchitectView() {
  const underlying   = useAppStore((s) => s.underlying);
  const expiry       = useAppStore((s) => s.expiry);
  const activeVenues = useAppStore((s) => s.activeVenues);
  const { data: expiriesData } = useExpiries(underlying);
  const defaultExpiry = expiry || expiriesData?.expiries?.[1] || expiriesData?.expiries?.[0] || "";
  const { data: chain } = useChainQuery(underlying, defaultExpiry, activeVenues);

  const legs      = useStrategyStore((s) => s.legs);
  const clearLegs = useStrategyStore((s) => s.clearLegs);

  const spotPrice = chain?.stats.spotIndexUsd ?? chain?.stats.forwardPriceUsd ?? 0;

  const payoffPoints = useMemo(
    () => computePayoff(legs, spotPrice),
    [legs, spotPrice],
  );

  const metrics = useMemo(
    () => legs.length > 0 ? computeMetrics(legs, spotPrice) : null,
    [legs, spotPrice],
  );

  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.title}>Architect</span>
          <AssetPickerButton />
          <VenuePickerButton />
        </div>
        <span className={styles.subtitle}>
          Build multi-leg strategies and compare execution across venues
        </span>
      </div>

      {legs.length === 0 ? (
        <EmptyState
          icon="⚙"
          title="No legs added"
          detail="Go to the Chain tab and click BID or ASK to add option legs to your strategy."
        />
      ) : (
        <div className={styles.body}>
          <div className={styles.legsPanel}>
            <div className={styles.legsPanelHeader}>
              <span className={styles.sectionTitle}>Legs</span>
              <button className={styles.clearBtn} onClick={clearLegs}>Clear all</button>
            </div>
            {legs.map((leg) => (
              <LegRow
                key={leg.id}
                leg={leg}
                onRemove={() => useStrategyStore.getState().removeLeg(leg.id)}
              />
            ))}
            <MetricsPanel legs={legs} spotPrice={spotPrice} />
          </div>

          <div className={styles.chartPanel}>
            <div className={styles.sectionTitle}>P&L at Expiry</div>
            <PayoffChart
              points={payoffPoints}
              breakevens={metrics?.breakevens ?? []}
              spotPrice={spotPrice}
            />
          </div>

          <VenueComparison legs={legs} chain={chain ?? null} activeVenues={activeVenues} />
        </div>
      )}
    </div>
  );
}
