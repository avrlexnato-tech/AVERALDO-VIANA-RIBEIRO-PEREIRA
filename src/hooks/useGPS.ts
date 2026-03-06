import { useState, useEffect, useRef, useCallback } from 'react';
import { Segment } from '../types';

interface Position {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number;
}

export function useGPS(userWeight: number = 71) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [distance, setDistance] = useState(0); // in km
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [calories, setCalories] = useState(0);
  
  const watchId = useRef<number | null>(null);
  const lastSegmentDistance = useRef(0);
  const lastSegmentTime = useRef(0);

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

  const calculatePace = (dist: number, timeInSeconds: number) => {
    if (dist <= 0) return "0:00";
    const paceInSeconds = timeInSeconds / dist;
    const m = Math.floor(paceInSeconds / 60);
    const s = Math.floor(paceInSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo seu navegador.");
      return;
    }

    setError(null);
    setIsActive(true);
    setPositions([]);
    setDistance(0);
    setSegments([]);
    setCalories(0);
    lastSegmentDistance.current = 0;
    lastSegmentTime.current = Date.now();

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: Position = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
          speed: position.coords.speed || 0,
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
            if (d > 0.001) { // 1 meter
              const newTotalDistance = distance + d;
              setDistance(newTotalDistance);

              // Calories: approx 1 kcal per kg per km
              setCalories(newTotalDistance * userWeight * 1.036);

              // Segments (every 1 km)
              const currentKm = Math.floor(newTotalDistance);
              const lastKm = Math.floor(distance);
              if (currentKm > lastKm) {
                const now = Date.now();
                const timeForKm = (now - lastSegmentTime.current) / 1000;
                const pace = calculatePace(1, timeForKm);
                
                setSegments(prevSegments => {
                  const prevPaceSec = prevSegments.length > 0 
                    ? (parseInt(prevSegments[prevSegments.length-1].pace.split(':')[0]) * 60 + parseInt(prevSegments[prevSegments.length-1].pace.split(':')[1]))
                    : timeForKm;
                  
                  return [...prevSegments, {
                    km: currentKm,
                    time: timeForKm,
                    pace: pace,
                    diffFromPrevious: timeForKm - prevPaceSec
                  }];
                });
                lastSegmentTime.current = now;
              }

              return [...prev, newPos];
            }
            return prev;
          }
          lastSegmentTime.current = Date.now();
          return [newPos];
        });
      },
      (err) => {
        console.error("GPS Error:", err);
        if (err.code === 1) {
          setError("Permissão de localização negada. Ative a localização para usar mapa e rastreamento.");
        } else if (err.code === 2) {
          setError("Sinal de GPS indisponível. Tente ir para um local aberto.");
        } else if (err.code === 3) {
          setError("Tempo esgotado ao tentar obter localização.");
        } else {
          setError("Erro ao obter localização: " + err.message);
        }
        setIsActive(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [distance, userWeight]);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsActive(false);
  }, []);

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
    segments,
    calories,
    startTracking,
    stopTracking,
    setDistance,
    setPositions,
    setSegments,
    setCalories
  };
}
