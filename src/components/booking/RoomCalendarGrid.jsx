import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n.js';
import esBooking from '../../i18n/locales/es/booking.json';
import enBooking from '../../i18n/locales/en/booking.json';
import {
  buildTimeSlots,
  buildTimeSlotsFromBloqueos,
  bloqueoCoversSlot,
  describeBloqueo,
  getInitials,
  mapStatusKey,
  statusStyles
} from '../../utils/calendarUtils';

if (!i18n.hasResourceBundle('es', 'booking')) {
  i18n.addResourceBundle('es', 'booking', esBooking);
  i18n.addResourceBundle('en', 'booking', enBooking);
}

export const CalendarLegendItem = ({ label, color }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Box
      sx={{
        width: 16,
        height: 16,
        borderRadius: 2,
        border: '1px solid',
        borderColor: color?.borderColor || 'divider',
        bgcolor: color?.bgcolor || 'transparent'
      }}
    />
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      {label}
    </Typography>
  </Stack>
);

export const CalendarLegend = ({ styles: stylesProp }) => {
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const styles = stylesProp || statusStyles(theme);

  return (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
      <CalendarLegendItem label={t('status.available')} color={styles.available} />
      <CalendarLegendItem label={t('status.paid')} color={styles.paid} />
      <CalendarLegendItem label={t('status.invoiced')} color={styles.invoiced} />
      <CalendarLegendItem label={t('status.booked')} color={styles.created} />
    </Stack>
  );
};

