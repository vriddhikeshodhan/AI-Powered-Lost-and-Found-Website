import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default marker icon issue in React by using reliable CDNs
const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Component to handle map clicks
const MapClickHandler = ({ setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition({ latitude: e.latlng.lat, longitude: e.latlng.lng });
        },
    });
    return null;
};

export default function MapPicker({ position, setPosition }) {
    // Default center set to Banasthali Vidyapith
    const defaultCenter = [26.4030, 75.8760]; 

    return (
        <div style={{ height: "300px", width: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid #dcfce7", marginTop: "8px", zIndex: 0 }}>
            <MapContainer center={defaultCenter} zoom={16} style={{ height: "100%", width: "100%", zIndex: 1 }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler setPosition={setPosition} />
                {position.latitude && (
                    <Marker position={[position.latitude, position.longitude]} icon={customIcon} />
                )}
            </MapContainer>
        </div>
    );
}