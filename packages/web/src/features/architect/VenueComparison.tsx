import type { Leg } from "./payoff";
import type { EnrichedChainResponse } from "@shared/enriched";
import type { VenueId } from "@oggregator/protocol";
import { VENUES } from "@lib/venue-meta";
import { fmtUsd } from "@lib/format";
import styles from "./Architect.module.css";

interface VenueComparisonProps {
  legs:  Leg[];
  chain: EnrichedChainResponse | null;
  activeVenues: string[];
}

interface VenueCost {
  venue:    string;
  totalCost: number;
  available: boolean;
  perLeg:   Array<{ legId: string; price: number | null }>;
}

export default function VenueComparison({ legs, chain, activeVenues }: VenueComparisonProps) {
  if (!chain || legs.length === 0) return null;

  const venueCosts: VenueCost[] = activeVenues.map((venueId) => {
    let totalCost = 0;
    let allAvailable = true;
    const perLeg: VenueCost["perLeg"] = [];

    for (const leg of legs) {
      const strike = chain.strikes.find((s) => s.strike === leg.strike);
      const side = leg.type === "call" ? strike?.call : strike?.put;
      const q = side?.venues[venueId as VenueId];

      const price = leg.direction === "buy" ? q?.ask : q?.bid;
      if (price == null) {
        allAvailable = false;
        perLeg.push({ legId: leg.id, price: null });
      } else {
        const legCost = leg.direction === "buy" ? -price * leg.quantity : price * leg.quantity;
        totalCost += legCost;
        perLeg.push({ legId: leg.id, price });
      }
    }

    return { venue: venueId, totalCost, available: allAvailable, perLeg };
  });

  const validCosts = venueCosts.filter((v) => v.available);
  const bestVenue = validCosts.length > 0
    ? validCosts.reduce((best, v) => v.totalCost > best.totalCost ? v : best)
    : null;

  return (
    <div className={styles.venueComparison}>
      <div className={styles.sectionTitle}>Venue Comparison</div>
      <div className={styles.venueGrid}>
        {venueCosts.map((vc) => {
          const meta = VENUES[vc.venue];
          const isBest = bestVenue?.venue === vc.venue;
          return (
            <div
              key={vc.venue}
              className={styles.venueCard}
              data-best={isBest || undefined}
              data-unavailable={!vc.available || undefined}
            >
              <div className={styles.venueCardHeader}>
                {meta?.logo && <img src={meta.logo} className={styles.venueCardLogo} alt="" />}
                <span className={styles.venueCardName}>{meta?.label ?? vc.venue}</span>
                {isBest && <span className={styles.bestBadge}>BEST</span>}
              </div>
              <div className={styles.venueCardCost}>
                {vc.available
                  ? <span data-positive={vc.totalCost > 0}>{vc.totalCost > 0 ? "+" : ""}{fmtUsd(vc.totalCost)}</span>
                  : <span className={styles.unavailable}>N/A</span>
                }
              </div>
              <div className={styles.venueCardLabel}>
                {vc.available
                  ? (vc.totalCost > 0 ? "net credit" : "net debit")
                  : "missing quotes"
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
