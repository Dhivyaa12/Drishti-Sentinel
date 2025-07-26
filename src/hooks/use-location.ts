
'use client';

import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

interface LocationState {
  location: GeolocationCoordinates | null;
  error: string | null;
}

const useLocation = (): LocationState => {
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser.';
      setError(msg);
       toast({
          variant: 'destructive',
          title: 'Location Error',
          description: msg,
        });
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setLocation(position.coords);
      setError(null);
    };

    const onError = (err: GeolocationPositionError) => {
       let message = 'An unknown error occurred.';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = 'Location access denied. Please enable it in your browser settings.';
          break;
        case err.POSITION_UNAVAILABLE:
          message = 'Location information is unavailable.';
          break;
        case err.TIMEOUT:
          message = 'The request to get user location timed out.';
          break;
      }
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Location Error',
        description: message,
      });
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [toast]);

  return { location, error };
};

export default useLocation;
