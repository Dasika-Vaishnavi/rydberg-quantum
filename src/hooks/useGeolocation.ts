import { useState, useEffect } from "react";

interface GeoResult {
  lat: number;
  lon: number;
  label: string;
  loading: boolean;
}

// Fallback locations if geolocation fails
const FALLBACKS = [
  { lat: 37.7, lon: -122.4, label: "san francisco" },
  { lat: 48.9, lon: 2.3, label: "paris" },
  { lat: 55.8, lon: -4.3, label: "glasgow" },
  { lat: -23.5, lon: -46.6, label: "são paulo" },
];

export function useGeolocation(): GeoResult {
  const [result, setResult] = useState<GeoResult>({
    lat: 0,
    lon: 0,
    label: "locating...",
    loading: true,
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setResult({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            label: "approx location",
            loading: false,
          });
        },
        () => {
          // Permission denied or error — use random fallback
          const fb = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
          setResult({ ...fb, loading: false });
        },
        { timeout: 3000 }
      );
    } else {
      const fb = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
      setResult({ ...fb, loading: false });
    }
  }, []);

  return result;
}
