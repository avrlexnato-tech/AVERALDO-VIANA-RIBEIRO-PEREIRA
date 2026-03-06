import { useState, useEffect, useRef } from 'react';

interface Position {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
}

export function useGPS() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [distance, setDistance] = useState(0); // in km
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada");
      return;
    }

    setIsActive(true);
    setPositions([]);
    setDistance(0);

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: Position = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
          speed: position.coords.speed,
        };

        setPositions((prev) => {
          if (prev.length > 0) {
            const lastPos = prev[prev.length - 1];
            const d = calculateDistance(
              lastPos.latitude,
              lastPos.longitude,
              newPos.latitude,
              newPos.longitude
            );
            // Filter out small jumps/noise
            if (d > 0.002) {
              setDistance((prevDist) => prevDist + d);
              return [...prev, newPos];
            }
            return prev;
          }
          return [newPos];
        });
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsActive(false);
  };

  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return {
    positions,
    distance,
    isActive,
    error,
    startTracking,
    stopTracking,
    setDistance,
    setPositions
  };
}
