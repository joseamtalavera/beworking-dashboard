// Canonical sx for pill-style search/form fields.
// The shrink rule keeps labels at the declared 0.75rem instead of MUI's
// default 0.75× scale-down — without it, Selects (always shrunk) end up
// looking bigger than empty TextFields, which breaks the bar's rhythm.
export const pillFieldSx = (hasValue) => ({
  '& .MuiInputLabel-root': {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: hasValue ? 'brand.green' : 'text.primary',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    transition: 'color 0.2s',
  },
  '& .MuiInputLabel-shrink': { transform: 'translate(0, -1.5px) scale(1)' },
  '& .MuiInput-input': {
    fontSize: '0.875rem',
    color: hasValue ? 'text.primary' : 'text.secondary',
    py: 0.25,
  },
});
