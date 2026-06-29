import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Tabs, Tab, ToggleButton, ToggleButtonGroup, CircularProgress, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Map as MapIcon, List as ListIcon } from '@mui/icons-material';
import { StreamCard } from '../components/StreamCard';
import { LiveMap } from '../components/LiveMap';
import { api, LIVE_CATEGORIES } from '../config';

interface LiveRoomInfo {
  token: string;
  title: string;
  category: string;
  participants: number;
  country?: string;
  city?: string;
  createdAt: number;
}

export const LiveWindow: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [view, setView] = useState<'map' | 'list'>('map');
  const [rooms, setRooms] = useState<LiveRoomInfo[]>([]);
  const [geoData, setGeoData] = useState<any>({ features: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('All');

  const fetchData = async () => {
    try {
      setLoading(true);
      const categoryParam = category !== 'All' ? `?category=${category}` : '';
      const roomsRes = await fetch(api(`/api/live/rooms${categoryParam}`));
      if (!roomsRes.ok) throw new Error('Failed to fetch rooms');
      const roomsData = await roomsRes.json();
      setRooms(roomsData);

      const mapRes = await fetch(api('/api/live/map'));
      if (!mapRes.ok) throw new Error('Failed to fetch map data');
      const mapData = await mapRes.json();
      setGeoData(mapData);
      
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [category]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        mb: 4,
        gap: 2
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} component="h1" fontWeight="bold">
          Live Window
        </Typography>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, next) => next && setView(next)}
          size="small"
        >
          <ToggleButton value="map">
            <MapIcon sx={{ mr: 1 }} /> Map
          </ToggleButton>
          <ToggleButton value="list">
            <ListIcon sx={{ mr: 1 }} /> List
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={category} 
          onChange={(_, val) => setCategory(val)} 
          variant="scrollable" 
          scrollButtons="auto"
        >
          <Tab label="All" value="All" />
          {LIVE_CATEGORIES.map(cat => (
            <Tab key={cat} label={cat} value={cat} />
          ))}
        </Tabs>
      </Box>

      {loading && rooms.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {view === 'map' ? (
            <LiveMap geoData={geoData} onSelectStream={(token) => window.location.assign(`/live/${token}`)} />
          ) : (
            <Grid container spacing={3}>
              {rooms.length > 0 ? (
                rooms.map((room) => (
                  <Grid item key={room.token} xs={12} sm={6} md={4}>
                    <StreamCard room={room} />
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary">No active streams found in this category.</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
};
