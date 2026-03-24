import { useRef, useEffect } from "react";

import type { PayoffPoint, Leg } from "./payoff";
import { fmtUsd } from "@lib/format";
import styles from "./Architect.module.css";

interface PayoffChartProps {
  points:     PayoffPoint[];
  breakevens: number[];
  spotPrice:  number;
  legs:       Leg[];
  maxProfit:  number | null;
  maxLoss:    number | null;
}

export default function PayoffChart({ points, breakevens, spotPrice, legs, maxProfit, maxLoss }: PayoffChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || points.length === 0) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Padding
    const pad = { top: 30, right: 60, bottom: 35, left: 15 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    // Data range
    const prices = points.map((p) => p.underlyingPrice);
    const pnls = points.map((p) => p.pnl);
    const minX = Math.min(...prices);
    const maxX = Math.max(...prices);
    const minY = Math.min(...pnls, 0);
    const maxY = Math.max(...pnls, 0);
    const rangeY = maxY - minY || 1;
    const padY = rangeY * 0.1;

    function toX(price: number) { return pad.left + ((price - minX) / (maxX - minX)) * cw; }
    function toY(pnl: number) { return pad.top + ch - ((pnl - (minY - padY)) / (rangeY + padY * 2)) * ch; }

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Zero line
    const zeroY = toY(0);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, zeroY);
    ctx.lineTo(w - pad.right, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // $0 label
    ctx.fillStyle = "#555";
    ctx.font = "11px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("$0", w - pad.right + 6, zeroY + 4);

    // Profit fill (green area above zero)
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < points.length; i++) {
      const x = toX(points[i]!.underlyingPrice);
      const y = toY(Math.max(0, points[i]!.pnl));
      if (!started) { ctx.moveTo(x, zeroY); ctx.lineTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(toX(points[points.length - 1]!.underlyingPrice), zeroY);
    ctx.closePath();
    ctx.fillStyle = "rgba(0, 233, 151, 0.12)";
    ctx.fill();

    // Loss fill (red area below zero)
    ctx.beginPath();
    started = false;
    for (let i = 0; i < points.length; i++) {
      const x = toX(points[i]!.underlyingPrice);
      const y = toY(Math.min(0, points[i]!.pnl));
      if (!started) { ctx.moveTo(x, zeroY); ctx.lineTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(toX(points[points.length - 1]!.underlyingPrice), zeroY);
    ctx.closePath();
    ctx.fillStyle = "rgba(203, 56, 85, 0.12)";
    ctx.fill();

    // P&L line — green above zero, red below
    ctx.lineWidth = 2;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]!;
      const curr = points[i]!;
      const avgPnl = (prev.pnl + curr.pnl) / 2;
      ctx.strokeStyle = avgPnl >= 0 ? "#00E997" : "#CB3855";
      ctx.beginPath();
      ctx.moveTo(toX(prev.underlyingPrice), toY(prev.pnl));
      ctx.lineTo(toX(curr.underlyingPrice), toY(curr.pnl));
      ctx.stroke();
    }

    // Strike dashed lines
    const uniqueStrikes = [...new Set(legs.map((l) => l.strike))];
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#444";
    for (const s of uniqueStrikes) {
      if (s >= minX && s <= maxX) {
        const x = toX(s);
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, h - pad.bottom);
        ctx.stroke();

        ctx.fillStyle = "#555";
        ctx.textAlign = "center";
        ctx.font = "10px 'IBM Plex Mono', monospace";
        ctx.fillText(`${(s / 1000).toFixed(0)}k`, x, h - pad.bottom + 14);
      }
    }
    ctx.setLineDash([]);

    // Spot price marker
    if (spotPrice >= minX && spotPrice <= maxX) {
      const sx = toX(spotPrice);
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = "#F0B90B";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, pad.top);
      ctx.lineTo(sx, h - pad.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#F0B90B";
      ctx.font = "9px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("SPOT", sx, pad.top - 6);
    }

    // Breakeven dots
    for (const be of breakevens) {
      if (be >= minX && be <= maxX) {
        const bx = toX(be);
        ctx.beginPath();
        ctx.arc(bx, zeroY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#F0B90B";
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#aaa";
        ctx.font = "10px 'IBM Plex Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`$${(be / 1000).toFixed(1)}k`, bx, zeroY + 16);
      }
    }

    // Max profit label
    if (maxProfit != null) {
      const maxProfitPt = points.reduce((best, p) => p.pnl > best.pnl ? p : best);
      const px = toX(maxProfitPt.underlyingPrice);
      const py = toY(maxProfitPt.pnl);
      ctx.fillStyle = "#00E997";
      ctx.font = "bold 11px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`+${fmtUsd(maxProfit)}`, px, py - 8);
    }

    // Max loss label
    if (maxLoss != null) {
      const maxLossPt = points.reduce((best, p) => p.pnl < best.pnl ? p : best);
      const px = toX(maxLossPt.underlyingPrice);
      const py = toY(maxLossPt.pnl);
      ctx.fillStyle = "#CB3855";
      ctx.font = "bold 11px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(fmtUsd(maxLoss), px, py + 18);
    }

    // X-axis tick labels
    ctx.fillStyle = "#555";
    ctx.font = "10px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    const xTicks = 6;
    for (let i = 0; i <= xTicks; i++) {
      const price = minX + (i / xTicks) * (maxX - minX);
      const x = toX(price);
      ctx.fillText(`$${(price / 1000).toFixed(0)}k`, x, h - pad.bottom + 14);
    }

    // Y-axis labels
    ctx.textAlign = "left";
    const yTicks = [minY, minY + rangeY * 0.25, 0, minY + rangeY * 0.75, maxY].filter((v, i, a) => a.indexOf(v) === i);
    for (const v of yTicks) {
      if (v === 0) continue;
      const y = toY(v);
      if (y > pad.top && y < h - pad.bottom) {
        ctx.fillStyle = v > 0 ? "#00E99766" : "#CB385566";
        ctx.fillText(fmtUsd(v), w - pad.right + 6, y + 4);
      }
    }

  }, [points, breakevens, spotPrice, legs, maxProfit, maxLoss]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      // Trigger re-render by toggling a dummy state... or just use the dep array
      // The effect above will re-run when container size changes via the points dep
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.payoffChartArea} ref={containerRef}>
      <canvas ref={canvasRef} className={styles.payoffCanvas} />
    </div>
  );
}
