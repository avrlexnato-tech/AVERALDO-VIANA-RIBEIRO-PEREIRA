import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, AlertCircle, RefreshCw } from 'lucide-react';
import { SpeedSegment } from '../types';

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
  currentPosition?: { latitude: number; longitude: number } | null;
  speedSegments?: SpeedSegment[];
  isTracking: boolean;
  className?: string;
}

export const Map: React.FC<MapProps> = ({ positions, currentPosition, speedSegments = [], isTracking, className }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const markerRef = useRef<L.Marker | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);

  const getCoords = (p: any): [number, number] => {
    const lat = p.lat ?? p.latitude ?? 0;
    const lng = p.lng ?? p.longitude ?? 0;
    return [lat, lng];
  };

  const initMap = () => {
    if (!mapContainerRef.current || mapRef.current) return;
    
    // Determine initial position
    let initialPos: L.LatLngExpression | null = null;
    
    if (positions.length > 0) {
      initialPos = getCoords(positions[positions.length - 1]);
    } else if (currentPosition) {
      initialPos = [currentPosition.latitude, currentPosition.longitude];
    }

    // If we still don't have a position, we wait for one before initializing
    if (!initialPos) return;

    setMapError(false);

    try {
      const map = L.map(mapContainerRef.current, {
        center: initialPos,
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      // Detect manual interaction
      map.on('movestart', (e: any) => {
        if (e.originalEvent) { // Only if triggered by user interaction
          setAutoFollow(false);
        }
      });

      // Use OSM or CartoDB tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Custom circle marker for current position
      const icon = L.divIcon({
        className: 'current-pos-marker',
        html: `<div class="relative">
          <div class="absolute -inset-3 bg-blue-500/30 rounded-full animate-ping"></div>
          <div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); position: relative; z-index: 10;"></div>
        </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      markerRef.current = L.marker(initialPos, { icon, zIndexOffset: 1000 }).addTo(map);

      mapRef.current = map;
      
      // Force a resize after a short delay to fix gray map issue
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
          setIsMapReady(true);
        }
      }, 100);
    } catch (err) {
      console.error("Map initialization error:", err);
      setMapError(true);
    }
  };

  useEffect(() => {
    if (!isMapReady) {
      initMap();
    }
  }, [positions, currentPosition, isMapReady]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Path and Marker
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    // Clear old polylines
    polylinesRef.current.forEach(p => p.remove());
    polylinesRef.current = [];

    if (speedSegments.length > 0) {
      speedSegments.forEach(seg => {
        const poly = L.polyline(seg.path as L.LatLngExpression[], {
          color: seg.color,
          weight: 8,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(mapRef.current!);
        polylinesRef.current.push(poly);
      });
    } else if (positions.length > 0) {
      const path = positions.map(p => getCoords(p));
      const poly = L.polyline(path, {
        color: '#3b82f6',
        weight: 8,
        opacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(mapRef.current);
      polylinesRef.current.push(poly);
    }

    const latestPos = positions.length > 0 
      ? getCoords(positions[positions.length - 1])
      : (currentPosition ? [currentPosition.latitude, currentPosition.longitude] as [number, number] : null);

    if (latestPos) {
      if (markerRef.current) {
        markerRef.current.setLatLng(latestPos);
      }

      if (isTracking && autoFollow) {
        // Smoothly pan to the new position
        mapRef.current.panTo(latestPos, { animate: true, duration: 1 });
      }
    }

    // Start/End markers for History
    if (!isTracking && positions.length > 1) {
      const startPos = getCoords(positions[0]);
      const endPos = getCoords(positions[positions.length - 1]);

      if (!startMarkerRef.current) {
        startMarkerRef.current = L.marker(startPos, {
          icon: L.divIcon({
            className: 'start-marker',
            html: `<div style="background-color: #22c55e; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          })
        }).addTo(mapRef.current);
      } else {
        startMarkerRef.current.setLatLng(startPos);
      }

      if (!endMarkerRef.current) {
        endMarkerRef.current = L.marker(endPos, {
          icon: L.divIcon({
            className: 'end-marker',
            html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          })
        }).addTo(mapRef.current);
      } else {
        endMarkerRef.current.setLatLng(endPos);
      }
    }
  }, [positions, currentPosition, speedSegments, isTracking, isMapReady, autoFollow]);

  // Fit bounds for history mode
  useEffect(() => {
    if (mapRef.current && !isTracking && positions.length > 1) {
      const path = positions.map(p => getCoords(p));
      const bounds = L.latLngBounds(path);
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [isMapReady, isTracking, positions]);

  const handleRecenter = () => {
    if (mapRef.current) {
      const latestPos = positions.length > 0 
        ? getCoords(positions[positions.length - 1])
        : (currentPosition ? [currentPosition.latitude, currentPosition.longitude] as [number, number] : null);
      
      if (latestPos) {
        setAutoFollow(true);
        mapRef.current.setView(latestPos, 16, { animate: true });
      }
    }
  };

  const handleRetry = () => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    initMap();
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 z-0 bg-slate-100"
      />
      
      {(!isMapReady && !mapError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm rounded-2xl z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando Mapa...</p>
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-2xl z-10 p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle size={40} className="text-red-500" />
            <div>
              <p className="font-black text-slate-800 uppercase text-sm mb-1">Erro ao carregar mapa</p>
              <p className="text-xs text-slate-500">Verifique sua conexão com a internet.</p>
            </div>
            <button 
              onClick={handleRetry}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-transform"
            >
              <RefreshCw size={14} />
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {isMapReady && positions.length > 0 && (
        <button 
          onClick={handleRecenter}
          className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg text-blue-600 active:scale-90 transition-transform z-[400] border border-slate-100"
        >
          <Navigation size={20} />
        </button>
      )}
    </div>
  );
};
