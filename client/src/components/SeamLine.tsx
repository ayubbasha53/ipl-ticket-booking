import { Box } from '@mui/material';
import { palette } from '../app/theme';

/** A row of seam stitches used as a divider. */
export function SeamLine({ color = palette.seam, width = '100%' }: { color?: string; width?: number | string }) {
  return (
    <Box aria-hidden="true" sx={{ width, height: 14, color, lineHeight: 0 }}>
      <svg width="100%" height="14" focusable="false">
        <defs>
          <pattern id="stitch" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M3 11 L9 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </pattern>
        </defs>
        <rect width="100%" height="14" fill="url(#stitch)" />
      </svg>
    </Box>
  );
}
