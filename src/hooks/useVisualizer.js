import { useEffect, useRef } from 'react';
import { useStore } from '../store';

// ─── Water (original) ────────────────────────────────────────────────────────
function drawWater(ctx, w, h, t, isPlaying, particles) {
  ctx.fillStyle = '#000a22';
  ctx.fillRect(0, 0, w, h);

  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.55);
  grad.addColorStop(0, `rgba(25,70,220,${isPlaying ? 0.45 : 0.22})`);
  grad.addColorStop(0.5, `rgba(10,40,150,${isPlaying ? 0.25 : 0.12})`);
  grad.addColorStop(1, 'rgba(0,8,34,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    const baseY = h * (0.22 + i * 0.09);
    const amp = (isPlaying ? 38 : 18) * (1 - i * 0.1);
    const freq = 0.006 + i * 0.0018;
    const phase = t * (1.0 + i * 0.35);
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= w; x += 2) {
      const y =
        baseY +
        Math.sin(x * freq + phase) * amp +
        Math.sin(x * freq * 2.3 + phase * 0.7) * amp * 0.3 +
        Math.cos(x * freq * 0.5 + phase * 1.3) * amp * 0.15;
      ctx.lineTo(x, y);
    }
    const a = (0.22 - i * 0.025) * (isPlaying ? 1 : 0.6);
    ctx.strokeStyle = `rgba(${70 + i * 28},${120 + i * 22},255,${a})`;
    ctx.lineWidth = 2.5 - i * 0.25;
    ctx.stroke();
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = `rgba(${12 + i * 10},${35 + i * 12},${200 - i * 8},${0.03 * (isPlaying ? 1 : 0.5)})`;
    ctx.fill();
  }

  const bandY = h * 0.48 + Math.sin(t * 0.7) * 15;
  const bandGrad = ctx.createLinearGradient(0, bandY - 50, 0, bandY + 50);
  bandGrad.addColorStop(0, 'rgba(80,160,255,0)');
  bandGrad.addColorStop(0.5, `rgba(130,190,255,${isPlaying ? 0.12 : 0.04})`);
  bandGrad.addColorStop(1, 'rgba(80,160,255,0)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY - 50, w, 100);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const speed = isPlaying ? 1 : 0.3;
    p.x += p.vx * speed;
    p.y += p.vy * speed;
    if (p.x < 0) p.x = 1;
    if (p.x > 1) p.x = 0;
    if (p.y < 0) p.y = 1;
    if (p.y > 1) p.y = 0;
    const px = p.x * w;
    const py = p.y * h;
    const pulse = p.alpha * (0.6 + 0.4 * Math.sin(t * 2.5 + p.hue * 0.1));
    ctx.beginPath();
    ctx.arc(px, py, p.size * (isPlaying ? 1.6 : 1.1), 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue},85%,75%,${pulse * (isPlaying ? 1 : 0.55)})`;
    ctx.fill();
  }

  if (isPlaying) {
    const br = 60 + Math.sin(t * 3.5) * 25;
    const burstGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, br);
    burstGrad.addColorStop(0, 'rgba(180,210,255,0.25)');
    burstGrad.addColorStop(0.6, 'rgba(80,140,255,0.08)');
    burstGrad.addColorStop(1, 'rgba(40,80,200,0)');
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, br, 0, Math.PI * 2);
    ctx.fillStyle = burstGrad;
    ctx.fill();
  }
}

// ─── Bars ─────────────────────────────────────────────────────────────────────
function drawBars(ctx, w, h, t, isPlaying, barHeights) {
  ctx.fillStyle = '#000a1a';
  ctx.fillRect(0, 0, w, h);

  const count = barHeights.length;
  const gap = 2;
  const barW = Math.max(2, (w - gap * (count + 1)) / count);
  const maxH = h * 0.85;

  for (let i = 0; i < count; i++) {
    const target = isPlaying
      ? (0.15 + 0.85 * Math.pow(Math.abs(Math.sin(t * (1.2 + i * 0.18) + i * 0.4)), 1.5))
      : 0.05 + 0.08 * Math.abs(Math.sin(t * 0.4 + i * 0.3));
    barHeights[i] += (target - barHeights[i]) * 0.12;
    const bh = barHeights[i] * maxH;
    const x = gap + i * (barW + gap);
    const y = h - bh;

    const grad = ctx.createLinearGradient(0, y, 0, h);
    grad.addColorStop(0, isPlaying ? '#00e5ff' : '#2266aa');
    grad.addColorStop(0.5, isPlaying ? '#0088cc' : '#114466');
    grad.addColorStop(1, '#001133');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW, bh);

    // peak cap
    if (isPlaying && barHeights[i] > 0.3) {
      ctx.fillStyle = 'rgba(160,240,255,0.9)';
      ctx.fillRect(x, y - 2, barW, 2);
    }
  }

  // grid lines
  ctx.strokeStyle = 'rgba(0,80,160,0.25)';
  ctx.lineWidth = 1;
  for (let row = 1; row <= 4; row++) {
    const y = h - (row / 4) * maxH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

// ─── Scope ────────────────────────────────────────────────────────────────────
function drawScope(ctx, w, h, t, isPlaying) {
  ctx.fillStyle = '#000a14';
  ctx.fillRect(0, 0, w, h);

  // grid
  ctx.strokeStyle = 'rgba(0,100,60,0.2)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(0, (h / 4) * i); ctx.lineTo(w, (h / 4) * i); ctx.stroke();
    ctx.beginPath(); ctx.moveTo((w / 4) * i, 0); ctx.lineTo((w / 4) * i, h); ctx.stroke();
  }

  const amp = isPlaying ? h * 0.32 : h * 0.12;
  const freq = isPlaying ? 2.8 : 1.2;

  // glow pass
  ctx.shadowBlur = 14;
  ctx.shadowColor = isPlaying ? '#00ff88' : '#00aa55';
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  for (let x = 0; x <= w; x += 1.5) {
    const phase = t * 3.5;
    const y =
      h / 2 +
      Math.sin((x / w) * Math.PI * 2 * freq + phase) * amp +
      Math.sin((x / w) * Math.PI * 2 * freq * 2.1 + phase * 0.7) * amp * 0.25;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = isPlaying ? 'rgba(0,255,136,0.85)' : 'rgba(0,180,90,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ─── Alchemy ──────────────────────────────────────────────────────────────────
function drawAlchemy(ctx, w, h, t, isPlaying) {
  ctx.fillStyle = `rgba(4,0,16,${isPlaying ? 0.18 : 0.35})`;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const rings = 6;
  const speed = isPlaying ? 1 : 0.3;

  for (let r = 0; r < rings; r++) {
    const radius = (r + 1) * (Math.min(w, h) * 0.07);
    const points = 5 + r * 2;
    const spin = t * speed * (0.3 + r * 0.15) * (r % 2 === 0 ? 1 : -1);
    const hue = (r * 55 + t * 20) % 360;
    const alpha = isPlaying ? 0.6 - r * 0.07 : 0.25 - r * 0.03;

    ctx.beginPath();
    for (let p = 0; p <= points; p++) {
      const angle = (p / points) * Math.PI * 2 + spin;
      const wobble = radius + Math.sin(t * 2 + r + p) * radius * 0.12;
      const px = cx + Math.cos(angle) * wobble;
      const py = cy + Math.sin(angle) * wobble;
      p === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = `hsla(${hue},90%,65%,${alpha})`;
    ctx.lineWidth = isPlaying ? 1.8 : 1;
    ctx.stroke();

    if (isPlaying) {
      ctx.fillStyle = `hsla(${hue},90%,40%,0.04)`;
      ctx.fill();
    }
  }

  // center glow
  const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, isPlaying ? 40 : 20);
  cGrad.addColorStop(0, `rgba(200,140,255,${isPlaying ? 0.6 : 0.2})`);
  cGrad.addColorStop(1, 'rgba(100,0,200,0)');
  ctx.fillStyle = cGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, isPlaying ? 40 : 20, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Starfield ────────────────────────────────────────────────────────────────
function drawStarfield(ctx, w, h, t, isPlaying, stars) {
  ctx.fillStyle = `rgba(0,2,16,${isPlaying ? 0.2 : 0.4})`;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const speed = isPlaying ? 3.5 : 0.8;

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    s.z -= speed;
    if (s.z <= 0) {
      s.x = (Math.random() - 0.5) * w;
      s.y = (Math.random() - 0.5) * h;
      s.z = w;
      s.px = s.x;
      s.py = s.y;
    }
    const sx = (s.x / s.z) * w + cx;
    const sy = (s.y / s.z) * h + cy;
    const spx = (s.px / (s.z + speed)) * w + cx;
    const spy = (s.py / (s.z + speed)) * h + cy;
    const size = Math.max(0.3, (1 - s.z / w) * 3.5);
    const brightness = (1 - s.z / w);
    const hue = (s.hue + t * 15) % 360;
    ctx.beginPath();
    ctx.moveTo(spx, spy);
    ctx.lineTo(sx, sy);
    ctx.strokeStyle = `hsla(${hue},70%,${60 + brightness * 40}%,${brightness * (isPlaying ? 0.9 : 0.5)})`;
    ctx.lineWidth = size;
    ctx.stroke();
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useVisualizer(canvasRef, isActive) {
  const animFrameRef = useRef(null);
  const particlesRef = useRef([]);
  const barHeightsRef = useRef([]);
  const starsRef = useRef([]);
  const timeRef = useRef(0);

  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;

    // Init particles (water)
    particlesRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.003, vy: (Math.random() - 0.5) * 0.003,
      size: Math.random() * 2.5 + 0.5, alpha: Math.random() * 0.6 + 0.2,
      hue: Math.random() * 50 + 195,
    }));

    // Init bars
    barHeightsRef.current = Array.from({ length: 32 }, () => Math.random() * 0.1);

    // Init starfield
    starsRef.current = Array.from({ length: 160 }, () => ({
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 600,
      z: Math.random() * 800,
      px: 0, py: 0,
      hue: Math.random() * 60 + 180,
    }));

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const draw = () => {
      const isPlaying = useStore.getState().isPlaying;
      const vizName = useStore.getState().visualizer;
      const speed = isPlaying ? 1 : 0.3;
      timeRef.current += 0.016 * speed;
      const t = timeRef.current;

      switch (vizName) {
        case 'bars':
          drawBars(ctx, w, h, t, isPlaying, barHeightsRef.current);
          break;
        case 'scope':
          drawScope(ctx, w, h, t, isPlaying);
          break;
        case 'alchemy':
          drawAlchemy(ctx, w, h, t, isPlaying);
          break;
        case 'starfield':
          drawStarfield(ctx, w, h, t, isPlaying, starsRef.current);
          break;
        default:
          drawWater(ctx, w, h, t, isPlaying, particlesRef.current);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [canvasRef, isActive]);
}
