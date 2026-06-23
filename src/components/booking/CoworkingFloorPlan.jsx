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

// Default zone (the original 16-desk room) — keeps existing callers working
// when no deskPrefix/deskCount is supplied.
const DEFAULT_PREFIX = 'MA1O1';
const DEFAULT_DESK_COUNT = 16;

/** Regex matching "<prefix>-7" / "<prefix>_7" / "<prefix> 7" -> desk number. */
const deskRegex = (prefix) => new RegExp(`^${prefix}[-_ ]?(\\d{1,2})$`, 'i');

// Consistent with booking flow: occupied = gray, available = green
const OCCUPIED_COLORS = { border: 'action.disabled', text: 'text.disabled', bg: 'action.disabled' };

/**
 * Build a Map<deskNumber, { subscription }> from desk-occupancy API data.
 * Each entry in `occupancyData` has: { subscriptionId, contactId, contactName, productoId, productName, ... }
 * `prefix`/`deskCount` scope the map to one coworking zone (default: MA1O1, 16).
 */
export function buildDeskMap(occupancyData, { prefix = DEFAULT_PREFIX, deskCount = DEFAULT_DESK_COUNT } = {}) {
  const map = new Map();
  for (let i = 1; i <= deskCount; i++) map.set(i, { subscription: null });

  if (!Array.isArray(occupancyData)) return map;

  const re = deskRegex(prefix);
  occupancyData.forEach((entry) => {
    const productName = (entry.productName || '').toUpperCase();
    const match = productName.match(re);
    if (!match) return;

    const deskNum = parseInt(match[1], 10);
    if (deskNum < 1 || deskNum > deskCount) return;

    map.set(deskNum, { subscription: entry });
  });

  return map;
}

function DeskButton({ deskNumber, data, isBookedOverride, onClick, t, showOccupantName, isSelected }) {
  const { subscription } = data || {};
  // When the parent passes a date-aware bookedDeskNumbers set, isBookedOverride
  // is the source of truth. Otherwise fall back to "has active subscription".
  const isOccupied = isBookedOverride != null ? isBookedOverride : Boolean(subscription);
  const occupantName = showOccupantName ? (subscription?.contactName || '') : '';

  const tooltipContent = isOccupied
    ? (showOccupantName && subscription
        ? [subscription.contactName, subscription.productName, subscription.description].filter(Boolean).join(' · ')
        : t('admin.deskBookedForDate'))
    : t('admin.deskAvailable');

  return (
    <Tooltip arrow title={tooltipContent}>
      <Button
        variant={isSelected ? 'contained' : 'outlined'}
        onClick={() => onClick(deskNumber, subscription)}
        disabled={isOccupied}
        sx={{
          py: 1.5,
          px: 1,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minWidth: 0,
          width: '100%',
          borderColor: isSelected ? 'success.main' : (isOccupied ? 'action.disabled' : 'success.light'),
          color: isSelected ? 'background.paper' : (isOccupied ? 'text.disabled' : 'success.dark'),
          backgroundColor: (theme) => isSelected
            ? theme.palette.success.main
            : (isOccupied ? alpha(theme.palette.action.disabled, 0.08) : alpha(theme.palette.success.main, 0.12)),
          '&:hover': {
            borderColor: isSelected ? 'success.dark' : (isOccupied ? 'action.disabled' : 'success.main'),
            backgroundColor: (theme) => isSelected
              ? theme.palette.success.dark
              : (isOccupied ? alpha(theme.palette.action.disabled, 0.12) : alpha(theme.palette.success.main, 0.08)),
          },
          '&.Mui-disabled': {
            color: 'text.disabled',
          },
        }}
      >
        <Stack alignItems="center" spacing={0.25}>
          <Box sx={{ position: 'relative', width: 30, height: 26, color: 'inherit' }}>
            {/* head */}
            <Box sx={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: 9, height: 9, borderRadius: '50%', bgcolor: 'currentColor' }} />
            {/* shoulders */}
            <Box sx={{ position: 'absolute', left: '50%', top: 7, transform: 'translateX(-50%)', width: 16, height: 9, borderRadius: '8px 8px 0 0', bgcolor: 'currentColor' }} />
            {/* desk */}
            <Box sx={{ position: 'absolute', left: 0, bottom: 0, width: 30, height: 7, borderRadius: '3px', bgcolor: 'currentColor', opacity: 0.8 }} />
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1, color: 'inherit' }}>
            {t('admin.deskNumber', { number: deskNumber }).split(' ')[0]}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1, color: 'inherit' }}>
            {deskNumber}
          </Typography>
          {showOccupantName && (
            <Typography variant="caption" noWrap sx={{ fontSize: '0.6rem', maxWidth: 90, color: 'inherit', lineHeight: 1.2, opacity: 0.85 }}>
              {isOccupied
                ? (occupantName
                    ? (occupantName.length > 12 ? occupantName.slice(0, 10) + '...' : occupantName)
                    : t('admin.deskOccupied', { defaultValue: 'Ocupada' }))
                : t('admin.deskFree', { defaultValue: 'Libre' })}
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

// Distinct physical layouts per zone size. 16 = original U-shaped room
// (4 cols × 6 rows); 14 = summer A5 room, two facing rows of 7 (2 cols × 7 rows)
// so the two rooms read as visually different floor plans.
const DESK_LAYOUTS = {
  16: { cols: 4, rows: 6, desks: GRID_DESKS },
  14: {
    cols: 2,
    rows: 7,
    desks: [
      [1, 1, 1], [2, 2, 1],
      [3, 1, 2], [4, 2, 2],
      [5, 1, 3], [6, 2, 3],
      [7, 1, 4], [8, 2, 4],
      [9, 1, 5], [10, 2, 5],
      [11, 1, 6], [12, 2, 6],
      [13, 1, 7], [14, 2, 7],
    ],
  },
};

export function DeskLegend() {
  const { t } = useTranslation('booking');
  return (
    <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" useFlexGap>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: (theme) => alpha(theme.palette.success.main, 0.12), border: '1px solid', borderColor: 'success.light' }} />
        <Typography variant="caption" color="text.secondary">{t('admin.deskAvailable')}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: 'success.main' }} />
        <Typography variant="caption" color="text.secondary">{t('admin.deskSelected')}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: (theme) => alpha(theme.palette.action.disabled, 0.08), border: '1px solid', borderColor: 'action.disabled' }} />
        <Typography variant="caption" color="text.secondary">{t('admin.deskBooked')}</Typography>
      </Stack>
    </Stack>
  );
}

