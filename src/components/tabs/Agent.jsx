import React, { useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
  Avatar,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  SupportAgentOutlined,
  ChatBubbleOutline,
  SmartToyOutlined,
  CloseRounded,
  SendRounded
} from '@mui/icons-material';

const Agent = ({ onClose }) => {
  const theme = useTheme();
  const accentColor = theme.palette.primary.main;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: 'agent',
      timestamp: new Date()
    }
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: message,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages([...messages, newMessage]);
      setMessage('');
      
      // Simulate agent response
      setTimeout(() => {
        const agentResponse = {
          id: messages.length + 2,
          text: "I understand your request. Let me help you with that.",
          sender: 'agent',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.default'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: accentColor, width: 40, height: 40 }}>
            <SmartToyOutlined />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              AI Agent
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%' }} />
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Online
              </Typography>
            </Stack>
          </Box>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: 'text.disabled' }}>
          <CloseRounded />
        </IconButton>
      </Box>

      {/* Chat Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          bgcolor: 'background.default'
        }}
      >
        <Stack spacing={2}>
          {messages.map((msg) => (
            <Box key={msg.id} sx={{ 
              display: 'flex', 
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              gap: 1
            }}>
              {msg.sender === 'agent' && (
                <Avatar sx={{ bgcolor: accentColor, width: 32, height: 32, mt: 0.5 }}>
                  <SmartToyOutlined sx={{ fontSize: 16 }} />
                </Avatar>
              )}
              <Box sx={{ 
                maxWidth: '80%',
                bgcolor: msg.sender === 'user' ? accentColor : 'background.paper',
                color: msg.sender === 'user' ? 'common.white' : 'text.primary',
                p: 2,
                borderRadius: 2,
                borderTopLeftRadius: msg.sender === 'agent' ? 4 : 8,
                borderTopRightRadius: msg.sender === 'user' ? 4 : 8,
                boxShadow: theme.shadows[1]
              }}>
                <Typography variant="body2">
                  {msg.text}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: msg.sender === 'user' ? alpha(theme.palette.common.white, 0.7) : 'text.disabled',
                  display: 'block',
                  mt: 0.5
                }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
              {msg.sender === 'user' && (
                <Avatar
                  sx={{
                    bgcolor: 'info.main',
                    width: 32,
                    height: 32,
                    mt: 0.5,
                    border: '3px solid',
                    borderColor: (theme) => alpha(theme.palette.warning.light, 0.6)
                  }}
                >
                  <ChatBubbleOutline sx={{ fontSize: 16 }} />
                </Avatar>
              )}
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderTopColor: 'divider', bgcolor: 'background.paper' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'divider',
              },
              '&:hover fieldset': {
                borderColor: accentColor,
              },
              '&.Mui-focused fieldset': {
                borderColor: accentColor,
              },
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  sx={{
                    color: accentColor,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08)
                    }
                  }}
                >
                  <SendRounded />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default Agent;
