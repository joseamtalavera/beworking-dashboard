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

const DESK_RE = /^MA1O1[-_ ]?(\d{1,2})$/i;

// Consistent with booking flow: occupied = gray, available = green
const OCCUPIED_COLORS = { border: 'action.disabled', text: 'text.disabled', bg: 'action.disabled' };

/**
 * Build a Map<deskNumber, { subscription }> from desk-occupancy API data.
 * Each entry in `occupancyData` has: { subscriptionId, contactId, contactName, productoId, productName, ... }
 */
export function buildDeskMap(occupancyData) {
  const map = new Map();
  for (let i = 1; i <= 16; i++) map.set(i, { subscription: null });

  if (!Array.isArray(occupancyData)) return map;

  occupancyData.forEach((entry) => {
    const productName = (entry.productName || '').toUpperCase();
    const match = productName.match(DESK_RE);
    if (!match) return;

    const deskNum = parseInt(match[1], 10);
    if (deskNum < 1 || deskNum > 16) return;

    map.set(deskNum, { subscription: entry });
  });

  return map;
}

function DeskButton({ deskNumber, data, onClick, t }) {
  const { subscription } = data || {};
  const isOccupied = Boolean(subscription);
  const occupantName = subscription?.contactName || '';

  const tooltipContent = isOccupied
    ? [occupantName, subscription?.productName, subscription?.description].filter(Boolean).join(' · ')
    : t('admin.deskAvailable');

  return (
    <Tooltip arrow title={tooltipContent}>
      <Button
        variant="outlined"
        onClick={() => onClick(deskNumber, subscription)}
        sx={{
          py: 1.5,
          px: 1,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minWidth: 0,
          width: '100%',
          borderColor: isOccupied ? 'action.disabled' : 'success.light',
          color: isOccupied ? 'text.disabled' : 'success.dark',
          bgcolor: (theme) => isOccupied
            ? alpha(theme.palette.action.disabled, 0.08)
            : 'transparent',
          '&:hover': {
            borderColor: isOccupied ? 'action.disabled' : 'success.main',
            bgcolor: (theme) => isOccupied
              ? alpha(theme.palette.action.disabled, 0.12)
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
 * Row 1:  [10]  [12]  [14]  [16]    <- top horizontal section
 * Row 2:  [9]   [11]  [13]  [15]
 * Row 3:  [8]               [4]     <- side walls begin
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

export function DeskLegend() {
  const { t } = useTranslation('booking');
  return (
    <Stack direction="row" spacing={3} alignItems="center" justifyContent="center" flexWrap="wrap" useFlexGap>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: 'success.light' }} />
        <Typography variant="caption" color="text.secondary">{t('admin.deskAvailable')}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: 'action.disabled' }} />
        <Typography variant="caption" color="text.secondary">{t('admin.deskOccupied')}</Typography>
      </Stack>
    </Stack>
  );
}

export default function CoworkingFloorPlan({ deskData, onDeskClick, loading }) {
  const { t } = useTranslation('booking');

  const availableCount = useMemo(() => {
    if (!deskData) return 16;
    let count = 0;
    for (let i = 1; i <= 16; i++) {
      const entry = deskData.get(i);
      if (!entry || !entry.subscription) count++;
    }
    return count;
  }, [deskData]);

  const getData = (n) => deskData?.get(n) || { subscription: null };

  if (loading) {
    return (
      <Paper elevation={0} sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider', py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={32} />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t('admin.floorPlan')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('admin.desksAvailableCount', { available: availableCount, total: 16 })}
          </Typography>
        </Stack>

        <DeskLegend />

        {/* Floor plan grid: 4 columns x 6 rows */}
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