export default function CoworkingFloorPlan({ deskData, bookedDeskNumbers, onDeskClick, loading, mode = 'admin', selectedDeskNumber = null, deskCount = DEFAULT_DESK_COUNT }) {
  const { t } = useTranslation('booking');
  const isDateAware = bookedDeskNumbers instanceof Set;
  const showOccupantName = mode === 'admin';

  // Pick this zone's layout; fall back to the 16-grid filtered to the count.
  const layout = DESK_LAYOUTS[deskCount];
  const gridCols = layout ? layout.cols : 4;
  const gridRows = layout ? layout.rows : 6;
  const visibleDesks = useMemo(
    () => (layout ? layout.desks : GRID_DESKS.filter(([n]) => n <= deskCount)),
    [layout, deskCount],
  );

  const availableCount = useMemo(() => {
    if (isDateAware) {
      let count = 0;
      for (let i = 1; i <= deskCount; i++) {
        if (!bookedDeskNumbers.has(i)) count++;
      }
      return count;
    }
    if (!deskData) return deskCount;
    let count = 0;
    for (let i = 1; i <= deskCount; i++) {
      const entry = deskData.get(i);
      if (!entry || !entry.subscription) count++;
    }
    return count;
  }, [deskData, bookedDeskNumbers, isDateAware, deskCount]);

  const getData = (n) => deskData?.get(n) || { subscription: null };
  const isBooked = (n) => (isDateAware ? bookedDeskNumbers.has(n) : null);

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
            {availableCount > 0
              ? t('admin.desksAvailableCount', { available: availableCount, total: deskCount })
              : t('admin.noDesksForPeriod')}
          </Typography>
        </Stack>

        <DeskLegend />

        {/* Floor plan grid: 4 columns x 6 rows */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${gridRows}, auto)`,
            gap: 1.5,
            py: 2,
          }}
        >
          {visibleDesks.map(([deskNum, col, row]) => (
            <Box key={deskNum} sx={{ gridColumn: col, gridRow: row }}>
              <DeskButton
                deskNumber={deskNum}
                data={getData(deskNum)}
                isBookedOverride={isBooked(deskNum)}
                onClick={onDeskClick}
                t={t}
                showOccupantName={showOccupantName}
                isSelected={selectedDeskNumber === deskNum}
              />
            </Box>
          ))}
        </Box>
      </Stack>
    </Paper>
  );
}
