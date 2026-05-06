import { useCallback, useEffect, useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '../common/ClearableTextField';
import { pillFieldSx } from '../common/pillField.js';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DeskRoundedIcon from '@mui/icons-material/DeskRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n.js';
import esBooking from '../../i18n/locales/es/booking.json';
import enBooking from '../../i18n/locales/en/booking.json';

import { fetchBookingCentros, fetchPublicProductos, fetchPublicAvailability } from '../../api/bookings.js';

// Half-hour booking slots from 06:00 to 22:00. Mirrors booking-app /malaga/salas-de-reunion.
const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 6; h <= 22; h += 1) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 22) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
})();
import SpaceCard from './SpaceCard';

if (!i18n.hasResourceBundle('es', 'booking')) {
  i18n.addResourceBundle('es', 'booking', esBooking);
  i18n.addResourceBundle('en', 'booking', enBooking);
}

const SPACE_TYPES = [
  { value: 'meeting_room', labelKey: 'catalog.meetingRooms', icon: <MeetingRoomRoundedIcon /> },
  { value: 'desk', labelKey: 'catalog.coworking', icon: <DeskRoundedIcon /> },
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

// pillFieldSx imported from src/components/common/pillField.js

const pillFieldNumberSx = (hasValue) => ({
  ...pillFieldSx(hasValue),
  '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': { display: 'none' },
  '& input[type=number]': { MozAppearance: 'textfield' },
});

export default function RoomCatalog({ onClose, onBookNow }) {
  const { t } = useTranslation('booking');
  const [activeTab, setActiveTab] = useState(0);
  const [cityFilter, setCityFilter] = useState('');
  const [cityOptions, setCityOptions] = useState([{ id: 'all', label: t('catalog.allLocations'), isAllOption: true }]);
  const [checkIn, setCheckIn] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [people, setPeople] = useState('1');

  const [centros, setCentros] = useState([]);
  const [centrosLoading, setCentrosLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [productosLoading, setProductosLoading] = useState(false);
  const [bloqueos, setBloqueos] = useState([]);

  // Fetch availability for the picked date so we can drop rooms with overlapping bloqueos.
  useEffect(() => {
    if (!checkIn) { setBloqueos([]); return; }
    let active = true;
    (async () => {
      try {
        const data = await fetchPublicAvailability({ date: checkIn });
        if (active) setBloqueos(Array.isArray(data) ? data : []);
      } catch {
        if (active) setBloqueos([]);
      }
    })();
    return () => { active = false; };
  }, [checkIn]);

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
        sizeSqm: producto.sizeSqm ?? producto.size_sqm ?? null,
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
        priceDay: 10,
        priceMonth: canonical.priceFrom ?? 90,
        location: city || centerName || 'Málaga',
        instantBooking: true,
        centroCode: pc || undefined,
        availableCount: mesas.length,
        centerName: centerName || undefined,
        isBookable: true,
        _producto: canonical,
        _centro: matchingCentro || null,
        _deskProducts: mesas.map((p) => ({
          id: p.id,
          name: p.name ?? p.nombre ?? '',
        })),
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

    if (people && String(people).trim() !== '') {
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

    // Availability filter: when date + start + end are all set, drop rooms with
    // a bloqueo overlapping the requested [startTime, endTime] window.
    if (checkIn && startTime && endTime) {
      const reqStart = new Date(`${checkIn}T${startTime}:00`).getTime();
      const reqEnd = new Date(`${checkIn}T${endTime}:00`).getTime();
      if (!Number.isNaN(reqStart) && !Number.isNaN(reqEnd) && reqEnd > reqStart) {
        const conflictingRoomNames = new Set();
        bloqueos.forEach((b) => {
          const productName = (b?.producto?.nombre || '').trim();
          if (!productName) return;
          const bStart = new Date(b.fechaIni).getTime();
          const bEnd = new Date(b.fechaFin).getTime();
          if (Number.isNaN(bStart) || Number.isNaN(bEnd)) return;
          const overlaps = bStart < reqEnd && bEnd > reqStart;
          if (overlaps) conflictingRoomNames.add(productName);
        });
        filtered = filtered.filter((s) => !conflictingRoomNames.has(s.name));
      }
    }

    return filtered;
  }, [productos, centros, cityFilter, people, activeTab, checkIn, startTime, endTime, bloqueos]);

  const handleBookNow = useCallback(
    (space) => {
      if (typeof onBookNow === 'function') {
        onBookNow(space, {
          date: checkIn || undefined,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          attendees: people || undefined,
        });
      }
    },
    [onBookNow, checkIn, startTime, endTime, people]
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
            color: 'text.primary',
            textTransform: 'none',
            px: 1,
            mb: 1,
            borderRadius: '6px',
            '&:hover': { backgroundColor: 'brand.accentSoft', color: 'brand.green' },
          }}
        >
          {t('catalog.backToCalendar')}
        </Button>
      )}

      {/* Title */}
      <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
        {t('catalog.heroTitle')}
      </Typography>
      <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
        {t('catalog.heroSubtitle')}
      </Typography>

      {/* Need-help WhatsApp CTA — mirrors booking-app catalog pattern */}
      <Button
        component="a"
        href="https://wa.me/34640369759?text=Hola,%20necesito%20ayuda%20para%20encontrar%20una%20sala"
        target="_blank"
        rel="noopener noreferrer"
        variant="outlined"
        startIcon={<WhatsAppIcon />}
        sx={{
          mb: 4,
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 999,
          borderColor: 'brand.green',
          color: 'brand.green',
          bgcolor: 'background.paper',
          '&:hover': { borderColor: 'brand.greenHover', bgcolor: 'brand.accentSoft' },
        }}
      >
        {t('catalog.needHelp', '¿Necesitas ayuda? Escríbenos por WhatsApp')}
      </Button>

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
                sx={pillFieldSx(cityFilter)}
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
            sx={pillFieldSx(checkIn)}
          />
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

        {/* Inicio */}
        <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>
            {t('catalog.startTime', 'Inicio')}
          </Typography>
          <Select
            variant="standard"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            displayEmpty
            disableUnderline
            fullWidth
            sx={{ fontSize: '0.875rem', color: startTime ? 'text.primary' : 'text.secondary' }}
          >
            <MenuItem value=""><em>{t('catalog.startTimePlaceholder', 'Hora de inicio')}</em></MenuItem>
            {TIME_SLOTS.map((slot) => (
              <MenuItem key={slot} value={slot}>{slot}</MenuItem>
            ))}
          </Select>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

        {/* Fin */}
        <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>
            {t('catalog.endTime', 'Fin')}
          </Typography>
          <Select
            variant="standard"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            displayEmpty
            disableUnderline
            fullWidth
            sx={{ fontSize: '0.875rem', color: endTime ? 'text.primary' : 'text.secondary' }}
          >
            <MenuItem value=""><em>{t('catalog.endTimePlaceholder', 'Hora de fin')}</em></MenuItem>
            {TIME_SLOTS.filter((s) => !startTime || s > startTime).map((slot) => (
              <MenuItem key={slot} value={slot}>{slot}</MenuItem>
            ))}
          </Select>
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
            sx={pillFieldNumberSx(people)}
          />
        </Box>

        {/* Search button */}
        <Box sx={{ px: { xs: 2, sm: 1.5 }, py: { xs: 1.5, sm: 0 }, width: { xs: '100%', sm: 'auto' }, display: 'flex', justifyContent: 'center' }}>
          <IconButton
            aria-label={t('catalog.searchSpaces')}
            sx={{
              bgcolor: 'brand.green',
              color: 'common.white',
              width: 44,
              height: 44,
              '&:hover': { bgcolor: 'brand.greenHover' },
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
