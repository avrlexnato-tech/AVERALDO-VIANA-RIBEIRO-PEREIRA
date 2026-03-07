import { useState, useEffect, useRef, useCallback } from 'react';
import { Segment, SpeedSegment, PathPoint } from '../types';

interface Position {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number;
}

const getSpeedColor = (speedKmh: number) => {
  if (speedKmh < 8) return '#ef4444'; // Red
  if (speedKmh < 10) return '#f97316'; // Orange
  if (speedKmh < 12) return '#eab308'; // Yellow
  return '#22c55e'; // Green
};

export function useGPS(userWeight: number = 71) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [distance, setDistance] = useState(0); // in km
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWaitingForGPS, setIsWaitingForGPS] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [speedSegments, setSpeedSegments] = useState<SpeedSegment[]>([]);
  const [calories, setCalories] = useState(0);
  
  const watchId = useRef<number | null>(null);
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

  const gpsOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  };

  const requestInitialPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo seu navegador.");
      return;
    }

    setIsWaitingForGPS(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos: Position = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
          speed: position.coords.speed || 0,
        };
        setCurrentPosition(pos);
        setIsWaitingForGPS(false);
      },
      (err) => {
        console.error("Initial GPS Error:", err);
        setIsWaitingForGPS(false);
        if (err.code === 1) {
          setError("Permissão de localização negada. Ative a localização nas configurações do seu celular.");
        } else {
          setError("Não foi possível obter sua localização atual. Verifique seu GPS.");
        }
      },
      gpsOptions
    );
  }, []);

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
    setSpeedSegments([]);
    setCalories(0);
    lastSegmentTime.current = Date.now();

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: Position = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
          speed: position.coords.speed || 0,
        };

        setCurrentPosition(newPos);

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

              // Speed Segments for Strava-like coloring
              const speedKmh = (newPos.speed * 3.6) || (d / ((newPos.timestamp - lastPos.timestamp) / 3600000));
              const color = getSpeedColor(speedKmh);
              
              setSpeedSegments(prevSpeedSegs => {
                const lastSeg = prevSpeedSegs[prevSpeedSegs.length - 1];
                if (lastSeg && lastSeg.color === color) {
                  // Extend last segment
                  const updatedSeg = {
                    ...lastSeg,
                    path: [...lastSeg.path, { lat: newPos.latitude, lng: newPos.longitude }]
                  };
                  return [...prevSpeedSegs.slice(0, -1), updatedSeg];
                } else {
                  // New segment
                  return [...prevSpeedSegs, {
                    color,
                    speed: speedKmh,
                    path: [
                      { lat: lastPos.latitude, lng: lastPos.longitude },
                      { lat: newPos.latitude, lng: newPos.longitude }
                    ]
                  }];
                }
              });

              // Splits (every 1 km)
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
          setError("Permissão de localização negada. Ative a localização nas configurações do seu celular para usar o mapa e rastreamento.");
        } else if (err.code === 2) {
          setError("Sinal de GPS indisponível. Tente ir para um local aberto.");
        } else if (err.code === 3) {
          setError("Tempo esgotado ao tentar obter localização.");
        } else {
          setError("Erro ao obter localização: " + err.message);
        }
        setIsActive(false);
      },
      gpsOptions
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
    currentPosition,
    distance,
    isActive,
    isWaitingForGPS,
    error,
    segments,
    speedSegments,
    calories,
    startTracking,
    stopTracking,
    requestInitialPosition,
    setDistance,
    setPositions,
    setSegments,
    setSpeedSegments,
    setCalories
  };
}
