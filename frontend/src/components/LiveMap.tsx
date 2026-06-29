import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Button } from '@mui/material';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LiveMapProps {
  geoData: {
    features: Array<{
      properties: {
        token: string;
        title: string;
        category: string;
        participants: number;
      };
      geometry: {
        coordinates: [number, number];
      };
    }>;
  };
  onSelectStream: (token: string) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({ geoData, onSelectStream }) => {
  return (
    <Box sx={{ height: '500px', width: '100%', borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
      <MapContainer 
        center={[20, 0] as any} 
        zoom={2} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoData.features.map((feature, index) => (
          <Marker 
            key={index} 
            position={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]] as any}
          >
            <Popup>
              <Typography variant="subtitle2">{feature.properties.title}</Typography>
              <Typography variant="caption" display="block">Category: {feature.properties.category}</Typography>
              <Typography variant="caption" display="block">Viewers: {feature.properties.participants}</Typography>
              <Button 
                size="small" 
                variant="contained" 
                sx={{ mt: 1 }}
                onClick={() => onSelectStream(feature.properties.token)}
              >
                Watch
              </Button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

