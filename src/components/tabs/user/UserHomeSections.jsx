import { useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import RecordVoiceOverRoundedIcon from '@mui/icons-material/RecordVoiceOverRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import i18n from '../../../i18n/i18n.js';
import { tokens } from '../../../theme/tokens.js';

// Editorial home sections for the user Overview: News, Calendar (their bookings),
// and Interviews (member spotlight). Content is curated and kept bilingual inline
// here so it's quick to edit — it isn't shared anywhere else.
const isEN = () => (i18n.language || 'es').toLowerCase().startsWith('en');
const L = (es, en) => (isEN() ? en : es);

const SectionHeader = ({ icon, title, subtitle }) => (
  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
    {icon}
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.015em', color: 'common.black', lineHeight: 1.2 }}>
        {title}
      </Typography>
      {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
    </Box>
  </Stack>
);

/* ── News ───────────────────────────────────────────── */
const NewsSection = ({ setActiveTab, onViewPlans }) => {
  const theme = useTheme();
  const green = theme.palette.brand?.green || '#009624';

  const items = [
    {
      key: 'bekey',
      featured: true,
      eyebrow: L('Novedad · Acceso', 'New · Access'),
      title: L('Abre las puertas desde la app', 'Open doors from the app'),
      body: L(
        'Ya tienes BeKey: abre la puerta de calle y tu espacio deslizando en la app, sin llaves ni tarjetas. Tu PIN funciona como alternativa en el teclado.',
        'You now have BeKey: open the street door and your space by sliding in the app — no keys, no cards. Your PIN works as a keypad fallback.',
      ),
      cta: L('Ir a BeKey', 'Go to BeKey'),
      onClick: () => setActiveTab?.('BeKey'),
      icon: <VpnKeyRoundedIcon />,
    },
    {
      key: 'app',
      eyebrow: L('Nuevo', 'New'),
      title: L('Tu nuevo panel BeWorking', 'Your new BeWorking dashboard'),
      body: L(
        'Reservas, facturas, domicilio fiscal y acceso, todo en un mismo sitio. Y con el plan PRO, tu web profesional con dominio propio.',
        'Bookings, invoices, business address and access — all in one place. And with the PRO plan, your professional website with its own domain.',
      ),
      cta: L('Ver planes', 'See plans'),
      onClick: () => onViewPlans?.(),
      icon: <RocketLaunchRoundedIcon />,
    },
    {
      key: 'rooms',
      eyebrow: L('Espacios', 'Spaces'),
      title: L('Reserva salas en segundos', 'Book rooms in seconds'),
      body: L(
        'Salas de reuniones y mesas de coworking disponibles al instante. Elige, reserva y entra con BeKey.',
        'Meeting rooms and coworking desks available instantly. Pick, book and walk in with BeKey.',
      ),
      cta: L('Reservar', 'Book now'),
      onClick: () => setActiveTab?.('Booking'),
      icon: <MeetingRoomRoundedIcon />,
    },
    {
      key: 'community',
      eyebrow: L('Comunidad', 'Community'),
      title: L('Conecta con la comunidad', 'Connect with the community'),
      body: L(
        'BeWorking es más que un espacio: profesionales y empresas que colaboran, comparten y crecen juntos.',
        'BeWorking is more than a space: professionals and companies who collaborate, share and grow together.',
      ),
      icon: <GroupsRoundedIcon />,
    },
  ];

  const Card = ({ item }) => (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${tokens.radius.lg}px`,
        background: item.featured
          ? `linear-gradient(135deg, ${alpha(green, 0.12)} 0%, ${alpha(green, 0.03)} 60%, ${theme.palette.background.paper} 100%)`
          : theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          width: 40, height: 40, borderRadius: '12px', mb: 0.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: alpha(green, 0.12), color: green,
        }}
      >
        {item.icon}
      </Box>
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: green, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {item.eyebrow}
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: item.featured ? '1.25rem' : '1.05rem', letterSpacing: '-0.015em', color: 'common.black', lineHeight: 1.2 }}>
        {item.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
        {item.body}
      </Typography>
      {item.cta && (
        <Button
          onClick={item.onClick}
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ alignSelf: 'flex-start', mt: 0.5, px: 0, textTransform: 'none', fontWeight: 700, color: green, '&:hover': { bgcolor: 'transparent', opacity: 0.85 } }}
        >
          {item.cta}
        </Button>
      )}
    </Paper>
  );

  const featured = items.find((i) => i.featured);
  const rest = items.filter((i) => !i.featured);

  return (
    <Box>
      <SectionHeader
        icon={<RocketLaunchRoundedIcon sx={{ color: green }} />}
        title={L('Novedades', 'What’s new')}
        subtitle={L('Lo último de BeWorking', 'The latest from BeWorking')}
      />
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' } }}>
        <Card item={featured} />
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr' }}>
          <Card item={rest[0]} />
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, mt: 2 }}>
        {rest.slice(1).map((item) => <Card key={item.key} item={item} />)}
      </Box>
    </Box>
  );
};

/* ── Calendar (the user's bookings) ─────────────────── */
const WEEKDAYS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAYS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const BookingsCalendar = ({ bookings = [], setActiveTab }) => {
  const theme = useTheme();
  const green = theme.palette.brand?.green || '#009624';
  const [offset, setOffset] = useState(0); // months from current

  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const locale = isEN() ? 'en-US' : 'es-ES';

  // Map day-of-month -> count of bookings in the viewed month.
  const byDay = useMemo(() => {
    const m = new Map();
    bookings.forEach((b) => {
      const d = new Date(b.fechaIni);
      if (d.getFullYear() === year && d.getMonth() === month) {
        m.set(d.getDate(), (m.get(d.getDate()) || 0) + 1);
      }
    });
    return m;
  }, [bookings, year, month]);

  const upcoming = useMemo(
    () => [...bookings]
      .filter((b) => new Date(b.fechaIni) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
      .sort((a, b) => new Date(a.fechaIni) - new Date(b.fechaIni))
      .slice(0, 5),
    [bookings], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const weekdays = isEN() ? WEEKDAYS_EN : WEEKDAYS_ES;

  return (
    <Box>
      <SectionHeader
        icon={<EventAvailableRoundedIcon sx={{ color: green }} />}
        title={L('Calendario', 'Calendar')}
        subtitle={L('Tus próximas reservas', 'Your upcoming bookings')}
      />
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {/* Month grid */}
        <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, border: '1px solid', borderColor: 'divider', borderRadius: `${tokens.radius.lg}px` }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <IconButton size="small" onClick={() => setOffset((o) => o - 1)}><ChevronLeftRoundedIcon fontSize="small" /></IconButton>
            <Typography sx={{ fontWeight: 700, textTransform: 'capitalize', color: 'common.black' }}>
              {viewDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
            </Typography>
            <IconButton size="small" onClick={() => setOffset((o) => o + 1)}><ChevronRightRoundedIcon fontSize="small" /></IconButton>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
            {weekdays.map((w, i) => (
              <Typography key={i} align="center" sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', py: 0.5 }}>{w}</Typography>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <Box key={`e${i}`} />;
              const isToday = offset === 0 && day === today.getDate();
              const has = byDay.has(day);
              return (
                <Box
                  key={day}
                  sx={{
                    aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '10px', position: 'relative',
                    bgcolor: isToday ? alpha(green, 0.12) : 'transparent',
                    border: has ? `1px solid ${alpha(green, 0.5)}` : '1px solid transparent',
                  }}
                >
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: isToday || has ? 700 : 500, color: isToday ? green : 'text.primary' }}>{day}</Typography>
                  {has && <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: green, position: 'absolute', bottom: 5 }} />}
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* Upcoming list */}
        <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, border: '1px solid', borderColor: 'divider', borderRadius: `${tokens.radius.lg}px`, display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
            {L('Próximas reservas', 'Upcoming')}
          </Typography>
          {upcoming.length === 0 ? (
            <Stack spacing={1.5} alignItems="flex-start" sx={{ flex: 1, justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">{L('No tienes reservas próximas.', 'No upcoming bookings.')}</Typography>
              <Button onClick={() => setActiveTab?.('Booking')} endIcon={<ArrowForwardRoundedIcon />} sx={{ px: 0, textTransform: 'none', fontWeight: 700, color: green, '&:hover': { bgcolor: 'transparent' } }}>
                {L('Reservar ahora', 'Book now')}
              </Button>
            </Stack>
          ) : (
            <Stack spacing={1.25} sx={{ flex: 1 }}>
              {upcoming.map((b) => {
                const d = new Date(b.fechaIni);
                return (
                  <Stack key={b.id} direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: green, lineHeight: 1 }}>{d.getDate()}</Typography>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                        {d.toLocaleDateString(locale, { month: 'short' })}
                      </Typography>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 600, color: 'common.black' }}>{b.producto?.nombre || L('Reserva', 'Booking')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

/* ── Interviews (member spotlight) ──────────────────── */
const InterviewsSection = () => {
  const theme = useTheme();
  const green = theme.palette.brand?.green || '#009624';

  return (
    <Box>
      <SectionHeader
        icon={<RecordVoiceOverRoundedIcon sx={{ color: green }} />}
        title={L('Entrevistas', 'Interviews')}
        subtitle={L('Historias de la comunidad BeWorking', 'Stories from the BeWorking community')}
      />
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          border: '1px dashed',
          borderColor: alpha(green, 0.4),
          borderRadius: `${tokens.radius.lg}px`,
          background: `linear-gradient(135deg, ${alpha(green, 0.06)} 0%, ${theme.palette.background.paper} 70%)`,
          textAlign: 'center',
        }}
      >
        <Box sx={{ width: 48, height: 48, borderRadius: '14px', mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(green, 0.12), color: green }}>
          <RecordVoiceOverRoundedIcon />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'common.black', mb: 0.5 }}>
          {L('Entrevistas a la comunidad — próximamente', 'Community interviews — coming soon')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto', mb: 2 }}>
          {L(
            'Vamos a compartir las historias de los profesionales y empresas que hacen BeWorking. ¿Quieres que te entrevistemos y aparecer aquí?',
            'We’ll be sharing the stories of the professionals and companies who make BeWorking. Want to be interviewed and featured here?',
          )}
        </Typography>
        <Button
          variant="contained"
          href="mailto:info@be-working.com?subject=Entrevista%20BeWorking"
          sx={{ bgcolor: green, '&:hover': { bgcolor: theme.palette.brand?.greenHover || green }, borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
        >
          {L('Quiero participar', 'I want to take part')}
        </Button>
      </Paper>
    </Box>
  );
};

export { NewsSection, BookingsCalendar, InterviewsSection };
