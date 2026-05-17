/**
 * MorphButton
 *
 * The button IS the loader. No separate component needed.
 *
 * idle      → normal button with label
 * pending   → label fades, button contracts to a circle, spinner appears
 * fulfilled → spinner morphs to checkmark, subtle green pulse
 * rejected  → spinner morphs to ✕, red shake, then bounces back to idle
 *
 * This is the most requested pattern — "loading button" — done right.
 * The width transition is the key: smooth CSS width change with a spring
 * curve makes it feel mechanical and satisfying.
 */

import { useEffect, useRef } from 'react';
import type { PromiseStatus } from '@/types';
import { injectStyles } from '../../styles/keyframes';

export interface MorphButtonProps {
  status: PromiseStatus;
  onClick?: () => void;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  errorColor?: string;
  successColor?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_MAP = {
  sm: { height: 36, fontSize: 13, iconSize: 18, strokeWidth: 2.5 },
  md: { height: 44, fontSize: 15, iconSize: 22, strokeWidth: 2.5 },
  lg: { height: 52, fontSize: 17, iconSize: 26, strokeWidth: 2.5 },
};

function s(obj: Record<string, string | number | undefined>): React.CSSProperties {
  return obj as React.CSSProperties;
}

export function MorphButton({
  status,
  onClick,
  children = 'Submit',
  size = 'md',
  color = '#6C63FF',
  errorColor = '#EF4444',
  successColor,
  disabled = false,
  className = '',
  style = {},
}: MorphButtonProps) {
  useEffect(() => { injectStyles(); }, []);

  const dims = SIZE_MAP[size];
  const resolvedSuccessColor = successColor ?? color;

  const isPending   = status === 'pending';
  const isFulfilled = status === 'fulfilled';
  const isRejected  = status === 'rejected';
  const isActive    = isPending || isFulfilled || isRejected;

  // Button becomes a circle when active
  const buttonWidth   = isActive ? dims.height : undefined; // undefined = auto from content
  const borderRadius  = isActive ? dims.height / 2 : 10;
  const bgColor       = isRejected ? errorColor : isFulfilled ? resolvedSuccessColor : color;

  const iconSize      = dims.iconSize;
  const cx            = iconSize / 2;
  const r             = cx - dims.strokeWidth;
  const circumference = 2 * Math.PI * r;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isPending}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: dims.height,
        width: buttonWidth,
        minWidth: isActive ? dims.height : undefined,
        padding: isActive ? 0 : `0 ${dims.height * 0.54}px`,
        fontSize: dims.fontSize,
        fontWeight: 600,
        letterSpacing: '0.01em',
        color: 'white',
        background: bgColor,
        border: 'none',
        borderRadius,
        cursor: isPending ? 'not-allowed' : 'pointer',
        outline: 'none',
        overflow: 'hidden',
        transition: [
          'width 0.45s var(--tsl-ease-spring)',
          'min-width 0.45s var(--tsl-ease-spring)',
          'border-radius 0.45s var(--tsl-ease-spring)',
          'background 0.35s ease',
          'padding 0.45s var(--tsl-ease-spring)',
        ].join(', '),
        animation: isRejected
          ? 'tsl-error-shake 0.5s var(--tsl-ease-smooth)'
          : 'none',
        boxShadow: isFulfilled
          ? `0 4px 20px ${resolvedSuccessColor}55`
          : isRejected
          ? `0 4px 20px ${errorColor}44`
          : `0 4px 14px ${color}44`,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        ...style,
      }}
    >
      {/* ── Label (idle only) ── */}
      <span
        style={s({
          position: 'absolute',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          opacity: isActive ? 0 : 1,
          transform: isActive ? 'scale(0.8)' : 'scale(1)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        })}
      >
        {children}
      </span>

      {/* ── Spinner + icon (active states) ── */}
      <span
        style={s({
          position: 'absolute',
          transition: 'opacity 0.2s ease 0.15s, transform 0.2s ease 0.15s',
          opacity: isActive ? 1 : 0,
          transform: isActive ? 'scale(1)' : 'scale(0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox={`0 0 ${iconSize} ${iconSize}`}
          fill="none"
          style={s({
            animation: isRejected
              ? 'tsl-error-shake 0.4s ease'
              : 'none',
          })}
        >
          {/* ── Settled circle bg ── */}
          {(isFulfilled || isRejected) && (
            <circle
              cx={cx}
              cy={cx}
              r={cx * 0.85}
              fill="rgba(255,255,255,0.2)"
              style={s({
                animation: 'tsl-bg-fill 0.3s ease forwards',
              })}
            />
          )}

          {/* ── Spinning arc (pending) ── */}
          {isPending && (
            <g
              style={s({
                transformOrigin: `${cx}px ${cx}px`,
                animation: 'tsl-spin 0.8s linear infinite',
              })}
            >
              {/* Track */}
              <circle
                cx={cx} cy={cx} r={r}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={dims.strokeWidth}
              />
              {/* Arc */}
              <circle
                cx={cx} cy={cx} r={r}
                stroke="white"
                strokeWidth={dims.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${circumference * 0.7} ${circumference * 0.3}`}
                transform={`rotate(-90, ${cx}, ${cx})`}
              />
            </g>
          )}

          {/* ── Check ── */}
          {isFulfilled && (() => {
            const pad = iconSize * 0.22;
            return (
              <polyline
                points={`${pad},${cx + iconSize * 0.04} ${cx - iconSize * 0.03},${iconSize - pad} ${iconSize - pad},${pad}`}
                stroke="white"
                strokeWidth={dims.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="50"
                strokeDashoffset="50"
                fill="none"
                style={s({
                  animation: 'tsl-check-draw 0.3s var(--tsl-ease-spring) 0.15s forwards',
                })}
              />
            );
          })()}

          {/* ── Cross ── */}
          {isRejected && (() => {
            const pad = iconSize * 0.28;
            return (
              <>
                <line
                  x1={pad} y1={pad} x2={iconSize - pad} y2={iconSize - pad}
                  stroke="white"
                  strokeWidth={dims.strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray="25"
                  strokeDashoffset="25"
                  style={s({ animation: 'tsl-cross-draw 0.2s ease 0.1s forwards' })}
                />
                <line
                  x1={iconSize - pad} y1={pad} x2={pad} y2={iconSize - pad}
                  stroke="white"
                  strokeWidth={dims.strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray="25"
                  strokeDashoffset="25"
                  style={s({ animation: 'tsl-cross-draw 0.2s ease 0.18s forwards' })}
                />
              </>
            );
          })()}
        </svg>
      </span>

      {/* ── Pulse ring on success ── */}
      {isFulfilled && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius,
            border: `2px solid ${resolvedSuccessColor}`,
            animation: 'tsl-pulse-ring 0.6s ease-out 0.15s both',
            pointerEvents: 'none',
          }}
        />
      )}
    </button>
  );
}