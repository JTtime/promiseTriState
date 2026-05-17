/**
 * PulseWave
 *
 * Five vertical bars animate like an audio equalizer while pending.
 * On fulfilled → bars collapse downward and a large tick pops in.
 * On rejected  → bars scatter outward and a bold ✕ icon slams in.
 *
 * Each bar has a staggered animation delay for the organic wave feel.
 * The transition uses clip-path expansion for the icon reveal.
 */

import { useEffect } from 'react';
import type { PromiseStatus } from '@/types';
import { injectStyles } from '../../styles/keyframes';

export interface PulseWaveProps {
  status: PromiseStatus;
  size?: number;
  color?: string;
  errorColor?: string;
  barCount?: number;
  className?: string;
  style?: React.CSSProperties;
}

function s(styles: Record<string, string | number | undefined>): React.CSSProperties {
  return styles as React.CSSProperties;
}

const BAR_DELAYS = [0, 0.12, 0.24, 0.12, 0]; // symmetric wave

export function PulseWave({
  status,
  size = 56,
  color = '#6C63FF',
  errorColor = '#EF4444',
  barCount = 5,
  className = '',
  style = {},
}: PulseWaveProps) {
  useEffect(() => { injectStyles(); }, []);

  const isPending   = status === 'pending';
  const isFulfilled = status === 'fulfilled';
  const isRejected  = status === 'rejected';
  const isIdle      = status === 'idle';

  const barWidth   = size * 0.1;
  const barGap     = size * 0.07;
  const barMaxH    = size * 0.75;
  const barMinH    = size * 0.18;
  const barRadius  = barWidth / 2;
  const totalW     = barCount * barWidth + (barCount - 1) * barGap;
  const offsetX    = (size - totalW) / 2;

  const successColor = color;

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-label={
        isPending ? 'Loading…' : isFulfilled ? 'Success' : isRejected ? 'Error' : ''
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
      {/* ── Bars (visible when pending or idle) ── */}
      <div
        style={s({
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${barGap}px`,
          opacity: isIdle ? 0.3 : 1,
          transition: 'opacity 0.2s ease',
        })}
      >
        {Array.from({ length: barCount }).map((_, i) => {
          const delay = BAR_DELAYS[i] ?? 0;
          let barAnim = 'none';
          let barStyle: React.CSSProperties = {};

          if (isPending || isIdle) {
            barAnim = `tsl-wave-bar 0.8s ease-in-out ${delay}s infinite`;
          } else if (isFulfilled) {
            barAnim = `tsl-wave-success 0.4s var(--tsl-ease-snap) ${i * 0.04}s forwards`;
          } else if (isRejected) {
            // Scatter: each bar flies in a different direction
            const angle = (i / (barCount - 1)) * 180 - 90; // -90° to +90°
            const rad   = (angle * Math.PI) / 180;
            const tx    = Math.sin(rad) * size * 0.7;
            const ty    = -Math.abs(Math.cos(rad)) * size * 0.5;
            barStyle = {
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
            } as React.CSSProperties;
            barAnim = `tsl-scatter-bar 0.4s var(--tsl-ease-snap) ${i * 0.03}s forwards`;
          }

          return (
            <div
              key={i}
              style={{
                width: barWidth,
                height: isPending ? barMaxH : barMinH,
                minHeight: barMinH,
                maxHeight: barMaxH,
                borderRadius: barRadius,
                background: isRejected ? errorColor : color,
                transformOrigin: 'center bottom',
                animation: barAnim,
                transition: 'background 0.3s ease, height 0.3s ease',
                ...barStyle,
              }}
            />
          );
        })}
      </div>

      {/* ── Tick icon (fulfilled) ── */}
      {isFulfilled && (
        <svg
          width={size * 0.65}
          height={size * 0.65}
          viewBox="0 0 24 24"
          fill="none"
          style={s({
            position: 'absolute',
            animation: 'tsl-tick-pop 0.45s var(--tsl-ease-spring) 0.3s both',
          })}
        >
          <polyline
            points="3,12 9,18 21,6"
            stroke={successColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="50"
            strokeDashoffset="50"
            style={s({
              animation: 'tsl-check-draw 0.4s var(--tsl-ease-spring) 0.45s forwards',
            })}
          />
        </svg>
      )}

      {/* ── Error icon (rejected) ── */}
      {isRejected && (
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          style={s({
            position: 'absolute',
            animation: 'tsl-error-pop 0.35s var(--tsl-ease-spring) 0.3s both',
          })}
        >
          {/* Circle background */}
          <circle cx="12" cy="12" r="10" fill={errorColor} opacity="0.15" />
          <line x1="8" y1="8" x2="16" y2="16"
            stroke={errorColor} strokeWidth={2.5} strokeLinecap="round" />
          <line x1="16" y1="8" x2="8" y2="16"
            stroke={errorColor} strokeWidth={2.5} strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}