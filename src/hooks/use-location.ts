"use client";

import { useState, useEffect } from 'react';

interface LocationState {
  location: GeolocationCoordinates | null;
  error: string | null;
}

const useLocation = (): LocationState => {
  const [locationState, setLocationState] = useState<LocationState>({
    location: null,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState(prevState => ({
        ...prevState,
        error: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setLocationState({
        location: position.coords,
        error: null,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setLocationState(prevState => ({
        ...prevState,
        error: error.message,
      }));
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  }, []);

  return locationState;
};

export default useLocation;
