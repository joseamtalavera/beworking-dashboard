import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { fetchUninvoicedBloqueos } from '../../api/bookings.js';

function computeHours(fechaIni, fechaFin) {
  if (!fechaIni || !fechaFin) return 0;
  const start = typeof fechaIni === 'string' ? parseISO(fechaIni) : fechaIni;
  const end = typeof fechaFin === 'string' ? parseISO(fechaFin) : fechaFin;
  return differenceInMinutes(end, start) / 60;
}

function computeLineTotal(bloqueo) {
  const hours = computeHours(bloqueo.fechaIni, bloqueo.fechaFin);
  return (bloqueo.tarifa || 0) * hours;
}

export default function UninvoicedBookings({
  contactId,
  currentBloqueoId = null,
  centroId = null,
  selectedIds = [],
  onSelectionChange,
}) {
  const { t, i18n } = useTranslation('booking');
  const theme = useTheme();
  const [bloqueos, setBloqueos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState({});
  const locale = i18n.language === 'es' ? es : undefined;

  useEffect(() => {
    if (!contactId) {
      setBloqueos([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchUninvoicedBloqueos(contactId)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        const filtered = currentBloqueoId
          ? list.filter((b) => b.id !== currentBloqueoId)
          : list;
        setBloqueos(filtered);
        // Auto-expand all months
        const months = {};
        for (const b of filtered) {
          if (b.fechaIni) {
            const key = b.fechaIni.substring(0, 7);
            months[key] = true;
          }
        }
        setExpandedMonths(months);
      })
      .catch(() => {
        if (!cancelled) setBloqueos([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [contactId, currentBloqueoId]);

  const groupedByMonth = useMemo(() => {
    const groups = {};
    for (const b of bloqueos) {
      const key = b.fechaIni ? b.fechaIni.substring(0, 7) : 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [bloqueos]);

  const selectedSubtotal = useMemo(() => {
    return bloqueos
      .filter((b) => selectedIds.includes(b.id))
      .reduce((sum, b) => sum + computeLineTotal(b), 0);
  }, [bloqueos, selectedIds]);

  // Notify parent of subtotal changes
  useEffect(() => {
    if (onSelectionChange && onSelectionChange.length >= 2) {
      // Parent expects (ids, subtotal) — we'll call it on subtotal change
    }
  }, [selectedSubtotal, onSelectionChange]);

  const handleToggle = useCallback((id) => {
    const bloqueo = bloqueos.find((b) => b.id === id);
    if (bloqueo && centroId && bloqueo.centro?.id !== centroId) return; // different center, disabled
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    const newSubtotal = bloqueos
      .filter((b) => newIds.includes(b.id))
      .reduce((sum, b) => sum + computeLineTotal(b), 0);
    onSelectionChange(newIds, newSubtotal);
  }, [bloqueos, selectedIds, onSelectionChange, centroId]);

  const handleToggleMonth = useCallback((monthBloqueos) => {
    const eligibleIds = monthBloqueos
      .filter((b) => !centroId || b.centro?.id === centroId)
      .map((b) => b.id);
    const allSelected = eligibleIds.every((id) => selectedIds.includes(id));
    let newIds;
    if (allSelected) {
      newIds = selectedIds.filter((id) => !eligibleIds.includes(id));
    } else {
      newIds = [...new Set([...selectedIds, ...eligibleIds])];
    }
    const newSubtotal = bloqueos
      .filter((b) => newIds.includes(b.id))
      .reduce((sum, b) => sum + computeLineTotal(b), 0);
    onSelectionChange(newIds, newSubtotal);
  }, [bloqueos, selectedIds, onSelectionChange, centroId]);

  const toggleExpand = useCallback((monthKey) => {
    setExpandedMonths((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (bloqueos.length === 0) return null;

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
    >
      {/* Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <EventRepeatRoundedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {t('admin.uninvoicedTitle')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('admin.uninvoicedSubtitle')}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Month groups */}
      <Box sx={{ maxHeight: 400, overflow: 'auto', px: 2, pb: 2 }}>
        {groupedByMonth.map(([monthKey, monthBloqueos]) => {
          const expanded = expandedMonths[monthKey] !== false;
          const eligibleIds = monthBloqueos
            .filter((b) => !centroId || b.centro?.id === centroId)
            .map((b) => b.id);
          const allSelected = eligibleIds.length > 0 && eligibleIds.every((id) => selectedIds.includes(id));
          const someSelected = eligibleIds.some((id) => selectedIds.includes(id));

          let monthLabel;
          try {
            const [y, m] = monthKey.split('-');
            monthLabel = format(new Date(Number(y), Number(m) - 1, 1), 'MMMM yyyy', { locale });
          } catch {
            monthLabel = monthKey;
          }

          return (
            <Box key={monthKey} sx={{ mb: 1 }}>
              {/* Month header */}
              <Stack
                direction="row"
                alignItems="center"
                sx={{
                  py: 0.5,
                  px: 1,
                  borderRadius: 2,
                  bgcolor: theme.palette.action.hover,
                  cursor: 'pointer',
                }}
                onClick={() => toggleExpand(monthKey)}
              >
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleMonth(monthBloqueos);
                  }}
                  sx={{ p: 0.5 }}
                />
                <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1, ml: 1, textTransform: 'capitalize' }}>
                  {monthLabel}
                </Typography>
                <Chip
                  label={`${monthBloqueos.length}`}
                  size="small"
                  sx={{ mr: 1, height: 22, fontSize: 12 }}
                />
                <IconButton size="small" sx={{ p: 0.5 }}>
                  {expanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                </IconButton>
              </Stack>

              {/* Booking rows */}
              <Collapse in={expanded}>
                <Stack spacing={0} sx={{ mt: 0.5 }}>
                  {monthBloqueos.map((b) => {
                    const hours = computeHours(b.fechaIni, b.fechaFin);
                    const lineTotal = computeLineTotal(b);
                    const isDiffCenter = centroId && b.centro?.id !== centroId;
                    const dateStr = b.fechaIni
                      ? format(parseISO(b.fechaIni), 'dd MMM', { locale })
                      : '—';
                    const timeFrom = b.fechaIni
                      ? format(parseISO(b.fechaIni), 'HH:mm')
                      : '';
                    const timeTo = b.fechaFin
                      ? format(parseISO(b.fechaFin), 'HH:mm')
                      : '';

                    return (
                      <Stack
                        key={b.id}
                        direction="row"
                        alignItems="center"
                        sx={{
                          py: 0.5,
                          px: 1,
                          borderRadius: 1.5,
                          opacity: isDiffCenter ? 0.5 : 1,
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={selectedIds.includes(b.id)}
                          disabled={isDiffCenter}
                          onChange={() => handleToggle(b.id)}
                          sx={{ p: 0.5 }}
                        />
                        <Typography variant="body2" sx={{ minWidth: 60, ml: 1 }}>
                          {dateStr}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                          {timeFrom} – {timeTo}
                        </Typography>
                        <Typography variant="body2" sx={{ flex: 1, ml: 1 }} noWrap>
                          {b.producto?.nombre || '—'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
                          {hours > 0 ? t('admin.uninvoicedHours', { hours: hours.toFixed(1).replace('.0', '') }) : ''}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 70, textAlign: 'right' }}>
                          {lineTotal > 0 ? `€${lineTotal.toFixed(2)}` : '—'}
                        </Typography>
                        {isDiffCenter && (
                          <Chip
                            label={t('admin.uninvoicedDiffCenter')}
                            size="small"
                            color="warning"
                            sx={{ ml: 1, height: 20, fontSize: 11 }}
                          />
                        )}
                      </Stack>
                    );
                  })}
                </Stack>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      {/* Footer: selection summary */}
      {selectedIds.length > 0 && (
        <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderTopColor: 'divider', bgcolor: 'action.hover' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {t('admin.uninvoicedSelected', { count: selectedIds.length })}
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              {t('admin.uninvoicedTotal')}: €{selectedSubtotal.toFixed(2)}
            </Typography>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
