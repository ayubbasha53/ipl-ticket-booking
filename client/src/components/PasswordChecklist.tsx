import { Box, Typography } from '@mui/material';
import Check from '@mui/icons-material/CheckCircle';
import Circle from '@mui/icons-material/RadioButtonUnchecked';
import { passwordRules } from '../utils/schemas';

export function PasswordChecklist({ value }: { value: string }) {
  return (
    <Box component="ul" aria-label="Password requirements" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.25 }}>
      {passwordRules.map((r) => {
        const ok = r.test(value);
        return (
          <Typography key={r.label} component="li" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: ok ? 'success.main' : 'text.secondary' }}>
            {ok ? <Check fontSize="small" /> : <Circle fontSize="small" />}
            {r.label}
            <Box component="span" sx={{ position: 'absolute', left: -9999 }}>{ok ? ' (met)' : ' (not met yet)'}</Box>
          </Typography>
        );
      })}
    </Box>
  );
}
