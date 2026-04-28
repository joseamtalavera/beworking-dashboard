import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import ButtonBase from '@mui/material/ButtonBase';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { alpha, useTheme } from '@mui/material/styles';
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
  { id: 'write', label: 'Write', icon: EditOutlinedIcon },
  { id: 'learn', label: 'Learn', icon: SchoolOutlinedIcon },
  { id: 'code', label: 'Code', icon: CodeRoundedIcon },
  { id: 'life', label: 'Life stuff', icon: LocalCafeOutlinedIcon },
  { id: 'gmail', label: 'From Gmail', icon: EmailOutlinedIcon },
];

const MODELS = [
  { id: 'opus-4-7-adaptive', label: 'Opus 4.7', mode: 'Adaptive' },
  { id: 'opus-4-7', label: 'Opus 4.7', mode: 'Standard' },
  { id: 'sonnet-4-6', label: 'Sonnet 4.6', mode: 'Standard' },
  { id: 'haiku-4-5', label: 'Haiku 4.5', mode: 'Fast' },
];

const MariaAI = ({ userProfile }) => {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const firstName = (userProfile?.name || 'there').trim().split(/\s+/)[0];

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
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ mb: 5 }}>
          <AutoAwesomeRoundedIcon sx={{ fontSize: 36, color: '#d97757' }} />
          <Typography
            sx={{
              fontFamily: '"Tiempos Headline", "Source Serif Pro", "Georgia", serif',
              fontWeight: 400,
              fontSize: { xs: '2rem', sm: '2.5rem' },
              color: 'text.primary',
              letterSpacing: '-0.01em',
            }}
          >
            Hey there, {firstName}
          </Typography>
        </Stack>

        <Box
          sx={{
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 24px rgba(15,23,42,0.06)',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            '&:focus-within': {
              borderColor: alpha(accent, 0.5),
              boxShadow: `0 0 0 4px ${alpha(accent, 0.08)}, 0 4px 24px rgba(15,23,42,0.06)`,
            },
          }}
        >
          <InputBase
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            multiline
            minRows={3}
            maxRows={10}
            sx={{
              width: '100%',
              px: 3,
              pt: 2.5,
              pb: 1,
              fontSize: '1rem',
              color: 'text.primary',
              '& textarea::placeholder': { color: 'text.secondary', opacity: 1 },
            }}
          />
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, py: 1 }}>
            <IconButton size="small" sx={{ color: 'text.secondary' }} aria-label="Attach">
              <AddRoundedIcon fontSize="small" />
            </IconButton>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <ButtonBase
                onClick={(e) => setModelAnchor(e.currentTarget)}
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1.5,
                  fontSize: '0.8125rem',
                  color: 'text.secondary',
                  '&:hover': { backgroundColor: alpha('#000', 0.04) },
                }}
              >
                <Typography component="span" sx={{ fontSize: '0.8125rem', color: 'text.primary', fontWeight: 500, mr: 0.75 }}>
                  {model.label}
                </Typography>
                <Typography component="span" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                  {model.mode}
                </Typography>
                <ArrowDropDownRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </ButtonBase>
              <IconButton size="small" sx={{ color: 'text.secondary' }} aria-label="Voice">
                <GraphicEqRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        <Menu
          anchorEl={modelAnchor}
          open={!!modelAnchor}
          onClose={() => setModelAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          {MODELS.map((m) => (
            <MenuItem
              key={m.id}
              selected={m.id === model.id}
              onClick={() => { setModel(m); setModelAnchor(null); }}
              sx={{ fontSize: '0.875rem' }}
            >
              <Typography component="span" sx={{ fontWeight: 500, mr: 1 }}>{m.label}</Typography>
              <Typography component="span" sx={{ color: 'text.secondary' }}>{m.mode}</Typography>
            </MenuItem>
          ))}
        </Menu>

        <Stack
          direction="row"
          spacing={1.25}
          justifyContent="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 3 }}
        >
          {SUGGESTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <ButtonBase
                key={s.id}
                onClick={() => setMessage((prev) => (prev ? prev : `${s.label}: `))}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.75,
                  py: 0.875,
                  borderRadius: 999,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  fontSize: '0.8125rem',
                  color: 'text.primary',
                  transition: 'background-color 0.12s ease, border-color 0.12s ease',
                  '&:hover': {
                    backgroundColor: alpha('#000', 0.03),
                    borderColor: alpha('#000', 0.16),
                  },
                }}
              >
                <Icon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography component="span" sx={{ fontSize: '0.8125rem', color: 'text.primary' }}>
                  {s.label}
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
