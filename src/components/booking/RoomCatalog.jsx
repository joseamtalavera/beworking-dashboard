import { useCallback, useEffect, useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DeskRoundedIcon from '@mui/icons-material/DeskRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n.js';
import esBooking from '../../i18n/locales/es/booking.json';
import enBooking from '../../i18n/locales/en/booking.json';

import { fetchBookingCentros, fetchPublicProductos } from '../../api/bookings.js';
import SpaceCard from './SpaceCard';

if (!i18n.hasResourceBundle('es', 'booking')) {
  i18n.addResourceBundle('es', 'booking', esBooking);
  i18n.addResourceBundle('en', 'booking', enBooking);
}

const SPACE_TYPES = [
  { value: 'meeting_room', labelKey: 'catalog.meetingRooms', icon: <MeetingRoomRoundedIcon /> },
  { value: 'desk', labelKey: 'catalog.desks', icon: <DeskRoundedIcon /> },
];

// Helpers ported from beworking-booking store
const isCanonicalDeskProducto = (p) => {
  const name = (p.name ?? p.nombre ?? '').trim().toUpperCase().replace(/[-_\s]/g, '');
  return name === 'MA1DESK' || name === 'MA1DESKS';
};

const isDeskProducto = (p) => {
  const type = (p.type ?? p.tipo ?? '').trim().toLowerCase();
  if (type === 'mesa') return true;
  if (isCanonicalDeskProducto(p)) return true;
  const name = (p.name ?? p.nombre ?? '').trim().toUpperCase();
  return /^MA1[-_]?O1[-_ ]?\d{1,2}$/.test(name);
};

export default function RoomCatalog({ onClose, onBookNow }) {
  const { t } = useTranslation('booking');
  const [activeTab, setActiveTab] = useState(0);
  const [cityFilter, setCityFilter] = useState('');
  const [cityOptions, setCityOptions] = useState([{ id: 'all', label: t('catalog.allLocations'), isAllOption: true }]);
  const [checkIn, setCheckIn] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [people, setPeople] = useState('');

  const [centros, setCentros] = useState([]);
  const [centrosLoading, setCentrosLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [productosLoading, setProductosLoading] = useState(false);

  // Load centros and derive city options
  useEffect(() => {
    let active = true;
    setCentrosLoading(true);

    (async () => {
      try {
        const data = await fetchBookingCentros();
        if (!active) return;

        const options = Array.isArray(data)
          ? data.map((c) => {
              const code = (c.codigo ?? c.code ?? '').toUpperCase();
              const city = (c.localidad ?? c.city ?? '').trim();
              return {
                ...c,
                id: c.id ?? c.codigo ?? c.code ?? c.nombre ?? c.name ?? code,
                label: c.nombre ?? c.name ?? '',
                code,
                city,
              };
            })
          : [];

        setCentros([{ id: 'all', label: t('catalog.allCentros'), isAllOption: true }, ...options]);

        const uniqueCities = Array.from(
          new Set(
            options
              .map((o) => o.city)
              .filter((c) => typeof c === 'string' && c.trim() !== '')
              .map((c) => c.trim())
          )
        );
        setCityOptions([
          { id: 'all', label: t('catalog.allLocations'), isAllOption: true },
          ...uniqueCities.map((c) => ({ id: c.toLowerCase(), label: c })),
        ]);
      } catch {
        if (active) {
          setCentros([]);
          setCityOptions([{ id: 'all', label: t('catalog.allLocations'), isAllOption: true }]);
        }
      } finally {
        if (active) setCentrosLoading(false);
      }
    })();

    return () => { active = false; };
  }, []);

  // Load productos (re-fetches when tab changes)
  useEffect(() => {
    let active = true;
    setProductosLoading(true);

    (async () => {
      try {
        const params = { centerCode: 'MA1' };
        if (activeTab === 0) params.type = 'Aula';
        const data = await fetchPublicProductos(params);
        if (!active) return;
        setProductos(Array.isArray(data) ? data : []);
      } catch {
        if (active) setProductos([]);
      } finally {
        if (active) setProductosLoading(false);
      }
    })();

    return () => { active = false; };
  }, [activeTab]);

  // ── Filter logic (mirrors booking app index.js) ──
  const filteredSpaces = useMemo(() => {
    if (!Array.isArray(productos) || productos.length === 0) return [];

    const filteredProductos = productos.filter((producto) => {
      const type = (producto.type ?? producto.tipo ?? '').trim().toLowerCase();
      const name = (producto.name ?? producto.nombre ?? '').trim();
      const centerCode = (producto.centerCode ?? producto.centroCodigo ?? '').trim().toUpperCase();
      if (!name || centerCode !== 'MA1') return false;

      const upperName = name.toUpperCase();
      if (type === 'aula' && !isCanonicalDeskProducto(producto)) {
        return upperName.startsWith('MA1A');
      }
      if (isDeskProducto(producto)) {
        if (isCanonicalDeskProducto(producto)) return true;
        const deskMatch = upperName.match(/^MA1[-_]?O1[-_ ]?(\d{1,2})$/);
        if (!deskMatch) return false;
        const numero = parseInt(deskMatch[1], 10);
        return numero >= 1 && numero <= 16;
      }
      return false;
    });

    const aulas = filteredProductos.filter((p) => {
      const t = (p.type ?? p.tipo ?? '').trim().toLowerCase();
      return t === 'aula' && !isCanonicalDeskProducto(p);
    });
    const mesas = filteredProductos.filter(isDeskProducto);

    const aulaSpaces = aulas.map((producto) => {
      const rawType = (producto.type ?? producto.tipo ?? '').trim();
      const name = (producto.name ?? producto.nombre ?? '').trim();
      const pc = (producto.centerCode ?? producto.centroCodigo ?? '').trim();
      const pcUpper = pc.toUpperCase();
      const matchingCentro = centros.find((c) => (c.code ?? '').toUpperCase() === pcUpper);
      const centerName = matchingCentro?.label ?? pc;
      const city = matchingCentro?.city ?? '';

      return {
        id: producto.id,
        name,
        productName: name,
        slug: name.toLowerCase(),
        type: 'meeting_room',
        typeLabel: rawType || 'Meeting room',
        image: producto.heroImage || '',
        capacity: producto.capacity != null ? String(producto.capacity) : '—',
        priceFrom: producto.priceFrom,
        price: producto.priceFrom != null ? `€ ${producto.priceFrom}` : '€ —',
        priceUnit: producto.priceUnit || '/h',
        description: producto.description || producto.subtitle || `${rawType} - ${name}`,
        subtitle: producto.subtitle || '',
        location: city || centerName || 'Málaga',
        instantBooking: producto.instantBooking !== false,
        centroCode: pc || undefined,
        centerName: centerName || undefined,
        isBookable: true,
        // Keep raw producto for BookingFlowContext
        _producto: producto,
        _centro: matchingCentro || null,
      };
    });

    const deskCard = (() => {
      if (mesas.length === 0) return null;
      const sample = mesas[0];
      const pc = (sample.centerCode ?? sample.centroCodigo ?? '').trim();
      const pcUpper = pc.toUpperCase();
      const matchingCentro = centros.find((c) => (c.code ?? '').toUpperCase() === pcUpper);
      const centerName = matchingCentro?.label ?? pc;
      const city = matchingCentro?.city ?? '';

      // Use canonical desk producto if available
      const canonical = mesas.find(isCanonicalDeskProducto) || sample;

      return {
        id: `desks-${pcUpper || 'ma1'}`,
        name: canonical.name || 'MA1 Desks',
        description: canonical.description || `${mesas.length} desk${mesas.length === 1 ? '' : 's'} available for booking`,
        productName: 'MA1 Desks',
        slug: 'ma1-desks',
        type: 'desk',
        image: canonical.heroImage || sample.heroImage || '',
        capacity: canonical.capacity != null ? String(canonical.capacity) : String(mesas.length),
        price: canonical.priceFrom != null ? `€ ${canonical.priceFrom}` : '€ 90',
        priceUnit: '/month',
        location: city || centerName || 'Málaga',
        instantBooking: true,
        centroCode: pc || undefined,
        availableCount: mesas.length,
        centerName: centerName || undefined,
        isBookable: true,
        _producto: canonical,
        _centro: matchingCentro || null,
      };
    })();

    const mapped = deskCard ? [...aulaSpaces, deskCard] : aulaSpaces;

    let filtered = mapped.filter((s) => {
      if (activeTab === 0) return s.type === 'meeting_room';
      if (activeTab === 1) return s.type === 'desk';
      return true;
    });

    if (cityFilter && cityFilter.trim() !== '') {
      const cf = cityFilter.trim().toLowerCase();
      filtered = filtered.filter((s) => (s.location ?? '').toLowerCase() === cf);
    }

    if (people && people.trim() !== '') {
      const userCount = parseInt(people);
      if (!isNaN(userCount)) {
        filtered = filtered.filter((s) => {
          if (!s.capacity) return false;
          const parts = s.capacity.split('-');
          if (parts.length === 1) {
            const cap = parseInt(parts[0]);
            return !isNaN(cap) && userCount <= cap;
          }
          const [min, max] = parts.map(Number);
          return !isNaN(min) && !isNaN(max) && userCount >= min && userCount <= max;
        });
      }
    }

    return filtered;
  }, [productos, centros, cityFilter, people, activeTab]);

  const handleBookNow = useCallback(
    (space) => {
      if (typeof onBookNow === 'function') {
        onBookNow(space);
      }
    },
    [onBookNow]
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>
      {/* Back button (only in admin mode, when there's a calendar to go back to) */}
      {onClose && (
        <Button
          onClick={onClose}
          startIcon={<ArrowBackRoundedIcon />}
          sx={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'text.secondary',
            textTransform: 'none',
            px: 1,
            mb: 1,
            borderRadius: '6px',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', color: 'text.primary' },
          }}
        >
          {t('catalog.backToCalendar')}
        </Button>
      )}

      {/* Title */}
      <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
        {t('catalog.heroTitle')}
      </Typography>
      <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 4 }}>
        {t('catalog.heroSubtitle')}
      </Typography>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 4,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 },
        }}
      >
        {SPACE_TYPES.map((st) => (
          <Tab key={st.value} icon={st.icon} label={t(st.labelKey)} iconPosition="start" />
        ))}
      </Tabs>

      {/* Airbnb-style pill search bar */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: { xs: 3, sm: 999 },
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        {/* Where */}
        <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <Autocomplete
            size="small"
            freeSolo
            options={cityOptions.filter((o) => !o.isAllOption)}
            getOptionLabel={(o) => (typeof o === 'string' ? o : o?.label ?? '')}
            value={cityFilter || null}
            onChange={(_, v) => setCityFilter(typeof v === 'string' ? v : v && v.id !== 'all' ? v.label : '')}
            onInputChange={(_, v, reason) => { if (reason === 'input') setCityFilter(v); }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                placeholder={t('catalog.location')}
                label={t('catalog.where')}
                slotProps={{ input: { ...params.InputProps, disableUnderline: true }, inputLabel: { shrink: true } }}
                sx={{
                  '& .MuiInputLabel-root': { fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em' },
                  '& .MuiInput-input': { fontSize: '0.875rem', color: 'text.secondary', py: 0.25 },
                }}
              />
            )}
          />
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

        {/* When */}
        <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            variant="standard"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            label={t('catalog.when')}
            fullWidth
            slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
            sx={{
              '& .MuiInputLabel-root': { fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em' },
              '& .MuiInput-input': { fontSize: '0.875rem', color: checkIn ? 'text.primary' : 'text.secondary', py: 0.25 },
            }}
          />
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

        {/* Time */}
        <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            variant="standard"
            type="time"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            label={t('catalog.time')}
            placeholder={t('catalog.timePlaceholder')}
            fullWidth
            slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
            sx={{
              '& .MuiInputLabel-root': { fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em' },
              '& .MuiInput-input': { fontSize: '0.875rem', color: timeFilter ? 'text.primary' : 'text.secondary', py: 0.25 },
            }}
          />
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

        {/* Who */}
        <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            variant="standard"
            type="number"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            label={t('catalog.who')}
            placeholder={t('catalog.numberOfUsers')}
            fullWidth
            slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
            sx={{
              '& .MuiInputLabel-root': { fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em' },
              '& .MuiInput-input': { fontSize: '0.875rem', color: people ? 'text.primary' : 'text.secondary', py: 0.25 },
              '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': { display: 'none' },
              '& input[type=number]': { MozAppearance: 'textfield' },
            }}
          />
        </Box>

        {/* Search button */}
        <Box sx={{ px: { xs: 2, sm: 1.5 }, py: { xs: 1.5, sm: 0 }, width: { xs: '100%', sm: 'auto' }, display: 'flex', justifyContent: 'center' }}>
          <IconButton
            aria-label={t('catalog.searchSpaces')}
            sx={{
              bgcolor: 'primary.main',
              color: 'common.white',
              width: 44,
              height: 44,
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <SearchRoundedIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Results Count */}
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          {t('catalog.showingCount', { count: filteredSpaces.length })}
        </Typography>
      </Stack>

      {/* Loading state */}
      {productosLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Space card grid */}
      {!productosLoading && (
        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: 'repeat(1, minmax(0, 1fr))',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            alignItems: 'stretch',
          }}
        >
          {filteredSpaces.map((space) => (
            <SpaceCard key={space.id} space={space} onBookNow={handleBookNow} />
          ))}
        </Box>
      )}

      {/* Empty state */}
      {!productosLoading && filteredSpaces.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {t('catalog.noResults')}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            {t('catalog.noResultsHint')}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
