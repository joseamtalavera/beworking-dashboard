import { Stack, Button } from '@mui/material';

// Mensual / Semestral / Anual. months drives per-cycle totals (price × months).
export const INTERVALS = [
  { key: 'month',     months: 1,  es: 'Mensual',   en: 'Monthly', suffixEs: '/mes',      suffixEn: '/mo' },
  { key: 'half_year', months: 6,  es: 'Semestral', en: 'Biannual', suffixEs: '/semestre', suffixEn: '/6 mo' },
  { key: 'year',      months: 12, es: 'Anual',     en: 'Annual',  suffixEs: '/año',      suffixEn: '/yr' },
];

export const intervalMonths = (key) => (INTERVALS.find((i) => i.key === key)?.months ?? 1);

/**
 * Shared segmented billing-interval selector so the control is identical across
 * the user "Activa tu plan" dialog, admin Add and admin Edit subscription dialogs.
 */
export default function BillingIntervalToggle({ value, onChange, lang = 'es', size = 'medium', sx }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ p: 0.5, bgcolor: 'action.hover', borderRadius: '999px', ...sx }}>
      {INTERVALS.map((iv) => {
        const selected = iv.key === value;
        return (
          <Button
            key={iv.key}
            onClick={() => onChange(iv.key)}
            disableElevation
            sx={{
              flex: 1,
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 600,
              py: size === 'small' ? 0.5 : 0.7,
              fontSize: size === 'small' ? '0.8rem' : '0.875rem',
              color: selected ? 'common.white' : 'text.secondary',
              bgcolor: selected ? 'brand.green' : 'transparent',
              '&:hover': { bgcolor: selected ? 'brand.green' : 'action.selected' },
            }}
          >
            {lang === 'es' ? iv.es : iv.en}
          </Button>
        );
      })}
    </Stack>
  );
}
