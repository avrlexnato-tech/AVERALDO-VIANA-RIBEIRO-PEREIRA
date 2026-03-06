import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, AlertCircle } from 'lucide-react';

// Fix Leaflet default icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  positions: { lat?: number; lng?: number; latitude?: number; longitude?: number; speed: number }[];
  isTracking: boolean;
  className?: string;
}

export const Map: React.FC<MapProps> = ({ positions, isTracking, className }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const getCoords = (p: any): [number, number] => {
    const lat = p.lat ?? p.latitude ?? 0;
    const lng = p.lng ?? p.longitude ?? 0;
    return [lat, lng];
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialPos: L.LatLngExpression = positions.length > 0 
      ? getCoords(positions[positions.length - 1])
      : [-23.5505, -46.6333]; // São Paulo default

    const map = L.map(mapContainerRef.current, {
      center: initialPos,
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    // Carto Voyager tiles (clean and professional)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    polylineRef.current = L.polyline([], {
      color: '#22c55e',
      weight: 5,
      opacity: 0.8,
      lineJoin: 'round'
    }).addTo(map);

    // Custom circle marker for current position
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    markerRef.current = L.marker(initialPos, { icon }).addTo(map);

    mapRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Path and Marker
  useEffect(() => {
    if (!mapRef.current || !polylineRef.current || !markerRef.current || positions.length === 0) return;

    const path = positions.map(p => getCoords(p));
    polylineRef.current.setLatLngs(path);

    const lastPos = path[path.length - 1];
    markerRef.current.setLatLng(lastPos);

    if (isTracking) {
      mapRef.current.panTo(lastPos, { animate: true });
    }
  }, [positions, isTracking]);

  // Fit bounds for history mode
  useEffect(() => {
    if (mapRef.current && !isTracking && positions.length > 1) {
      const path = positions.map(p => getCoords(p));
      const bounds = L.latLngBounds(path);
      mapRef.current.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [isMapReady, isTracking, positions]);

  const handleRecenter = () => {
    if (mapRef.current && positions.length > 0) {
      const lastPos = getCoords(positions[positions.length - 1]);
      mapRef.current.setView(lastPos, 16, { animate: true });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 z-0"
      />
      
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-2xl z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      <button 
        onClick={handleRecenter}
        className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg text-blue-600 active:scale-90 transition-transform z-[400]"
      >
        <Navigation size={20} />
      </button>
    </div>
  );
};
