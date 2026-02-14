import { useCallback, useEffect, useMemo, useState } from 'react';
import { alpha } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { fetchPublicAvailability } from '../../api/bookings';
import RoomCalendarGrid, { CalendarLegend } from './RoomCalendarGrid';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloseIcon from '@mui/icons-material/Close';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';

import AcUnitRoundedIcon from '@mui/icons-material/AcUnitRounded';
import AlarmRoundedIcon from '@mui/icons-material/AlarmRounded';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import CoffeeMakerRoundedIcon from '@mui/icons-material/CoffeeMakerRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import HeadsetMicRoundedIcon from '@mui/icons-material/HeadsetMicRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import MoneyOffRoundedIcon from '@mui/icons-material/MoneyOffRounded';
import OpacityRoundedIcon from '@mui/icons-material/OpacityRounded';
import PanoramaRoundedIcon from '@mui/icons-material/PanoramaRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import TvRoundedIcon from '@mui/icons-material/TvRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import WeekendRoundedIcon from '@mui/icons-material/WeekendRounded';
import WifiRoundedIcon from '@mui/icons-material/WifiRounded';

// ── Icon pickers (same as booking app) ──

const pickAmenityIcon = (label) => {
  if (!label) return AppsRoundedIcon;
  const n = label.toLowerCase();
  if (n.includes('alarma')) return AlarmRoundedIcon;
  if (n.includes('marketing')) return CampaignRoundedIcon;
  if (n.includes('escaner') || n.includes('impresora')) return PrintRoundedIcon;
  if (n.includes('soporte')) return HeadsetMicRoundedIcon;
  if (n.includes('visa') || n.includes('coworking')) return CreditCardRoundedIcon;
  if (n.includes('taquilla')) return LockRoundedIcon;
  if (n.includes('agua')) return OpacityRoundedIcon;
  if (n.includes('wifi') || n.includes('internet')) return WifiRoundedIcon;
  if (n.includes('pantalla') || n.includes('screen') || n.includes('tv')) return TvRoundedIcon;
  if (n.includes('pizarra') || n.includes('whiteboard') || n.includes('rotulador')) return EditNoteRoundedIcon;
  if (n.includes('climat') || n.includes('aire') || n.includes('ac')) return AcUnitRoundedIcon;
  if (n.includes('coffee') || n.includes('café')) return CoffeeMakerRoundedIcon;
  if (n.includes('acceso') || n.includes('llave') || n.includes('24/7')) return KeyRoundedIcon;
  if (n.includes('híbrido') || n.includes('video') || n.includes('stream')) return VideocamRoundedIcon;
  if (n.includes('mesa')) return MeetingRoomRoundedIcon;
  if (n.includes('vista') || n.includes('panor') || n.includes('ventana')) return PanoramaRoundedIcon;
  if (n.includes('mobiliario') || n.includes('modular')) return WeekendRoundedIcon;
  return AppsRoundedIcon;
};

const pickPolicyIcon = (text) => {
  if (!text) return ReportProblemRoundedIcon;
  const n = text.toLowerCase();
  if (n.includes('modific')) return AutorenewRoundedIcon;
  if (n.includes('email') || n.includes('correo')) return MailOutlineRoundedIcon;
  if (n.includes('devolu') || n.includes('reembolso') || n.includes('dinero')) return MoneyOffRoundedIcon;
  return ReportProblemRoundedIcon;
};

const pickInstructionIcon = (text) => {
  if (!text) return InfoOutlinedIcon;
  const n = text.toLowerCase();
  if (n.includes('solicita') || n.includes('reserva') || n.includes('día')) return EventAvailableRoundedIcon;
  if (n.includes('factura') || n.includes('pago') || n.includes('enlace')) return ReceiptLongRoundedIcon;
  if (n.includes('instruccion') || n.includes('acceso') || n.includes('llave')) return VpnKeyRoundedIcon;
  return InfoOutlinedIcon;
};

const DEFAULT_CANCELLATION_POLICY = [
  'La fecha de la reserva podrá modificarse hasta 24 h antes del inicio.',
  'La modificación debe confirmarse por email.',
  'No se realizará devolución en caso de no asistencia.',
];

