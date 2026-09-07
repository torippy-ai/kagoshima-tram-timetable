import type { CSSProperties } from "react";

interface IconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const base = (size: number) => ({
  width: size,
  height: size,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function HomeIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} {...base(size)}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

export function SearchIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} {...base(size)}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function StarIcon({ size = 20, className, style, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
    >
      <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} {...base(size)}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 22, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} {...base(size)}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function UpIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} {...base(size)}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

export function DownIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} {...base(size)}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
