import { createTheme } from '@mui/material/styles';

export const palette = {
  night: '#0F1B2D',
  seam: '#C8242B',
  seamDark: '#A31C22',
  outfield: '#2E6B4F',
  floodlight: '#FFE8A3',
  paper: '#F6F7F9',
  muted: '#4A5566',
};

export const theme = createTheme({
  palette: {
    primary: { main: palette.seam, dark: palette.seamDark, contrastText: '#fff' },
    secondary: { main: palette.night },
    success: { main: palette.outfield },
    background: { default: palette.paper, paper: '#fff' },
    text: { primary: palette.night, secondary: palette.muted },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: '"Source Sans 3", system-ui, sans-serif',
    h1: { fontFamily: '"Barlow Semi Condensed", sans-serif', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.02 },
    h2: { fontFamily: '"Barlow Semi Condensed", sans-serif', fontWeight: 700, lineHeight: 1.1 },
    h3: { fontFamily: '"Barlow Semi Condensed", sans-serif', fontWeight: 600 },
    h4: { fontFamily: '"Barlow Semi Condensed", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Barlow Semi Condensed", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Barlow Semi Condensed", sans-serif', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '1rem' },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { fullWidth: true, size: 'medium' } },
  },
});
