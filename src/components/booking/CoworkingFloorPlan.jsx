import { useMemo } from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';

const CALENDAR_COLORS = {
  available: { bg: '#a1a1aa', border: '#a1a1aa', text: '#52525b' },
  paid:      { bg: '#009624', border: '#009624', text: '#007a1d' },
  invoiced:  { bg: '#ef4444', border: '#dc2626', text: '#b91c1c' },
  created:   { bg: '#f59e0b', border: '#f59e0b', text: '#d97706' },
  free:      { bg: '#1a1a1a', border: '#1a1a1a', text: '#1a1a1a' }
};

const DESK_RE = /^MA1O1[-_ ]?(\d{1,2})$/i;

const mapStatusKey = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('pag') || normalized.includes('paid')) return 'paid';
  if (normalized.includes('fact') || normalized.includes('invoice') || normalized.includes('pend')) return 'invoiced';
  if (normalized.includes('grat') || normalized.includes('free')) return 'free';
  return 'created';
};

export function buildDeskMap(bloqueos, targetDate) {
  const map = new Map();
  for (let i = 1; i <= 16; i++) map.set(i, { bloqueos: [], primaryBloqueo: null });

  if (!Array.isArray(bloqueos) || !targetDate) return map;

  const dayStart = new Date(targetDate + 'T00:00:00');
  const dayEnd = new Date(targetDate + 'T23:59:59');

  bloqueos.forEach((b) => {
    const productName = (b?.producto?.nombre || '').toUpperCase();
    const match = productName.match(DESK_RE);
    if (!match) return;

    const deskNum = parseInt(match[1], 10);
    if (deskNum < 1 || deskNum > 16) return;

    const bStart = new Date(b.fechaIni || b.fecha || b.date);
    const bEnd = b.fechaFin || b.dateTo ? new Date(b.fechaFin || b.dateTo) : bStart;
    if (bStart <= dayEnd && bEnd >= dayStart) {
      const entry = map.get(deskNum);
      entry.bloqueos.push(b);
      if (!entry.primaryBloqueo) entry.primaryBloqueo = b;
    }
  });

  return map;
}

function DeskButton({ deskNumber, data, onClick, t }) {
  const { primaryBloqueo } = data || {};
  const isOccupied = Boolean(primaryBloqueo);
  const statusKey = isOccupied ? mapStatusKey(primaryBloqueo.estado) : null;
  const colors = isOccupied ? (CALENDAR_COLORS[statusKey] || CALENDAR_COLORS.created) : null;
  const occupantName = primaryBloqueo?.cliente?.nombre || '';

  const tooltipContent = isOccupied
    ? [occupantName, primaryBloqueo?.producto?.nombre, primaryBloqueo?.centro?.nombre].filter(Boolean).join(' · ')
    : t('admin.deskAvailable');

  return (
    <Tooltip arrow title={tooltipContent}>
      <Button
        variant="outlined"
        onClick={() => onClick(deskNumber, primaryBloqueo)}
        sx={{
          py: 1.5,
          px: 1,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.875rem',
          minWidth: 0,
          width: '100%',
          borderColor: isOccupied ? colors.border : 'success.light',
          color: isOccupied ? colors.text : 'success.dark',
          bgcolor: isOccupied ? alpha(colors.bg, 0.12) : 'transparent',
          '&:hover': {
            borderColor: isOccupied ? colors.border : 'success.main',
            bgcolor: (theme) => isOccupied
              ? alpha(colors.bg, 0.18)
              : alpha(theme.palette.success.main, 0.08),
          },
        }}
      >
        <Stack alignItems="center" spacing={0.25}>
          <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1, color: 'inherit' }}>
            {t('admin.deskNumber', { number: deskNumber }).split(' ')[0]}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1, color: 'inherit' }}>
            {deskNumber}
          </Typography>
          {isOccupied && occupantName && (
            <Typography variant="caption" noWrap sx={{ fontSize: '0.6rem', maxWidth: 80, color: 'inherit', lineHeight: 1.2 }}>
              {occupantName.length > 12 ? occupantName.slice(0, 10) + '...' : occupantName}
            </Typography>
          )}
        </Stack>
      </Button>
    </Tooltip>
  );
}

/**
 * Physical room layout — 4 columns × 6 rows:
 *
 * Row 1:  [10]  [12]  [14]  [16]    ← top horizontal section
 * Row 2:  [9]   [11]  [13]  [15]
 * Row 3:  [8]               [4]     ← side walls begin
 * Row 4:  [7]               [3]
 * Row 5:  [6]               [2]
 * Row 6:  [5]               [1]
 */
export const GRID_DESKS = [
  // [deskNumber, gridColumn, gridRow]
  [10, 1, 1], [12, 2, 1], [14, 3, 1], [16, 4, 1],
  [9, 1, 2],  [11, 2, 2], [13, 3, 2], [15, 4, 2],
  [8, 1, 3],                           [4, 4, 3],
  [7, 1, 4],                           [3, 4, 4],
  [6, 1, 5],                           [2, 4, 5],
  [5, 1, 6],                           [1, 4, 6],
];
export default function CoworkingFloorPlan({ deskData, selectedDate, onDeskClick, loading }) {
  const { t } = useTranslation('booking');

  const availableCount = useMemo(() => {
    if (!deskData) return 16;
    let count = 0;
    for (let i = 1; i <= 16; i++) {
      const entry = deskData.get(i);
      if (!entry || !entry.primaryBloqueo) count++;
    }
    return count;
  }, [deskData]);

  const getData = (n) => deskData?.get(n) || { bloqueos: [], primaryBloqueo: null };

  if (loading) {
    return (
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={32} />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('admin.floorPlan')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('admin.desksAvailableCount', { available: availableCount, total: 16 })}
          </Typography>
        </Stack>

        {/* Floor plan grid: 4 columns × 6 rows */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(6, auto)',
            gap: 1.5,
            py: 2,
          }}
        >
          {GRID_DESKS.map(([deskNum, col, row]) => (
            <Box key={deskNum} sx={{ gridColumn: col, gridRow: row }}>
              <DeskButton deskNumber={deskNum} data={getData(deskNum)} onClick={onDeskClick} t={t} />
            </Box>
          ))}
        </Box>
      </Stack>
    </Paper>
  );
}
