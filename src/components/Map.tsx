import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';

interface MapProps {
  positions: { latitude: number; longitude: number; speed: number }[];
  isTracking: boolean;
  className?: string;
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const Map: React.FC<MapProps> = ({ positions, isTracking, className }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  useEffect(() => {
    if (map && positions.length > 0 && isTracking) {
      const lastPos = positions[positions.length - 1];
      map.panTo({ lat: lastPos.latitude, lng: lastPos.longitude });
    }
  }, [map, positions, isTracking]);

  const handleRecenter = () => {
    if (map && positions.length > 0) {
      const lastPos = positions[positions.length - 1];
      map.setCenter({ lat: lastPos.latitude, lng: lastPos.longitude });
      map.setZoom(16);
    }
  };

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return (
      <div className={`relative flex flex-col items-center justify-center bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 ${className}`}>
        <AlertCircle className="text-slate-400 mb-2" size={32} />
        <p className="text-slate-500 font-medium text-center px-6">
          Mapa indisponível no momento
        </p>
        <p className="text-slate-400 text-xs text-center px-6 mt-1">
          Configure a chave do Google Maps para ativar o mapa
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`relative flex flex-col items-center justify-center bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 ${className}`}>
        <AlertCircle className="text-red-400 mb-2" size={32} />
        <p className="text-slate-500 font-medium text-center px-6">
          Erro ao carregar o mapa
        </p>
      </div>
    );
  }

  const path = positions.map(p => ({ lat: p.latitude, lng: p.longitude }));
  const lastPosition = positions.length > 0 ? { lat: positions[positions.length - 1].latitude, lng: positions[positions.length - 1].longitude } : null;

  return isLoaded ? (
    <div className={`relative ${className}`}>
      <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={lastPosition || { lat: -23.5505, lng: -46.6333 }} // Default to São Paulo if no positions
          zoom={16}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: true,
            zoomControl: false,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          }}
        >
          {path.length > 1 && (
            <Polyline
              path={path}
              options={{
                strokeColor: "#22c55e",
                strokeOpacity: 0.8,
                strokeWeight: 5,
              }}
            />
          )}
          {lastPosition && (
            <Marker
              position={lastPosition}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#3b82f6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 8
              }}
            />
          )}
        </GoogleMap>
      </div>
      
      <button 
        onClick={handleRecenter}
        className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg text-blue-600 active:scale-90 transition-transform z-10"
      >
        <Navigation size={20} />
      </button>
    </div>
  ) : (
    <div className={`flex items-center justify-center bg-slate-50 rounded-2xl ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
};
