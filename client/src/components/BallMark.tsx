import { palette } from '../app/theme';

/** Cricket ball with a stitched seam. Decorative. */
export function BallMark({ size = 120, seam = palette.floodlight, body = palette.seam }: { size?: number; seam?: string; body?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <circle cx="100" cy="100" r="96" fill={body} />
      <g fill="none" stroke={seam} strokeLinecap="round">
        <path d="M44 28 C 78 70, 78 130, 44 172" strokeWidth="3" />
        <path d="M156 28 C 122 70, 122 130, 156 172" strokeWidth="3" />
        <path d="M52 34 C 86 72, 86 128, 52 166" strokeWidth="9" strokeDasharray="1 11" />
        <path d="M148 34 C 114 72, 114 128, 148 166" strokeWidth="9" strokeDasharray="1 11" />
      </g>
    </svg>
  );
}
