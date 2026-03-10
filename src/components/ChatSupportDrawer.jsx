import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Drawer, Box, Typography, TextField, IconButton, CircularProgress,
  Button, Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { sendChatMessage, getChatHistory, createSupportTicket } from '../api/chat.js';

const DRAWER_WIDTH = 420;

export default function ChatSupportDrawer({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (open) {
      getChatHistory()
        .then((data) => {
          if (Array.isArray(data)) setMessages(data);
        })
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await sendChatMessage(text);
      const assistantMsg = {
        role: 'assistant',
        content: data.response || 'No response received.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error connecting to support. Please try again.', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    try {
      await createSupportTicket(ticketSubject.trim(), ticketMessage.trim());
      setTicketSent(true);
      setTicketSubject('');
      setTicketMessage('');
    } catch {
      // silent
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: 1300,
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: DRAWER_WIDTH },
          bgcolor: '#fafafa',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 2,
          bgcolor: '#fff',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SmartToyOutlinedIcon sx={{ color: 'primary.main', fontSize: 24 }} />
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>MariaAI</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Asistente de soporte</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {messages.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <SmartToyOutlinedIcon sx={{ fontSize: 48, color: 'rgba(0,0,0,0.12)', mb: 2 }} />
            <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              ¿En qué puedo ayudarte?
            </Typography>
            <Typography sx={{ color: 'text.disabled', fontSize: '0.8125rem', mt: 0.5 }}>
              Pregunta sobre tu cuenta, facturación, espacios o cualquier duda.
            </Typography>
          </Box>
        )}

        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <Box
              sx={{
                maxWidth: '85%',
                px: 2,
                py: 1.5,
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                bgcolor: msg.role === 'user' ? 'primary.main' : '#fff',
                color: msg.role === 'user' ? '#fff' : 'text.primary',
                border: msg.role === 'assistant' ? '1px solid rgba(0,0,0,0.08)' : 'none',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </Box>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
            <CircularProgress size={16} sx={{ color: 'primary.main' }} />
            <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>Pensando...</Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Ticket toggle */}
      {!showTicketForm && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Button
            size="small"
            startIcon={<SupportAgentIcon />}
            onClick={() => setShowTicketForm(true)}
            sx={{ fontSize: '0.75rem', textTransform: 'none', color: 'text.secondary' }}
          >
            Crear ticket de soporte
          </Button>
        </Box>
      )}

      {/* Ticket form */}
      {showTicketForm && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Divider sx={{ mb: 2 }} />
          {ticketSent ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography sx={{ color: 'primary.main', fontWeight: 500, fontSize: '0.875rem' }}>
                Ticket creado correctamente
              </Typography>
              <Button size="small" onClick={() => { setShowTicketForm(false); setTicketSent(false); }}
                sx={{ mt: 1, textTransform: 'none', fontSize: '0.8125rem' }}>
                Volver al chat
              </Button>
            </Box>
          ) : (
            <>
              <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', mb: 1 }}>Nuevo ticket</Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="Asunto"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                sx={{ mb: 1 }}
              />
              <TextField
                size="small"
                fullWidth
                multiline
                rows={3}
                placeholder="Describe tu problema..."
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" onClick={handleCreateTicket}
                  disabled={!ticketSubject.trim() || !ticketMessage.trim()}
                  sx={{ textTransform: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}>
                  Enviar
                </Button>
                <Button size="small" onClick={() => setShowTicketForm(false)}
                  sx={{ textTransform: 'none', fontSize: '0.8125rem' }}>
                  Cancelar
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Input */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: '#fff',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          gap: 1,
          alignItems: 'flex-end',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder="Escribe tu mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              fontSize: '0.875rem',
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={!input.trim() || loading}
          sx={{
            bgcolor: 'primary.main',
            color: '#fff',
            width: 40,
            height: 40,
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.26)' },
          }}
        >
          <SendIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Drawer>
  );
}
