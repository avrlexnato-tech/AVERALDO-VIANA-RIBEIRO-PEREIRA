import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  positions: { latitude: number; longitude: number; speed: number }[];
  isTracking: boolean;
  className?: string;
}

export const Map: React.FC<MapProps> = ({ positions, isTracking, className }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const polylineRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([0, 0], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || positions.length === 0) return;

    const lastPos = positions[positions.length - 1];
    const center: [number, number] = [lastPos.latitude, lastPos.longitude];

    if (positions.length === 1) {
      mapRef.current.setView(center, 16);
    } else if (isTracking) {
      mapRef.current.panTo(center);
    }

    // Clear old polylines if we want to redraw everything or just add segments
    // For performance, let's just add the last segment
    if (positions.length > 1) {
      const prevPos = positions[positions.length - 2];
      const color = getColorForSpeed(lastPos.speed);
      
      const segment = L.polyline(
        [
          [prevPos.latitude, prevPos.longitude],
          [lastPos.latitude, lastPos.longitude]
        ],
        { color, weight: 5, opacity: 0.8 }
      ).addTo(mapRef.current);
      
      polylineRef.current.push(segment);
    }
  }, [positions, isTracking]);

  const getColorForSpeed = (speed: number) => {
    // speed is in m/s. 
    // 6:00 pace is 2.77 m/s
    // < 2.5 m/s (red)
    // 2.5 - 3.0 m/s (yellow)
    // > 3.0 m/s (green)
    if (speed < 2.5) return '#ef4444'; // red
    if (speed < 3.0) return '#f59e0b'; // yellow
    return '#22c55e'; // green
  };

  const handleRecenter = () => {
    if (mapRef.current && positions.length > 0) {
      const lastPos = positions[positions.length - 1];
      mapRef.current.setView([lastPos.latitude, lastPos.longitude], 16);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden shadow-inner" />
      <button 
        onClick={handleRecenter}
        className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg text-blue-600 active:scale-90 transition-transform z-[1000]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
    </div>
  );
};
