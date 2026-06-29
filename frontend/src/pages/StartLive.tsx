import React, { useState } from 'react';
import { 
  Container, Typography, Box, Paper, Stepper, Step, StepLabel, 
  Button, TextField, MenuItem, FormControlLabel, Switch, 
  Alert, Divider, List, ListItem, ListItemIcon, ListItemText,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { 
  Security as SecurityIcon, 
  Videocam as VideocamIcon, 
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { api, LIVE_CATEGORIES, LOCATION_LEVELS } from '../config';

const steps = ['Rules', 'Media Access', 'Settings'];

export const StartLive: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(LIVE_CATEGORIES[0]);
  const [locationLevel, setLocationLevel] = useState('country');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [geo, setGeo] = useState<{lat?: number, lng?: number, country?: string, city?: string}>({});

  const handleNext = async () => {
    if (loading) return;
    setError(null);

    try {
      if (activeStep === 1) {
        setLoading(true);
        // Request media access
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(t => t.stop()); // Just checking access
        
        // Also get location if needed
        if (locationLevel !== 'hidden') {
          navigator.geolocation.getCurrentPosition((pos) => {
             const { latitude, longitude } = pos.coords;
             setGeo(prev => ({ ...prev, lat: latitude, lng: longitude }));
             
             // Reverse geocoding (simple mock or real service)
             fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
               .then(res => res.json())
               .then(data => {
                 setGeo(prev => ({ 
                   ...prev, 
                   country: data.address.country, 
                   city: data.address.city || data.address.town || data.address.village 
                 }));
               })
               .catch(e => {
                 console.error("Geocoding failed", e);
               });
          }, (err) => {
            console.warn("Geolocation denied", err);
          });
        }
        setActiveStep(2);
        setLoading(false);
      } else if (activeStep === steps.length - 1) {
        await handleStart();
      } else {
        setActiveStep((prev) => prev + 1);
      }
    } catch (err: any) {
      setError(err.message || 'Camera and Microphone access is required to start a live window.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleStart = async () => {
    try {
      setLoading(true);
      const res = await fetch(api('/api/live/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          locationLevel,
          country: geo.country,
          city: geo.city,
          lat: geo.lat,
          lng: geo.lng,
          chatEnabled
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to start stream');
      
      // Navigate to the room in streamer mode
      window.location.assign(`/live/${data.token}?role=streamer`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: isMobile ? 2 : 8, px: isMobile ? 1 : 2 }}>
      <Paper sx={{ p: isMobile ? 2 : 4, borderRadius: 3, boxShadow: 4 }}>
        <Typography variant={isMobile ? "h5" : "h4"} align="center" gutterBottom fontWeight="bold">
          Start Live Window
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }} orientation={isMobile ? "vertical" : "horizontal"}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box sx={{ minHeight: '200px' }}>
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} /> Platform Rules
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary="No illegal activities or violence" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary="No adult content" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Respect privacy of others" />
                </ListItem>
              </List>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                By continuing, you agree to our Terms of Service and Safety Rules.
              </Typography>
            </Box>
          )}

          {activeStep === 1 && (
            <Box textAlign="center" py={2}>
              <VideocamIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Allow Media Access
              </Typography>
              <Typography variant="body1" color="text.secondary">
                We need access to your camera and microphone to broadcast your world.
              </Typography>
            </Box>
          )}

          {activeStep === 2 && (
            <Box component="form" noValidate>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} /> Stream Settings
              </Typography>
              <TextField
                fullWidth
                label="Stream Title"
                placeholder="Walking in the park..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && title.trim() && !loading) {
                    handleNext();
                  }
                }}
                margin="normal"
                required
                autoFocus
              />
              <TextField
                fullWidth
                select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                margin="normal"
              >
                {LIVE_CATEGORIES.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Location Privacy"
                value={locationLevel}
                onChange={(e) => setLocationLevel(e.target.value)}
                margin="normal"
                helperText="How accurate your location will be shown on the map"
              >
                {LOCATION_LEVELS.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={
                  <Switch 
                    checked={chatEnabled} 
                    onChange={(e) => setChatEnabled(e.target.checked)} 
                  />
                }
                label="Enable Chat"
                sx={{ mt: 1 }}
              />
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || (activeStep === 2 && !title.trim())}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              activeStep === steps.length - 1 ? 'Start Streaming' : 'Next'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
