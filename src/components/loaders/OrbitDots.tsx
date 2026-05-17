/**
 * OrbitDots
 *
 * Four dots orbit a center point while pending.
 * On fulfilled → dots collapse inward to center, then a check pops out.
 * On rejected  → dots fly outward and fade, center flashes red ✕.
 *
 * The "collapse inward" physics feel is what makes this satisfying.
 */

import { useEffect } from 'react';
import type { PromiseStatus } from '@/types';
import { injectStyles } from '../../styles/keyframes';

export interface OrbitDotsProps {
  status: PromiseStatus;
  size?: number;
  color?: string;
  errorColor?: string;
  dotCount?: number;
  className?: string;
  style?: React.CSSProperties;
}

function s(obj: Record<string, string | number | undefined>): React.CSSProperties {
  return obj as React.CSSProperties;
}

export function OrbitDots({
  status,
  size = 56,
  color = '#6C63FF',
  errorColor = '#EF4444',
  dotCount = 4,
  className = '',
  style = {},
}: OrbitDotsProps) {
  useEffect(() => { injectStyles(); }, []);

  const isPending   = status === 'pending';
  const isFulfilled = status === 'fulfilled';
  const isRejected  = status === 'rejected';

  const cx       = size / 2;
  const cy       = size / 2;
  const radius   = size * 0.33;
  const dotR     = size * 0.09;
  const orbitDur = 1.8; // seconds per revolution

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-label={
        isPending ? 'Loading…' : isFulfilled ? 'Done' : isRejected ? 'Error' : ''
      }
      style={s({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        position: 'relative',
        ...style,
      })}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        overflow="visible"
      >
        {/* ── Orbit trail (faint ring) — only while pending ── */}
        {isPending && (
          <circle
            cx={cx} cy={cx} r={radius}
            stroke={color}
            strokeWidth={1}
            strokeOpacity={0.1}
            fill="none"
            strokeDasharray="4 4"
          />
        )}

        {/* ── Orbiting dots ── */}
        {Array.from({ length: dotCount }).map((_, i) => {
          const angle     = (i / dotCount) * 360;              // degrees
          const angleRad  = (angle * Math.PI) / 180;
          const dotX      = cx + radius * Math.cos(angleRad);
          const dotY      = cy + radius * Math.sin(angleRad);

          // Each dot has a staggered breathe delay
          const breatheDelay = (i / dotCount) * 0.8;

          let dotStyle: React.CSSProperties = {};

          if (isPending) {
            // Orbit: rotate the whole group, dot is positioned at radius offset
            dotStyle = {
              transformOrigin: `${cx}px ${cy}px`,
              animation: `tsl-orbit ${orbitDur}s linear ${-i * (orbitDur / dotCount)}s infinite,
                          tsl-dot-breathe 0.8s ease-in-out ${breatheDelay}s infinite`,
            };
          } else if (isFulfilled) {
            // Collapse inward to center
            dotStyle = {
              transformOrigin: `${cx}px ${cy}px`,
              animation: `tsl-orbit-collapse 0.4s var(--tsl-ease-snap) ${i * 0.04}s forwards`,
              ['--angle' as string]: `${angle}deg`,
              ['--radius' as string]: `${radius}px`,
            };
          } else if (isRejected) {
            // Fly outward
            const flyDist = size * 0.85;
            const fx = cx + flyDist * Math.cos(angleRad);
            const fy = cy + flyDist * Math.sin(angleRad);
            dotStyle = {
              transition: `transform ${0.3 + i * 0.04}s var(--tsl-ease-snap), opacity 0.3s ease`,
              transform: `translate(${fx - dotX}px, ${fy - dotY}px)`,
              opacity: 0,
            };
          }

          return (
            <circle
              key={i}
              cx={dotX}
              cy={dotY}
              r={dotR}
              fill={isRejected ? errorColor : color}
              opacity={isPending ? 1 : undefined}
              style={dotStyle}
            />
          );
        })}

        {/* ── Center dot (always present while pending) ── */}
        {isPending && (
          <circle
            cx={cx} cy={cy} r={dotR * 0.5}
            fill={color}
            opacity={0.4}
          />
        )}

        {/* ── Check (fulfilled) ── */}
        {isFulfilled && (() => {
          const pad = size * 0.22;
          const mid = size * 0.55;
          return (
            <>
              {/* Filled circle background */}
              <circle
                cx={cx} cy={cy} r={size * 0.38}
                fill={color}
                style={s({
                  animation: 'tsl-center-pop 0.45s var(--tsl-ease-spring) 0.3s both',
                })}
              />
              <polyline
                points={`${pad},${mid} ${cx - size*0.02},${size - pad} ${size - pad},${pad}`}
                stroke="white"
                strokeWidth={size * 0.075}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="60"
                strokeDashoffset="60"
                fill="none"
                style={s({
                  animation: 'tsl-check-draw 0.35s var(--tsl-ease-spring) 0.6s forwards',
                })}
              />
            </>
          );
        })()}

        {/* ── Error × (rejected) ── */}
        {isRejected && (() => {
          const pad = size * 0.28;
          return (
            <>
              <circle
                cx={cx} cy={cy} r={size * 0.38}
                fill={errorColor}
                style={s({
                  animation: 'tsl-center-pop 0.4s var(--tsl-ease-spring) 0.25s both',
                })}
              />
              <line
                x1={pad} y1={pad}
                x2={size - pad} y2={size - pad}
                stroke="white"
                strokeWidth={size * 0.075}
                strokeLinecap="round"
                strokeDasharray="30"
                strokeDashoffset="30"
                style={s({
                  animation: 'tsl-cross-draw 0.22s var(--tsl-ease-snap) 0.4s forwards',
                })}
              />
              <line
                x1={size - pad} y1={pad}
                x2={pad} y2={size - pad}
                stroke="white"
                strokeWidth={size * 0.075}
                strokeLinecap="round"
                strokeDasharray="30"
                strokeDashoffset="30"
                style={s({
                  animation: 'tsl-cross-draw 0.22s var(--tsl-ease-snap) 0.5s forwards',
                })}
              />
              {/* Shake */}
              <g
                style={s({
                  animation: isRejected
                    ? 'tsl-error-shake 0.5s var(--tsl-ease-smooth) 0.6s'
                    : 'none',
                })}
              />
            </>
          );
        })()}
      </svg>

      {/* ── Pulse ring on success ── */}
      {isFulfilled && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          animation: 'tsl-pulse-ring 0.7s ease-out 0.4s both',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}
