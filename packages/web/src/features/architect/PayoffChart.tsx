import { useRef, useEffect } from "react";
import { createChart, LineSeries, type IChartApi, ColorType } from "lightweight-charts";

import type { PayoffPoint } from "./payoff";
import styles from "./Architect.module.css";

interface PayoffChartProps {
  points:     PayoffPoint[];
  breakevens: number[];
  spotPrice:  number;
}

export default function PayoffChart({ points, breakevens, spotPrice }: PayoffChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApi = useRef<IChartApi | null>(null);

  useEffect(() => {
    const container = chartRef.current;
    if (!container || points.length === 0) return;

    if (chartApi.current) {
      chartApi.current.remove();
      chartApi.current = null;
    }

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#555B5E",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
      },
      grid: { vertLines: { color: "#1A1A1A" }, horzLines: { color: "#1A1A1A" } },
      rightPriceScale: {
        borderColor: "#1F2937",
        scaleMargins: { top: 0.15, bottom: 0.15 },
      },
      timeScale: {
        borderColor: "#1F2937",
        tickMarkFormatter: (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`,
      },
      crosshair: {
        horzLine: { color: "#50D2C1", labelBackgroundColor: "#0E3333" },
        vertLine: { color: "#50D2C1", labelBackgroundColor: "#0E3333", labelVisible: false },
      },
      handleScale: { mouseWheel: true, pinch: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    });

    // Zero line
    const zeroSeries = chart.addSeries(LineSeries, {
      color: "#333",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    zeroSeries.setData(
      [points[0]!, points[points.length - 1]!].map((p) => ({
        time: p.underlyingPrice as unknown as number,
        value: 0,
      })) as never,
    );

    // P&L line with color based on profit/loss zones
    const profitPoints = points.map((p) => ({
      time: p.underlyingPrice as unknown as number,
      value: p.pnl,
      color: p.pnl >= 0 ? "#00E997" : "#CB3855",
    }));

    const pnlSeries = chart.addSeries(LineSeries, {
      lineWidth: 2,
      priceFormat: { type: "custom", formatter: (p: number) => `$${p.toFixed(0)}` },
      lastValueVisible: false,
      priceLineVisible: false,
    });
    pnlSeries.setData(profitPoints as never);

    chart.timeScale().fitContent();
    chartApi.current = chart;

    return () => {
      chart.remove();
      chartApi.current = null;
    };
  }, [points, spotPrice, breakevens]);

  return (
    <div className={styles.payoffChartArea}>
      <div className={styles.payoffChartWrap} ref={chartRef} />
    </div>
  );
}
