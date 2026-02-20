import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePlayerSync } from "@/hooks/usePlayerSync";
import "leaflet/dist/leaflet.css";

// Recenter map when user geo arrives
function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== 0 || lon !== 0) {
      map.setView([lat, lon], 15);
    }
  }, [lat, lon, map]);
  return null;
}

// Distance in km between two coords
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const stateColors: Record<string, string> = {
  ground: "#00ff88",
  rydberg: "#00d4ff",
  entangled: "#ff3366",
};

const MapView = () => {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const [atomState] = useState("ground");
  const { players, sessionId } = usePlayerSync(geo.lat, geo.lon, atomState, geo.label);

  const nearbyPlayers = useMemo(() => {
    if (geo.loading) return [];
    return players.filter((p) => {
      if (p.session_id === sessionId) return false;
      return haversineKm(geo.lat, geo.lon, p.lat, p.lon) < 5; // 5km radius
    });
  }, [players, geo, sessionId]);

  const myPlayer = players.find((p) => p.session_id === sessionId);

  return (
    <div className="w-screen h-screen relative" style={{ background: "#04060a" }}>
      {/* Map */}
      <MapContainer
        center={[geo.lat || 37.7, geo.lon || -122.4]}
        zoom={15}
        className="w-full h-full z-0"
        style={{ background: "#04060a" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <RecenterMap lat={geo.lat} lon={geo.lon} />

        {/* Your atom */}
        {!geo.loading && (
          <CircleMarker
            center={[geo.lat, geo.lon]}
            radius={12}
            pathOptions={{
              fillColor: "#ffd700",
              fillOpacity: 0.9,
              color: "#ffd700",
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ fontFamily: "var(--font-mono)", color: "#04060a" }}>
                <strong>YOU</strong>
                <br />
                state: {atomState}
                <br />
                {geo.label}
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Other players */}
        {nearbyPlayers.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lon]}
            radius={8}
            pathOptions={{
              fillColor: stateColors[p.atom_state] || "#e8f4f8",
              fillOpacity: 0.8,
              color: stateColors[p.atom_state] || "#e8f4f8",
              weight: 1.5,
            }}
          >
            <Popup>
              <div style={{ fontFamily: "var(--font-mono)", color: "#04060a" }}>
                <strong>{p.display_name}</strong>
                <br />
                state: {p.atom_state}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* HUD overlay */}
      <div className="fixed top-4 left-4 z-[1000]" style={{ fontFamily: "var(--font-display)" }}>
        <div className="text-[11px] font-bold tracking-wider" style={{ color: "var(--game-dim)" }}>
          THE RYDBERG ROOM
          <span className="ml-2 font-normal" style={{ color: "rgba(58,80,104,0.5)" }}>
            · GPS MAP
          </span>
        </div>
        <div className="h-px my-1 w-48" style={{ background: "var(--game-panel-border)" }} />
        <div className="text-[9px]" style={{ color: "rgba(58,80,104,0.5)" }}>
          {geo.loading ? "locating..." : `${geo.lat.toFixed(2)}°, ${geo.lon.toFixed(2)}°`}
          {" · "}
          {nearbyPlayers.length} nearby atom{nearbyPlayers.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Status panel */}
      <div
        className="fixed bottom-6 right-6 z-[1000] rounded-lg p-4"
        style={{
          background: "rgba(4,6,10,0.9)",
          border: "1px solid var(--game-panel-border)",
          backdropFilter: "blur(8px)",
          fontFamily: "var(--font-mono)",
          width: 220,
        }}
      >
        <div className="text-[10px] font-bold tracking-wider mb-2" style={{ color: "var(--game-white)" }}>
          YOUR ATOM
        </div>
        <div className="h-px mb-2" style={{ background: "var(--game-panel-border)" }} />

        <div className="flex justify-between text-[10px] mb-1">
          <span style={{ color: "var(--game-dim)" }}>◉ state</span>
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-bold"
            style={{
              background: atomState === "ground" ? "#003d1a" : atomState === "rydberg" ? "#003344" : "#3d0015",
              color: stateColors[atomState],
              border: `1px solid ${stateColors[atomState]}`,
            }}
          >
            {atomState.toUpperCase()}
          </span>
        </div>

        <div className="flex justify-between text-[10px] mb-1">
          <span style={{ color: "var(--game-dim)" }}>◎ nearby</span>
          <span style={{ color: "var(--game-white)" }}>{nearbyPlayers.length} atoms</span>
        </div>

        <div className="flex justify-between text-[10px] mb-3">
          <span style={{ color: "var(--game-dim)" }}>◈ online</span>
          <span style={{ color: "var(--game-white)" }}>{players.length} total</span>
        </div>

        <div className="h-px mb-3" style={{ background: "var(--game-panel-border)" }} />

        {/* Mode switch */}
        <button
          onClick={() => navigate("/")}
          className="w-full text-[10px] font-bold tracking-wider py-2 rounded transition-all"
          style={{
            border: "1px solid var(--game-accent-blue)",
            color: "var(--game-accent-blue)",
            background: "rgba(0,212,255,0.05)",
            fontFamily: "var(--font-display)",
            letterSpacing: "0.15em",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.05)")}
        >
          ← LAB MODE
        </button>
      </div>

      {/* Proximity alert */}
      {nearbyPlayers.length > 0 && (
        <div
          className="fixed bottom-6 left-6 z-[1000] rounded-lg px-4 py-3 animate-pulse"
          style={{
            background: "rgba(0,212,255,0.1)",
            border: "1px solid rgba(0,212,255,0.3)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div className="text-[11px] font-bold" style={{ color: "var(--game-accent-blue)" }}>
            ⚡ {nearbyPlayers.length} ATOM{nearbyPlayers.length > 1 ? "S" : ""} NEARBY
          </div>
          <div className="text-[9px] mt-1" style={{ color: "var(--game-dim)" }}>
            move closer to entangle
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
