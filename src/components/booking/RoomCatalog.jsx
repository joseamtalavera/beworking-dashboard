import { useCallback, useEffect, useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import DeskRoundedIcon from '@mui/icons-material/DeskRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';

import { fetchBookingCentros, fetchPublicProductos } from '../../api/bookings.js';
import SpaceCard from './SpaceCard';

const SPACE_TYPES = [
  { value: 'meeting_room', label: 'Meeting Rooms', icon: <MeetingRoomRoundedIcon /> },
  { value: 'desk', label: 'Desks', icon: <DeskRoundedIcon /> },
];

const standardFieldStyles = {
  width: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: 1,
    backgroundColor: 'background.default',
    height: '40px',
    '& fieldset': { borderColor: 'divider' },
    '& input': {
      fontSize: '0.9375rem !important',
      fontWeight: 500,
      color: 'text.primary',
      padding: '8.5px 14px !important',
      height: '100%',
    },
  },
  '& .MuiInputLabel-root': { fontSize: '0.75rem', color: 'text.disabled' },
  '& .MuiAutocomplete-input': { padding: '8.5px 14px !important' },
};

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
  const [activeTab, setActiveTab] = useState(0);
  const [cityFilter, setCityFilter] = useState('');
  const [cityOptions, setCityOptions] = useState([{ id: 'all', label: 'All locations', isAllOption: true }]);
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
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

        setCentros([{ id: 'all', label: 'All Centros', isAllOption: true }, ...options]);

        const uniqueCities = Array.from(
          new Set(
            options
              .map((o) => o.city)
              .filter((c) => typeof c === 'string' && c.trim() !== '')
              .map((c) => c.trim())
          )
        );
        setCityOptions([
          { id: 'all', label: 'All locations', isAllOption: true },
          ...uniqueCities.map((c) => ({ id: c.toLowerCase(), label: c })),
        ]);
      } catch {
        if (active) {
          setCentros([]);
          setCityOptions([{ id: 'all', label: 'All locations', isAllOption: true }]);
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
          Back to calendar
        </Button>
      )}

      {/* Title */}
      <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
        Meeting rooms and desks in your city
      </Typography>
      <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 4 }}>
        Find the perfect workspace for your needs. Choose between meeting rooms for team collaboration
        or individual desks for focused work.
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
        {SPACE_TYPES.map((t) => (
          <Tab key={t.value} icon={t.icon} label={t.label} iconPosition="start" />
        ))}
      </Tabs>

      {/* Filter bar */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Grid container spacing={1.5} sx={{ mb: 2, display: 'flex' }}>
          <Grid item xs={12} sm={6} md sx={{ flex: '1 1 0%', minWidth: 0 }}>
            <Autocomplete
              size="small"
              options={cityOptions}
              getOptionLabel={(o) => o?.label ?? ''}
              value={
                cityFilter === ''
                  ? cityOptions.find((o) => o.id === 'all') || null
                  : cityOptions.find((o) => o.label?.toLowerCase() === cityFilter.toLowerCase()) || null
              }
              onChange={(_, v) => setCityFilter(v && v.id !== 'all' ? v.label : '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Location"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={standardFieldStyles}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
                  {option.label}
                </Box>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md sx={{ flex: '1 1 0%', minWidth: 0 }}>
            <Autocomplete
              size="small"
              options={centros}
              loading={centrosLoading}
              getOptionLabel={(o) => o?.label ?? ''}
              value={
                location === ''
                  ? centros.find((c) => c.id === 'all') || null
                  : centros.find((c) => c.id !== 'all' && c.label?.toLowerCase() === (location || '').toLowerCase()) || null
              }
              onChange={(_, v) => setLocation(v && v.id !== 'all' ? v.label : '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Centro"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={standardFieldStyles}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
                  {option.label}
                </Box>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md sx={{ flex: '1 1 0%', minWidth: 0 }}>
            <TextField
              fullWidth
              label="Number of Users"
              type="number"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              placeholder="Number of Users"
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <PeopleAltRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={standardFieldStyles}
            />
          </Grid>

          <Grid item xs={12} sm={6} md sx={{ flex: '1 1 0%', minWidth: 0 }}>
            <TextField
              fullWidth
              label="Check in"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <CalendarTodayRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={standardFieldStyles}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              size="small"
              sx={{
                height: 40,
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                backgroundColor: 'primary.main',
                '&:hover': { backgroundColor: 'primary.dark' },
              }}
            >
              Search spaces
            </Button>
          </Grid>
        </Grid>

        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            Showing {filteredSpaces.length} {filteredSpaces.length === 1 ? 'space' : 'spaces'}
          </Typography>
        </Stack>
      </Paper>

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
            No spaces found matching your criteria.
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Try adjusting your filters or switching tabs.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
