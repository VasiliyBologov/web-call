import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Chip, CardActionArea } from '@mui/material';
import { People as PeopleIcon, LocationOn as LocationIcon } from '@mui/icons-material';

interface LiveRoomInfo {
  token: string;
  title: string;
  category: string;
  participants: number;
  country?: string;
  city?: string;
  createdAt: number;
}

interface StreamCardProps {
  room: LiveRoomInfo;
}

export const StreamCard: React.FC<StreamCardProps> = ({ room }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea onClick={() => window.location.assign(`/live/${room.token}`)}>
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="div"
            sx={{
              pt: '56.25%', // 16:9
              backgroundColor: 'grey.300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
             <Typography variant="body2" color="text.secondary">
               Live Preview
             </Typography>
          </CardMedia>
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              display: 'flex',
              gap: 0.5
            }}
          >
            <Chip
              label="LIVE"
              color="error"
              size="small"
              sx={{ fontWeight: 'bold', height: 20 }}
            />
            <Chip
              icon={<PeopleIcon sx={{ fontSize: '14px !important' }} />}
              label={room.participants}
              size="small"
              sx={{ height: 20, backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
            />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
            }}
          >
            <Chip
              label={room.category}
              size="small"
              sx={{ height: 20, backgroundColor: 'primary.main', color: 'white' }}
            />
          </Box>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
          <Typography gutterBottom variant="h6" component="div" noWrap sx={{ mb: 0.5, fontSize: '1rem' }}>
            {room.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <LocationIcon sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography variant="body2" noWrap>
              {room.country}{room.city ? `, ${room.city}` : ''}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

