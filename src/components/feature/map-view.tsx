"use client";

import React from 'react';
import { MapPin } from 'lucide-react';

interface MapViewProps {
  selectedLocation: GeolocationCoordinates | null;
}

const MapView: React.FC<MapViewProps> = ({ selectedLocation }) => {
  const getMapUrl = () => {
    if (selectedLocation) {
      const { latitude, longitude } = selectedLocation;
      return `https://maps.google.com/maps?q=${latitude},${longitude}&hl=es;z=14&output=embed`;
    }
    // Default location (e.g., a central point) if no location is selected
    return `https://maps.google.com/maps?q=20.5937,78.9629&hl=es;z=5&output=embed`;
  };

  return (
    <div className="h-full w-full bg-muted rounded-md relative">
      {selectedLocation ? (
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={getMapUrl()}
          title="Alert Location"
        ></iframe>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
            <MapPin className="w-12 h-12 mb-4" />
            <p className="text-base font-medium">No Location Selected</p>
            <p className="text-sm">Select an alert to see its location on the map.</p>
        </div>
      )}
    </div>
  );
};

export default MapView;
