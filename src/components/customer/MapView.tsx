import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// Removed clustering temporarily due to context consumer error
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Fix for default marker icons in webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom icon for user location
const userLocationIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjMzY4OEZGIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3ZnPg==',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom icon for shops
const shopIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgMEMxMC40NzcgMCA2IDQuNDc3IDYgMTBDNiAxNi4yNSAxNiAzMiAxNiAzMkMxNiAzMiAyNiAxNi4yNSAyNiAxMEMyNiA0LjQ3NyAyMS41MjMgMCAxNiAwWiIgZmlsbD0iI0VGNDQ0NCIvPjxjaXJjbGUgY3g9IjE2IiBjeT0iMTAiIHI9IjQiIGZpbGw9IndoaXRlIi8+PC9zdmc+',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Client-only wrapper to avoid SSR/hydration mismatches
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}


// Component for map content
function MapContent({ shops, userLocation, onShopSelect }: { 
  shops: any[], 
  userLocation: { latitude: number | null; longitude: number | null },
  onShopSelect: (shop: any) => void 
}) {
  return (
    <>
      {/* User location marker - outside cluster */}
      {userLocation.latitude && userLocation.longitude && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userLocationIcon}
        >
          <Popup>
            <div style={{ fontWeight: 600 }}>Your Location</div>
          </Popup>
        </Marker>
      )}

      {/* Shop markers - direct (no clustering) */}
      {shops.filter(shop => shop.latitude && shop.longitude).map((shop) => (
        <Marker
          key={shop.id}
          position={[shop.latitude, shop.longitude] as LatLngExpression}
          icon={shopIcon}
        >
          <Popup>
            <div style={{ minWidth: 220 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{shop.name}</div>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>
                {shop.address}
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 8 }}>
                <div>⭐ {shop.rating}</div>
                {shop.distance !== null && <div>• {shop.distance} km</div>}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, marginBottom: 10 }}>
                <div>Wait: {shop.estimated_wait || 0} min</div>
                <div>In queue: {shop.current_queue || 0}</div>
              </div>
              <button
                onClick={() => onShopSelect(shop)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Join Queue
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

interface MapViewProps {
  shops: any[];
  userLocation: { latitude: number | null; longitude: number | null };
  onShopSelect: (shop: any) => void;
}

const MapView = ({ shops, userLocation, onShopSelect }: MapViewProps) => {
  // Default center (fallback if no user location) - Hubli-Dharwad
  const defaultCenter: LatLngExpression = [15.3647, 75.1240]; // Hubli-Dharwad
  
  const center: LatLngExpression = useMemo(() => 
    userLocation.latitude && userLocation.longitude
      ? [userLocation.latitude, userLocation.longitude]
      : defaultCenter,
    [userLocation.latitude, userLocation.longitude]
  );

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border border-border">
      <ClientOnly>
        <MapContainer
          key={JSON.stringify(center)}
          center={center}
          zoom={13}
          className="w-full h-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapContent shops={shops} userLocation={userLocation} onShopSelect={onShopSelect} />
        </MapContainer>
      </ClientOnly>
    </div>
  );
};

export default MapView;