const DEFAULT_BOOKING_INSTRUCTIONS = [
  'Solicita el día de tu reserva.',
  'Te confirmaremos disponibilidad y enviaremos la factura.',
  'Tras el pago recibirás instrucciones de acceso.',
];

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function RoomDetail({ space, onBack, onStartBooking }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Availability calendar state
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [bloqueos, setBloqueos] = useState([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState(null);

  const producto = space?._producto || {};

  const name = space?.name || producto.name || '';
  const centroName = space?.centerName || space?._centro?.label || '';
  const subtitle = space?.subtitle || producto.subtitle || '';
  const description =
    space?.description ||
    producto.description ||
    'Nuestra Aula está equipada para reuniones, eventos y formaciones. Espacio luminoso con conexión de alta velocidad, pizarra y un ambiente profesional listo para tus clientes.';
  const capacity = space?.capacity || (producto.capacity != null ? String(producto.capacity) : '');
  const priceFrom = producto.priceFrom ?? space?.priceFrom ?? null;
  const priceUnit = space?.priceUnit || producto.priceUnit || '';

  const amenities = (() => {
    if (Array.isArray(producto.amenities) && producto.amenities.length > 0) return producto.amenities;
    if (Array.isArray(space?.tags) && space.tags.length > 0) return space.tags;
    return [];
  })();

  const cancellationPolicy = producto.cancellationPolicy || DEFAULT_CANCELLATION_POLICY;
  const bookingInstructions = producto.bookingInstructions || DEFAULT_BOOKING_INSTRUCTIONS;

  const galleryImages = (() => {
    const fromProducto = Array.isArray(producto.images) ? producto.images.filter(Boolean) : [];
    if (fromProducto.length > 0) return fromProducto;
    const hero = producto.heroImage || space?.image;
    return hero ? [hero] : [];
  })();

  const spotlightImages = galleryImages.slice(0, 5);
  const featureImage = spotlightImages[0];
  const secondaryImages = spotlightImages.slice(1, 5);
  const xsGalleryAreas =
    ['"hero"', ...secondaryImages.map((_, i) => `"thumb${i + 1}"`)].join(' ') || '"hero"';

  const mapEmbedUrl =
    producto.mapEmbedUrl ??
    `https://maps.google.com/maps?q=BeWorking+Coworking+${encodeURIComponent(centroName || 'Málaga')}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  // Fetch availability when date changes
  const productName = producto.name || space?.name || '';
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    setAvailLoading(true);
    setAvailError(null);
    fetchPublicAvailability({
      date: selectedDate,
      products: productName ? [productName] : undefined,
    })
      .then((data) => {
        if (!cancelled) {
          setBloqueos(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setAvailError(err?.message || 'Unable to fetch availability.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAvailLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [selectedDate, productName]);

  const roomBloqueos = useMemo(() => {
    if (!productName) return bloqueos;
    return bloqueos.filter(
      (item) => (item?.producto?.nombre || '').toLowerCase() === productName.toLowerCase()
    );
  }, [bloqueos, productName]);

  const dateLabel = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const handleShare = useCallback(() => {
    const text = `${name} — ${centroName}`;
    if (navigator.share) {
      navigator.share({ title: text, text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }, [name, centroName]);

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%', py: 4 }}>
      <Stack spacing={4}>
        {/* Back button */}
        <Button
          onClick={onBack}
          startIcon={<ArrowBackRoundedIcon />}
          sx={{
            alignSelf: 'flex-start',
            textTransform: 'none',
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: '0.875rem',
            px: 1,
            borderRadius: '6px',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', color: 'text.primary' },
          }}
        >
          Back
        </Button>

        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Stack spacing={1}>
            {centroName && (
              <Typography
                variant="overline"
                sx={{ color: 'text.secondary', letterSpacing: 1.2, fontSize: '0.75rem' }}
              >
                {centroName}
              </Typography>
            )}
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}
            >
              {name}
            </Typography>
            {subtitle && (
              <Typography
                variant="h6"
                sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '1.25rem' }}
              >
                {subtitle}
              </Typography>
            )}
            <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1rem' }}>
              {`Capacidad ${capacity || '—'} personas · desde ${priceFrom ?? '—'} ${priceUnit}`}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              size="small"
              startIcon={<IosShareOutlinedIcon />}
              variant="text"
              onClick={handleShare}
              sx={{ textTransform: 'none', fontWeight: 700, color: 'text.primary' }}
            >
              Compartir
            </Button>
            <Button
              size="small"
              startIcon={<DownloadOutlinedIcon />}
              variant="text"
              onClick={() => {
                if (featureImage) {
                  const link = document.createElement('a');
                  link.href = featureImage;
                  link.download = `${name || 'room'}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              sx={{ textTransform: 'none', fontWeight: 700, color: 'text.primary' }}
            >
              Guardar
            </Button>
          </Stack>
        </Stack>

        {/* Gallery */}
        {featureImage ? (
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
                gridTemplateRows: { md: 'repeat(2, 220px)' },
                gridTemplateAreas: {
                  xs: xsGalleryAreas,
                  md: '"hero hero thumb1 thumb2" "hero hero thumb3 thumb4"',
                },
                '& .gallery-hero': { gridArea: 'hero', height: { xs: 260, md: '100%' } },
                '& .gallery-thumb': { height: { xs: 180, md: '100%' } },
              }}
            >
              <Box
                component="img"
                src={featureImage}
                alt={`${name} principal`}
                className="gallery-hero"
                onClick={() => { setCarouselIndex(0); setGalleryOpen(true); }}
                sx={{ width: '100%', objectFit: 'cover', borderRadius: 3, cursor: 'pointer' }}
              />
              {secondaryImages.map((image, index) => (
                <Box
                  key={`${image}-${index}`}
                  component="img"
                  src={image}
                  alt={`${name} ${index + 2}`}
                  className="gallery-thumb"
                  onClick={() => { setCarouselIndex(index + 1); setGalleryOpen(true); }}
                  sx={{
                    width: '100%',
                    objectFit: 'cover',
                    borderRadius: 3,
                    gridArea: `thumb${index + 1}`,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Box>

            <Button
              onClick={() => { setCarouselIndex(0); setGalleryOpen(true); }}
              startIcon={<PhotoLibraryOutlinedIcon />}
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                borderRadius: 999,
                backgroundColor: 'background.paper',
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                boxShadow: (theme) => theme.shadows[6],
                '&:hover': { backgroundColor: 'background.default' },
              }}
            >
              {`${galleryImages.length} photos`}
            </Button>
          </Box>
        ) : null}

        {/* Content: left column + right sidebar */}
        <Grid container spacing={5}>
          <Grid item xs={12} md={7}>
            <Stack spacing={4}>
              {/* Description */}
              <section>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, fontSize: '1.5rem' }}>
                  Descripción
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.65, fontSize: '1rem' }}>
                  {description}
                </Typography>
              </section>

              {/* Amenities */}
              {amenities.length > 0 && (
                <section>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: '1.5rem' }}>
                    Servicios incluidos
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5}>
                    {amenities.map((amenity) => {
                      const AmenityIcon = pickAmenityIcon(amenity);
                      return (
                        <Box key={amenity}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1,
                              py: 1,
                              px: 1.75,
                              borderRadius: 999,
                              bgcolor: 'background.paper',
                              border: '1px solid',
                              borderColor: 'divider',
                              transition: 'box-shadow 0.2s, border-color 0.2s',
                              '&:hover': {
                                borderColor: (theme) => alpha(theme.palette.primary.main, 0.4),
                                boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
                              },
                            }}
                          >
                            <AmenityIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                              {amenity}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </section>
              )}

              {/* Cancellation policy */}
              <section>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, fontSize: '1.5rem' }}>
                  Política de cancelación
                </Typography>
                <Stack spacing={1.25}>
                  {cancellationPolicy.map((item) => {
                    const PolicyIcon = pickPolicyIcon(item);
                    return (
                      <Stack direction="row" spacing={1.5} key={item}>
                        <PolicyIcon sx={{ color: 'primary.main', mt: 0.35, flexShrink: 0 }} fontSize="small" />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {item}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </section>

              {/* Booking instructions */}
              <section>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, fontSize: '1.5rem' }}>
                  Instrucciones
                </Typography>
                <Stack spacing={1.25}>
                  {bookingInstructions.map((item) => {
                    const InstructionIcon = pickInstructionIcon(item);
                    return (
                      <Stack direction="row" spacing={1.5} key={item}>
                        <InstructionIcon sx={{ color: 'primary.main', mt: 0.35, flexShrink: 0 }} fontSize="small" />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {item}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </section>
            </Stack>
          </Grid>

          {/* Sidebar — availability + CTA */}
          <Grid item xs={12} md={5}>
            <Stack
              spacing={3}
              sx={{
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 3,
                p: 3,
                bgcolor: 'background.paper',
                position: { md: 'sticky' },
                top: { md: 24 },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                Disponibilidad
              </Typography>

              <TextField
                size="small"
                label="Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              {availError ? (
                <Alert severity="error">{availError}</Alert>
              ) : null}

              {availLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  <CalendarLegend />
                  <RoomCalendarGrid
                    room={{ id: producto.id || space?.id, name, capacity }}
                    dateLabel={dateLabel}
                    bloqueos={roomBloqueos}
                    interactive={false}
                  />
                </Stack>
              )}

              <Divider />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {capacity ? `Capacidad: ${capacity} personas` : ''}
                {capacity && priceFrom != null ? ' · ' : ''}
                {priceFrom != null ? `desde ${priceFrom} ${priceUnit}` : ''}
              </Typography>
              <Button
                onClick={onStartBooking}
                variant="contained"
                size="large"
                sx={{
                  alignSelf: 'center',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  backgroundColor: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.dark' },
                  borderRadius: 999,
                  px: 5,
                  py: 1.25,
                }}
              >
                Start booking
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Map */}
        <section>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: '1.5rem' }}>
            Ubicación
          </Typography>
          <Box
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'grey.200',
              minHeight: 320,
              bgcolor: 'background.paper',
            }}
          >
            <Box
              component="iframe"
              title={`Mapa de ${name}`}
              src={mapEmbedUrl}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              sx={{ width: '100%', height: 360, border: 0 }}
            />
          </Box>
        </section>
      </Stack>

      {/* Fullscreen gallery carousel */}
      <Dialog
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        fullScreen
        PaperProps={{ sx: { bgcolor: 'rgba(0,0,0,0.92)' } }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
          <Typography variant="body2" sx={{ color: 'grey.400', fontWeight: 600 }}>
            {`${carouselIndex + 1} / ${galleryImages.length}`}
          </Typography>
          <IconButton
            onClick={() => setGalleryOpen(false)}
            sx={{ color: 'grey.300', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            px: { xs: 2, md: 8 },
            pb: 4,
            userSelect: 'none',
          }}
        >
          {galleryImages.length > 1 && (
            <IconButton
              onClick={() => setCarouselIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
              sx={{
                position: 'absolute',
                left: { xs: 8, md: 24 },
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                width: 48,
                height: 48,
              }}
            >
              <ChevronLeftRoundedIcon fontSize="large" />
            </IconButton>
          )}

          <Box
            component="img"
            src={galleryImages[carouselIndex]}
            alt={`${name} ${carouselIndex + 1}`}
            sx={{ maxHeight: 'calc(100vh - 140px)', maxWidth: '100%', objectFit: 'contain', borderRadius: 2 }}
          />

          {galleryImages.length > 1 && (
            <IconButton
              onClick={() => setCarouselIndex((prev) => (prev + 1) % galleryImages.length)}
              sx={{
                position: 'absolute',
                right: { xs: 8, md: 24 },
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                width: 48,
                height: 48,
              }}
            >
              <ChevronRightRoundedIcon fontSize="large" />
            </IconButton>
          )}
        </Box>

        {galleryImages.length > 1 && (
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ pb: 3, px: 2, overflowX: 'auto' }}>
            {galleryImages.map((image, index) => (
              <Box
                key={`thumb-${index}`}
                component="img"
                src={image}
                alt={`thumbnail ${index + 1}`}
                onClick={() => setCarouselIndex(index)}
                sx={{
                  width: 56,
                  height: 40,
                  objectFit: 'cover',
                  borderRadius: 1,
                  cursor: 'pointer',
                  opacity: index === carouselIndex ? 1 : 0.4,
                  border: index === carouselIndex ? '2px solid #fff' : '2px solid transparent',
                  transition: 'opacity 0.2s, border-color 0.2s',
                  flexShrink: 0,
                  '&:hover': { opacity: 0.8 },
                }}
              />
            ))}
          </Stack>
        )}
      </Dialog>
    </Box>
  );
}
