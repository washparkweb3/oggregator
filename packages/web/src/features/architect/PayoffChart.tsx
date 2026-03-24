import { useRef, useEffect, useState, useCallback } from "react";

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

interface HoverInfo {
  x: number;
  y: number;
  price: number;
  pnl: number;
}

export default function PayoffChart({ points, breakevens, spotPrice, legs, maxProfit, maxLoss }: PayoffChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const dataRef = useRef({ points, breakevens, spotPrice, legs, maxProfit, maxLoss });
  dataRef.current = { points, breakevens, spotPrice, legs, maxProfit, maxLoss };

  const draw = useCallback((hoverInfo: HoverInfo | null = null) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const pts = dataRef.current.points;
    if (pts.length === 0) return;

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

    const { breakevens: bes, spotPrice: spot } = dataRef.current;

    const pad = { top: 24, right: 55, bottom: 28, left: 10 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    const prices = pts.map((p) => p.underlyingPrice);
    const pnls = pts.map((p) => p.pnl);
    const minX = Math.min(...prices);
    const maxX = Math.max(...prices);
    const minY = Math.min(...pnls, 0);
    const maxY = Math.max(...pnls, 0);
    const rangeY = maxY - minY || 1;
    const padY = rangeY * 0.12;

    function toX(price: number) { return pad.left + ((price - minX) / (maxX - minX)) * cw; }
    function toY(pnl: number) { return pad.top + ch - ((pnl - (minY - padY)) / (rangeY + padY * 2)) * ch; }

    ctx.clearRect(0, 0, w, h);

    // Zero line
    const zeroY = toY(0);
    ctx.strokeStyle = "#2A2A2A";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, zeroY);
    ctx.lineTo(w - pad.right, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Profit fill
    ctx.beginPath();
    ctx.moveTo(toX(pts[0]!.underlyingPrice), zeroY);
    for (const p of pts) ctx.lineTo(toX(p.underlyingPrice), toY(Math.max(0, p.pnl)));
    ctx.lineTo(toX(pts[pts.length - 1]!.underlyingPrice), zeroY);
    ctx.closePath();
    ctx.fillStyle = "rgba(0, 233, 151, 0.08)";
    ctx.fill();

    // Loss fill
    ctx.beginPath();
    ctx.moveTo(toX(pts[0]!.underlyingPrice), zeroY);
    for (const p of pts) ctx.lineTo(toX(p.underlyingPrice), toY(Math.min(0, p.pnl)));
    ctx.lineTo(toX(pts[pts.length - 1]!.underlyingPrice), zeroY);
    ctx.closePath();
    ctx.fillStyle = "rgba(203, 56, 85, 0.08)";
    ctx.fill();

    // P&L line
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]!;
      const curr = pts[i]!;
      ctx.strokeStyle = (prev.pnl + curr.pnl) / 2 >= 0 ? "#00E997" : "#CB3855";
      ctx.beginPath();
      ctx.moveTo(toX(prev.underlyingPrice), toY(prev.pnl));
      ctx.lineTo(toX(curr.underlyingPrice), toY(curr.pnl));
      ctx.stroke();
    }

    // Spot marker
    if (spot >= minX && spot <= maxX) {
      const sx = toX(spot);
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = "#F0B90B44";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, pad.top);
      ctx.lineTo(sx, h - pad.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Breakeven dots
    for (const be of bes) {
      if (be >= minX && be <= maxX) {
        const bx = toX(be);
        ctx.beginPath();
        ctx.arc(bx, zeroY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#F0B90B";
        ctx.fill();
      }
    }

    // X-axis labels
    ctx.fillStyle = "#444";
    ctx.font = "10px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    const xTicks = Math.min(6, Math.floor(cw / 80));
    for (let i = 0; i <= xTicks; i++) {
      const price = minX + (i / xTicks) * (maxX - minX);
      ctx.fillText(`$${(price / 1000).toFixed(0)}k`, toX(price), h - 6);
    }

    // Y-axis: just $0, max, min
    ctx.textAlign = "left";
    ctx.fillStyle = "#444";
    ctx.fillText("$0", w - pad.right + 4, zeroY + 4);
    if (maxY > 0) { ctx.fillStyle = "#00E99788"; ctx.fillText(fmtUsd(maxY), w - pad.right + 4, toY(maxY) + 4); }
    if (minY < 0) { ctx.fillStyle = "#CB385588"; ctx.fillText(fmtUsd(minY), w - pad.right + 4, toY(minY) + 4); }

    // Hover crosshair
    if (hoverInfo) {
      const hx = hoverInfo.x;
      const hy = toY(hoverInfo.pnl);

      // Vertical line
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = "#50D2C166";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, pad.top);
      ctx.lineTo(hx, h - pad.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dot on the line
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fillStyle = hoverInfo.pnl >= 0 ? "#00E997" : "#CB3855";
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tooltip
      const tooltipW = 130;
      const tooltipH = 44;
      let tx = hx + 12;
      if (tx + tooltipW > w - 10) tx = hx - tooltipW - 12;
      let ty = hy - tooltipH - 8;
      if (ty < 4) ty = hy + 12;

      ctx.fillStyle = "rgba(10, 10, 10, 0.92)";
      ctx.beginPath();
      ctx.roundRect(tx, ty, tooltipW, tooltipH, 6);
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#888";
      ctx.font = "10px 'IBM Plex Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Price  $${(hoverInfo.price / 1000).toFixed(1)}k`, tx + 8, ty + 16);

      ctx.fillStyle = hoverInfo.pnl >= 0 ? "#00E997" : "#CB3855";
      ctx.font = "bold 12px 'IBM Plex Mono', monospace";
      ctx.fillText(`P&L  ${hoverInfo.pnl >= 0 ? "+" : ""}${fmtUsd(hoverInfo.pnl)}`, tx + 8, ty + 34);
    }
  }, []);

  useEffect(() => {
    draw(hover);
  }, [points, breakevens, spotPrice, legs, maxProfit, maxLoss, hover, draw]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => draw(hover));
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw, hover]);

  // Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const pts = dataRef.current.points;
    if (pts.length === 0) return;

    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const w = rect.width;
    const pad = { left: 10, right: 55 };
    const cw = w - pad.left - pad.right;
    const ratio = (mx - pad.left) / cw;

    if (ratio < 0 || ratio > 1) { setHover(null); return; }

    const idx = Math.round(ratio * (pts.length - 1));
    const pt = pts[Math.max(0, Math.min(pts.length - 1, idx))]!;
    const x = pad.left + ((pt.underlyingPrice - pts[0]!.underlyingPrice) / (pts[pts.length - 1]!.underlyingPrice - pts[0]!.underlyingPrice)) * cw;

    setHover({ x, y: 0, price: pt.underlyingPrice, pnl: pt.pnl });
  }, []);

  const handleMouseLeave = useCallback(() => setHover(null), []);

  return (
    <div className={styles.payoffChartArea} ref={containerRef}>
      <canvas
        ref={canvasRef}
        className={styles.payoffCanvas}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
