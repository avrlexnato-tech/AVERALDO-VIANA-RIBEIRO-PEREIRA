import { useState, useEffect, useRef, useCallback } from 'react';
import { Segment, SpeedSegment, PathPoint } from '../types';

interface Position {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number;
  accuracy: number;
}

export type AccuracyLevel = 'good' | 'acceptable' | 'weak';

const getSpeedColor = (speedKmh: number) => {
  if (speedKmh < 8) return '#ef4444'; // Red
  if (speedKmh < 10) return '#f97316'; // Orange
  if (speedKmh < 12) return '#eab308'; // Yellow
  return '#22c55e'; // Green
};

export function useGPS(userWeight: number = 71) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [lastKnownPosition, setLastKnownPosition] = useState<Position | null>(() => {
    const saved = localStorage.getItem('last_known_position');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only use if it's "recent" (e.g., last 24 hours)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [distance, setDistance] = useState(0); // in km
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWaitingForGPS, setIsWaitingForGPS] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [speedSegments, setSpeedSegments] = useState<SpeedSegment[]>([]);
  const [calories, setCalories] = useState(0);
  const [accuracyLevel, setAccuracyLevel] = useState<AccuracyLevel | null>(null);
  const [accuracyValue, setAccuracyValue] = useState<number | null>(null);
  
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
    timeout: 10000,
    maximumAge: 3000,
  };

  const fastOptions = {
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 10000,
  };

  const getAccuracyLevel = (accuracy: number): AccuracyLevel => {
    if (accuracy <= 20) return 'good';
    if (accuracy <= 50) return 'acceptable';
    return 'weak';
  };

  const getPrecisionMessage = (level: AccuracyLevel | null) => {
    if (!level) return "Buscando localização inicial...";
    if (level === 'good') return "GPS com boa precisão.";
    if (level === 'acceptable') return "Localização encontrada. A precisão vai melhorar durante a corrida.";
    return "Sinal de GPS ainda está ajustando. Você já pode começar.";
  };

  const requestInitialPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo seu navegador.");
      return;
    }

    setIsWaitingForGPS(true);
    setError(null);

    const handleSuccess = (position: GeolocationPosition) => {
      const pos: Position = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp,
        speed: position.coords.speed || 0,
        accuracy: position.coords.accuracy,
      };
      setCurrentPosition(pos);
      setLastKnownPosition(pos);
      localStorage.setItem('last_known_position', JSON.stringify(pos));
      setAccuracyValue(position.coords.accuracy);
      setAccuracyLevel(getAccuracyLevel(position.coords.accuracy));
      setIsWaitingForGPS(false);
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn("GPS Fast Attempt Error:", err.message);
      
      if (currentPosition) {
        setIsWaitingForGPS(false);
        return;
      }

      // If fast attempt fails, try high accuracy immediately as fallback
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        (secondErr) => {
          console.error("GPS High Accuracy Attempt Error:", secondErr);
          setIsWaitingForGPS(false);
          if (secondErr.code === 1) {
            setError("Permissão de localização negada. Ative a localização nas configurações.");
          } else {
            setError("Não foi possível obter sua localização. Verifique seu GPS.");
          }
        },
        gpsOptions
      );
    };

    // Phase 1: Fast initial location
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, fastOptions);
  }, [currentPosition]);

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

    // Phase 2: Refined continuous tracking
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: Position = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
          speed: position.coords.speed || 0,
          accuracy: position.coords.accuracy,
        };

        setCurrentPosition(newPos);
        setLastKnownPosition(newPos);
        localStorage.setItem('last_known_position', JSON.stringify(newPos));
        setAccuracyValue(position.coords.accuracy);
        setAccuracyLevel(getAccuracyLevel(position.coords.accuracy));

        setPositions((prev) => {
          if (prev.length > 0) {
            const lastPos = prev[prev.length - 1];
            const d = calculateDistance(
              lastPos.latitude,
              lastPos.longitude,
              newPos.latitude,
              newPos.longitude
            );
            
            // Filter out noise: accuracy must be reasonable and distance must be significant
            // but not impossible (e.g. > 50m in 1 second)
            const timeDiff = (newPos.timestamp - lastPos.timestamp) / 1000;
            const speed = timeDiff > 0 ? (d * 1000) / timeDiff : 0; // m/s

            if (d > 0.002 && newPos.accuracy < 100 && speed < 15) { // 2 meters, accuracy < 100m, speed < 54km/h
              const newTotalDistance = distance + d;
              setDistance(newTotalDistance);

              // Calories: approx 1 kcal per kg per km
              setCalories(newTotalDistance * userWeight * 1.036);

              // Speed Segments for Strava-like coloring
              // Use pace (min/km) instead of raw speed for better coloring
              const paceSec = d > 0 ? timeDiff / d : 0;
              const paceMin = paceSec / 60;
              
              // Color based on pace (min/km)
              // Green: < 5:00, Yellow: 5:00-6:30, Orange: 6:30-8:00, Red: > 8:00
              let color = '#ef4444'; // Red
              if (paceMin < 5) color = '#22c55e'; // Green
              else if (paceMin < 6.5) color = '#eab308'; // Yellow
              else if (paceMin < 8) color = '#f97316'; // Orange
              
              setSpeedSegments(prevSpeedSegs => {
                const lastSeg = prevSpeedSegs[prevSpeedSegs.length - 1];
                if (lastSeg && lastSeg.color === color) {
                  const updatedSeg = {
                    ...lastSeg,
                    path: [...lastSeg.path, { lat: newPos.latitude, lng: newPos.longitude }]
                  };
                  return [...prevSpeedSegs.slice(0, -1), updatedSeg];
                } else {
                  return [...prevSpeedSegs, {
                    color,
                    speed: (newPos.speed * 3.6) || (d / (timeDiff / 3600)),
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
              if (currentKm > lastKm && currentKm > 0) {
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
        console.error("GPS Watch Error:", err);
        if (err.code === 1) {
          setError("Permissão de localização negada.");
        } else if (err.code === 2) {
          setError("Sinal de GPS indisponível.");
        }
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
    accuracyLevel,
    accuracyValue,
    precisionMessage: getPrecisionMessage(accuracyLevel),
    lastKnownPosition,
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
