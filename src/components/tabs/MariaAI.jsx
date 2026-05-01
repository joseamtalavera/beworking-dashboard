import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import ButtonBase from '@mui/material/ButtonBase';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import LocalCafeOutlinedIcon from '@mui/icons-material/LocalCafeOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';

const SUGGESTIONS = [
  { id: 'write', labelKey: 'maria.suggestions.write', fallback: 'Escribir', icon: EditOutlinedIcon },
  { id: 'learn', labelKey: 'maria.suggestions.learn', fallback: 'Aprender', icon: SchoolOutlinedIcon },
  { id: 'code', labelKey: 'maria.suggestions.code', fallback: 'Código', icon: CodeRoundedIcon },
  { id: 'life', labelKey: 'maria.suggestions.life', fallback: 'Día a día', icon: LocalCafeOutlinedIcon },
  { id: 'gmail', labelKey: 'maria.suggestions.gmail', fallback: 'Desde Gmail', icon: EmailOutlinedIcon },
];

const MODELS = [
  { id: 'opus-4-7-adaptive', label: 'Opus 4.7', mode: 'Adaptive' },
  { id: 'opus-4-7', label: 'Opus 4.7', mode: 'Standard' },
  { id: 'sonnet-4-6', label: 'Sonnet 4.6', mode: 'Standard' },
  { id: 'haiku-4-5', label: 'Haiku 4.5', mode: 'Fast' },
];

const MariaAI = ({ userProfile }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const accent = theme.palette.brand.green;
  const firstName = (userProfile?.name || '').trim().split(/\s+/)[0];

  const [message, setMessage] = useState('');
  const [model, setModel] = useState(MODELS[0]);
  const [modelAnchor, setModelAnchor] = useState(null);

  const handleSend = () => {
    if (!message.trim()) return;
    // TODO: wire to Claude API
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const greeting = firstName
    ? t('maria.greeting', { defaultValue: 'Hola, {{name}}', name: firstName })
    : t('maria.greetingFallback', { defaultValue: 'Hola' });

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 220px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 720 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ mb: 4 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: alpha(accent, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AutoAwesomeRoundedIcon sx={{ fontSize: 24, color: accent }} />
          </Box>
          <Typography
            sx={{
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 600,
              fontSize: { xs: '1.75rem', sm: '2.25rem' },
              color: 'text.primary',
              letterSpacing: '-0.025em',
            }}
          >
            {greeting}
          </Typography>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: theme.palette.background.paper,
            overflow: 'hidden',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            '&:focus-within': {
              borderColor: alpha(accent, 0.5),
              boxShadow: `0 0 0 4px ${alpha(accent, 0.08)}`,
            },
          }}
        >
          <InputBase
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('maria.placeholder', { defaultValue: '¿En qué te puedo ayudar hoy?' })}
            multiline
            minRows={3}
            maxRows={10}
            sx={{
              width: '100%',
              px: 3,
              pt: 2.5,
              pb: 1,
              fontSize: '0.95rem',
              color: 'text.primary',
              '& textarea::placeholder': { color: 'text.secondary', opacity: 1 },
            }}
          />
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, py: 1 }}>
            <IconButton
              size="small"
              sx={{ color: 'text.secondary', '&:hover': { color: accent, backgroundColor: alpha(accent, 0.08) } }}
              aria-label={t('maria.attach', { defaultValue: 'Adjuntar' })}
            >
              <AddRoundedIcon fontSize="small" />
            </IconButton>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <ButtonBase
                onClick={(e) => setModelAnchor(e.currentTarget)}
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1.5,
                  '&:hover': { backgroundColor: alpha(accent, 0.06) },
                }}
              >
                <Typography component="span" sx={{ fontSize: '0.8125rem', color: 'text.primary', fontWeight: 600, mr: 0.75 }}>
                  {model.label}
                </Typography>
                <Typography component="span" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                  {model.mode}
                </Typography>
                <ArrowDropDownRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </ButtonBase>
              <IconButton
                size="small"
                sx={{ color: 'text.secondary', '&:hover': { color: accent, backgroundColor: alpha(accent, 0.08) } }}
                aria-label={t('maria.voice', { defaultValue: 'Voz' })}
              >
                <GraphicEqRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>

        <Menu
          anchorEl={modelAnchor}
          open={!!modelAnchor}
          onClose={() => setModelAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          slotProps={{ paper: { sx: { borderRadius: 2, mt: -0.5, minWidth: 180 } } }}
        >
          {MODELS.map((m) => (
            <MenuItem
              key={m.id}
              selected={m.id === model.id}
              onClick={() => { setModel(m); setModelAnchor(null); }}
              sx={{ fontSize: '0.875rem', py: 1 }}
            >
              <Typography component="span" sx={{ fontWeight: 600, mr: 1 }}>{m.label}</Typography>
              <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>{m.mode}</Typography>
            </MenuItem>
          ))}
        </Menu>

        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 3 }}
        >
          {SUGGESTIONS.map((s) => {
            const Icon = s.icon;
            const label = t(s.labelKey, { defaultValue: s.fallback });
            return (
              <ButtonBase
                key={s.id}
                onClick={() => setMessage((prev) => (prev ? prev : `${label}: `))}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.75,
                  py: 0.875,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: theme.palette.background.paper,
                  transition: 'background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease',
                  '&:hover': {
                    backgroundColor: alpha(accent, 0.04),
                    borderColor: alpha(accent, 0.4),
                  },
                }}
              >
                <Icon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography component="span" sx={{ fontSize: '0.8125rem', color: 'text.primary', fontWeight: 500 }}>
                  {label}
                </Typography>
              </ButtonBase>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
};

export default MariaAI;
