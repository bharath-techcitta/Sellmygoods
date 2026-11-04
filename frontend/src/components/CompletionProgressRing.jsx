import React, { useState, useEffect, useRef } from 'react';

/**
 * Circular completion indicator — animates percent up/down when target changes.
 */
export default function CompletionProgressRing({
  targetPercent = 0,
  size = 42,
  ringColor = '#432177',
  trackColor = '#e6e6e9',
  durationMs = 600,
  showPercentInCenter = true,
  label = 'Completion Progress',
  showLabels = true,
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef({ from: 0, startTime: 0 });

  useEffect(() => {
    const target = Math.max(0, Math.min(100, Math.round(targetPercent)));
    const from = display;
    startRef.current = { from, startTime: performance.now() };

    const tick = (now) => {
      const { from: startVal, startTime } = startRef.current;
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      const value = Math.round(startVal + (target - startVal) * eased);
      setDisplay(value);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from last rendered display
  }, [targetPercent, durationMs]);

  const stroke = Math.max(3, size * 0.12);
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (display / 100) * circ;

  const ring = (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
        />
      </svg>
      {showPercentInCenter && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size <= 44 ? 11 : 14,
            fontWeight: 700,
            color: '#242424',
          }}
        >
          {display}
        </div>
      )}
    </div>
  );

  if (!showLabels) return ring;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} role="status" aria-live="polite" aria-label={`${label}: ${display} percent ready`}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: '#73767b' }}>{label}</div>
        <strong style={{ fontSize: 14, color: '#432177' }}>{display}% Ready</strong>
      </div>
      {ring}
    </div>
  );
}
