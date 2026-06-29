import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, Typography, List, ListItem, ListItemText, Paper } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

interface Message {
  peerId: string;
  name?: string;
  text: string;
  timestamp: number;
}

interface ChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  currentPeerId: string;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, currentPeerId }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Paper elevation={3} sx={{ flexGrow: 1, mb: 1, overflow: 'auto', p: 1, backgroundColor: 'rgba(255,255,255,0.9)' }}>
        <List dense>
          {messages.map((msg, index) => (
            <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: msg.peerId === currentPeerId ? 'primary.main' : 'secondary.main' }}>
                      {msg.name || msg.peerId.slice(0, 5)}:
                    </Typography>
                    <Typography variant="body2">{msg.text}</Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Paper>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          sx={{ backgroundColor: 'white' }}
        />
        <IconButton color="primary" onClick={handleSend} disabled={!inputText.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Chat;
