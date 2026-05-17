/**
 * MorphSpinner
 *
 * A spinning arc that seamlessly morphs into:
 *   fulfilled → solid filled circle + animated checkmark (white on green)
 *   rejected  → solid filled circle + animated × cross (white on red)
 *
 * The transition is the feature. The ring "swallows" itself and the
 * background fills inward as a circle, then the icon draws on top.
 * Zero external dependencies. Pure SVG + CSS animations.
 */

import React, { useEffect, useRef } from 'react';
import type { PromiseStatus } from '@/types';
import { injectStyles } from '../../styles/keyframes';

export interface MorphSpinnerProps {
  status: PromiseStatus;
  size?: number;
  /** Primary color — used for the spinner ring and success fill */
  color?: string;
  /** Error fill color */
  errorColor?: string;
  /** Stroke width of the ring */
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Helper: inline style object (avoids className collisions in host apps)
function s(styles: Record<string, string | number>): React.CSSProperties {
  return styles as React.CSSProperties;
}

export function MorphSpinner({
  status,
  size = 56,
  color = '#6C63FF',
  errorColor = '#EF4444',
  strokeWidth = 4,
  className = '',
  style = {},
}: MorphSpinnerProps) {
  useEffect(() => { injectStyles(); }, []);

  const svgRef = useRef<SVGSVGElement>(null);
  const r = (size / 2) - strokeWidth;            // ring radius
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;         // ≈ 251 at r=40

  const isPending   = status === 'pending';
  const isFulfilled = status === 'fulfilled';
  const isRejected  = status === 'rejected';
  const isSettled   = isFulfilled || isRejected;

  const fillColor = isRejected ? errorColor : color;

  // Check path: a tick scaled to size
  const checkScale = size / 56;
  const checkPoints = {
    x1: cx - 9 * checkScale,
    y1: cx + 0.5 * checkScale,
    x2: cx - 2.5 * checkScale,
    y2: cx + 7 * checkScale,
    x3: cx + 10 * checkScale,
    y3: cx - 7 * checkScale,
  };

  return (
    <div
      className={className}
      style={s({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        position: 'relative',
        ...style,
      })}
      role="status"
      aria-live="polite"
      aria-label={
        isPending ? 'Loading…' :
        isFulfilled ? 'Done' :
        isRejected ? 'Failed' : ''
      }
    >
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        style={s({
          // Shake on error
          animation: isRejected
            ? 'tsl-error-shake 0.5s var(--tsl-ease-smooth) forwards'
            : 'none',
        })}
      >
        {/* ── Background fill circle (expands on settle) ── */}
        {isSettled && (
          <circle
            cx={cx}
            cy={cx}
            fill={fillColor}
            style={s({
              animation: 'tsl-bg-fill 0.4s var(--tsl-ease-smooth) forwards',
              transformOrigin: `${cx}px ${cx}px`,
            })}
          />
        )}

        {/* ── Spinning arc (pending) ── */}
        {!isSettled && (
          <g
            style={s({
              transformOrigin: `${cx}px ${cx}px`,
              animation: isPending
                ? 'tsl-spin 0.9s linear infinite'
                : 'none',
            })}
          >
            {/* Track ring (faint) */}
            <circle
              cx={cx}
              cy={cx}
              r={r}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeOpacity={0.15}
            />
            {/* Active arc */}
            <circle
              cx={cx}
              cy={cx}
              r={r}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.72} ${circumference * 0.28}`}
              strokeDashoffset={0}
              transform={`rotate(-90, ${cx}, ${cx})`}
            />
          </g>
        )}

        {/* ── Ring collapse on settle ── */}
        {isSettled && (
          <circle
            cx={cx}
            cy={cx}
            r={r}
            stroke={fillColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            style={s({
              animation: 'tsl-ring-shrink 0.35s var(--tsl-ease-snap) forwards',
              transformOrigin: `${cx}px ${cx}px`,
            })}
          />
        )}

        {/* ── Checkmark (fulfilled) ── */}
        {isFulfilled && (
          <polyline
            points={`${checkPoints.x1},${checkPoints.y1} ${checkPoints.x2},${checkPoints.y2} ${checkPoints.x3},${checkPoints.y3}`}
            stroke="white"
            strokeWidth={strokeWidth * 1.1}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="50"
            strokeDashoffset="50"
            fill="none"
            style={s({
              animation: 'tsl-check-draw 0.35s var(--tsl-ease-spring) 0.35s forwards',
            })}
          />
        )}

        {/* ── × cross (rejected) ── */}
        {isRejected && (() => {
          const pad = size * 0.27;
          return (
            <>
              <line
                x1={pad} y1={pad}
                x2={size - pad} y2={size - pad}
                stroke="white"
                strokeWidth={strokeWidth * 1.1}
                strokeLinecap="round"
                strokeDasharray="30"
                strokeDashoffset="30"
                style={s({
                  animation: 'tsl-cross-draw 0.25s var(--tsl-ease-snap) 0.35s forwards',
                })}
              />
              <line
                x1={size - pad} y1={pad}
                x2={pad} y2={size - pad}
                stroke="white"
                strokeWidth={strokeWidth * 1.1}
                strokeLinecap="round"
                strokeDasharray="30"
                strokeDashoffset="30"
                style={s({
                  animation: 'tsl-cross-draw 0.25s var(--tsl-ease-snap) 0.45s forwards',
                })}
              />
            </>
          );
        })()}
      </svg>

      {/* ── Pulse ring on settle ── */}
      {isSettled && (
        <div
          style={s({
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `2px solid ${fillColor}`,
            animation: 'tsl-pulse-ring 0.6s var(--tsl-ease-smooth) 0.2s forwards',
            opacity: 0,
            pointerEvents: 'none',
          })}
        />
      )}
    </div>
  );
}