const RoomCalendarGrid = ({ dateLabel, room, bloqueos = [], selectedSlotKey, onSelectSlot, interactive = !!onSelectSlot, isDesk = false, deskSlotInfo = null, deskCount = 16 }) => {
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const timeSlots = useMemo(() => isDesk ? buildTimeSlots() : buildTimeSlotsFromBloqueos(bloqueos), [isDesk, bloqueos]);
  const resolvedStatusStyles = useMemo(() => statusStyles(theme), [theme]);
  const tableMinWidth = useMemo(() => {
    const slotWidth = 64;
    const baseRoomColumn = 220;
    const paddings = 32;
    return Math.max(720, baseRoomColumn + timeSlots.length * slotWidth + paddings);
  }, [timeSlots.length]);

  const getSlotStatus = (slotId) => {
    const bloqueo = bloqueos.find((entry) => bloqueoCoversSlot(entry, slotId));
    if (!bloqueo) {
      return { status: 'available', bloqueo: null };
    }
    return { status: mapStatusKey(bloqueo.estado), bloqueo };
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        width: '100%',
        maxWidth: 1240,
        mx: 'auto',
        overflow: 'hidden',
        backgroundColor: 'background.paper'
      }}
    >
      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('detail.availability')} · {room?.name || t('steps.meetingRoom')}
          </Typography>
          {dateLabel ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {dateLabel}
            </Typography>
          ) : null}
        </Stack>

        <TableContainer
          sx={{
            maxHeight: 420,
            overflowX: 'auto',
            overflowY: 'hidden',
            width: '100%',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <Table
            size="small"
            sx={{
              minWidth: tableMinWidth,
              tableLayout: 'fixed',
              '& .MuiTableCell-root': {
                borderRight: '1px solid',
                borderRightColor: (theme) => alpha(theme.palette.divider, 0.6)
              },
              '& .MuiTableRow-root': {
                borderBottom: '1px solid',
                borderBottomColor: (theme) => alpha(theme.palette.divider, 0.6)
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: 220,
                    position: 'sticky',
                    top: 0,
                    left: 0,
                    backgroundColor: 'background.paper',
                    zIndex: 4,
                    borderRight: '1px solid',
                    borderRightColor: (theme) => alpha(theme.palette.divider, 0.8),
                    boxShadow: (theme) => `4px 0 12px ${alpha(theme.palette.common.black, 0.06)}`
                  }}
                >
                  {t('steps.room')}
                </TableCell>
                {timeSlots.map((slot) => (
                  <TableCell
                    key={slot.id}
                    align="center"
                    sx={{
                      position: 'sticky',
                      top: 0,
                      width: 64,
                      maxWidth: 64,
                      backgroundColor: 'background.paper',
                      zIndex: 3
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      {slot.label}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    width: 220,
                    maxWidth: 220,
                    backgroundColor: 'background.paper',
                    zIndex: 2,
                    borderRight: '1px solid',
                    borderRightColor: (theme) => alpha(theme.palette.divider, 0.7),
                    boxShadow: (theme) => `2px 0 8px ${alpha(theme.palette.common.black, 0.04)}`
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="body2" fontWeight="medium">
                      {isDesk ? t('catalog.desks') : (room?.name || room?.label || t('steps.meetingRoom'))}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {isDesk ? `${deskCount} ${t('catalog.desks').toLowerCase()}` : (room?.capacity ? `${t('steps.capacity')} ${room.capacity}` : '')}
                    </Typography>
                  </Stack>
                </TableCell>
                {timeSlots.map((slot) => {
                  const slotKey = `${room?.id || 'room'}-${slot.id}`;

                  // Desk mode: use aggregated slot info
                  let status, bloqueo, deskFreeCount;
                  if (isDesk) {
                    const info = deskSlotInfo ? deskSlotInfo[slot.id] : null;
                    if (info && info.fullyBooked) {
                      status = 'paid'; // fully booked
                      bloqueo = { _synthetic: true };
                    } else {
                      status = 'available';
                      bloqueo = null;
                    }
                    deskFreeCount = info ? info.freeCount : deskCount;
                  } else {
                    const result = getSlotStatus(slot.id);
                    status = result.status;
                    bloqueo = result.bloqueo;
                  }

                  const styles = resolvedStatusStyles[status] || resolvedStatusStyles.created;
                  const isSelected = selectedSlotKey === slotKey;

                  const tooltipText = isDesk
                    ? (bloqueo ? t('status.booked') : `${deskFreeCount} / ${deskCount} ${t('status.available').toLowerCase()}`)
                    : (interactive ? describeBloqueo(bloqueo) : '');

                  return (
                    <TableCell key={`${room?.id ?? 'room'}-${slot.id}`} align="center" sx={{ p: 0.75, width: 64, maxWidth: 64 }}>
                      <Tooltip arrow title={tooltipText}>
                        <Box
                          {...(interactive ? {
                            role: 'button',
                            tabIndex: 0,
                            onClick: () => onSelectSlot?.(slot, bloqueo),
                            onKeyDown: (event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onSelectSlot?.(slot, bloqueo);
                              }
                            },
                          } : {})}
                          sx={{
                            height: 52,
                            width: '100%',
                            borderRadius: 2,
                            border: '2px solid',
                            borderColor: isSelected ? theme.palette.primary.main : styles.borderColor,
                            bgcolor: styles.bgcolor,
                            color: styles.color,
                            cursor: interactive ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: (theme) => theme.transitions.create(['transform', 'border-color']),
                            ...(interactive ? { '&:hover': { transform: 'scale(1.05)' } } : {}),
                            outline: 'none'
                          }}
                        >
                          {isDesk ? (
                            !bloqueo ? (
                              <Typography variant="caption" fontWeight={600} noWrap>
                                {deskFreeCount}
                              </Typography>
                            ) : (
                              <Typography variant="caption" fontWeight={600} noWrap>
                                0
                              </Typography>
                            )
                          ) : bloqueo ? (
                            <Typography variant="caption" fontWeight={600} noWrap>
                              {getInitials(bloqueo.cliente?.nombre || bloqueo.producto?.nombre || 'Reservado')}
                            </Typography>
                          ) : null}
                        </Box>
                      </Tooltip>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Paper>
  );
};

export default RoomCalendarGrid;
