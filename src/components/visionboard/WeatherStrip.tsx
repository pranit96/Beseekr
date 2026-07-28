/**
 * WeatherStrip.tsx
 *
 * Dual-mode weather strip:
 *  1. Real weather — asks for geolocation → calls Open-Meteo (free, no API key) + Nominatim for city
 *  2. Mood tag — user types a manual vibe label
 *
 * Both are persisted to the backend. Strip shows both simultaneously:
 *   🌤 Mumbai • 29°C  Partly Cloudy   |  ☁ Calm Morning  (user mood)
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudSun, Pencil, Check, RefreshCw, MapPin } from "lucide-react";
import type { WeatherData } from "@/api/visionboard";

// ── Open-Meteo WMO code → emoji + label map (subset) ──────────────────────────
const WMO_MAP: Record<number, { emoji: string; label: string }> = {
  0:  { emoji: "☀️",  label: "Clear Sky"       },
  1:  { emoji: "🌤",  label: "Mainly Clear"     },
  2:  { emoji: "⛅",  label: "Partly Cloudy"    },
  3:  { emoji: "☁️",  label: "Overcast"         },
  45: { emoji: "🌫",  label: "Foggy"            },
  48: { emoji: "🌫",  label: "Icy Fog"          },
  51: { emoji: "🌦",  label: "Light Drizzle"    },
  61: { emoji: "🌧",  label: "Light Rain"       },
  63: { emoji: "🌧",  label: "Moderate Rain"    },
  65: { emoji: "🌧",  label: "Heavy Rain"       },
  71: { emoji: "🌨",  label: "Light Snow"       },
  73: { emoji: "❄️",  label: "Moderate Snow"    },
  80: { emoji: "🌦",  label: "Rain Showers"     },
  95: { emoji: "⛈",  label: "Thunderstorm"     },
};

function wmo(code: number) {
  return WMO_MAP[code] ?? { emoji: "🌡", label: `WMO ${code}` };
}

interface WeatherStripProps {
  year: number;
  month: number;
  cached: WeatherData | null;
  onSave: (payload: Partial<WeatherData>) => Promise<any>;
}

type Phase = "idle" | "fetching" | "error";

export function WeatherStrip({ year, month, cached, onSave }: WeatherStripProps) {
  const [weather, setWeather]     = useState<Partial<WeatherData>>(cached ?? {});
  const [phase, setPhase]         = useState<Phase>("idle");
  const [editingMood, setEditMood] = useState(false);
  const [moodDraft, setMoodDraft]  = useState(cached?.mood_tag ?? "");
  const [saving, setSaving]        = useState(false);

  // Sync cached → local when month changes
  useEffect(() => {
    setWeather(cached ?? {});
    setMoodDraft(cached?.mood_tag ?? "");
  }, [year, month, cached]);

  // ── Geolocation + Open-Meteo ────────────────────────────────────────────────
  const fetchRealWeather = useCallback(async () => {
    setPhase("fetching");
    try {
      // 1. Geolocation
      const { latitude: lat, longitude: lon } = await new Promise<GeolocationCoordinates>(
        (res, rej) =>
          navigator.geolocation.getCurrentPosition(
            (pos) => res(pos.coords),
            (err) => rej(new Error(`Geo denied: ${err.message}`)),
            { timeout: 8000 }
          )
      );

      // 2. Open-Meteo (no key, free forever)
      const meteoUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current_weather=true&temperature_unit=celsius`;
      const meteoRes = await fetch(meteoUrl);
      if (!meteoRes.ok) throw new Error("Open-Meteo request failed");
      const meteoJson = await meteoRes.json();
      const cw   = meteoJson.current_weather;
      const info = wmo(cw.weathercode);

      // 3. Reverse geocode (Nominatim — no key required for reasonable usage)
      const geoRes  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const geoJson = await geoRes.json();
      const city    = geoJson.address?.city
                   || geoJson.address?.town
                   || geoJson.address?.village
                   || geoJson.address?.county
                   || "Unknown";

      const update: Partial<WeatherData> = {
        lat:          lat,
        lon:          lon,
        city,
        temperature:  parseFloat(cw.temperature.toFixed(1)),
        weather_desc: info.label,
        weather_icon: info.emoji,
      };
      setWeather((prev) => ({ ...prev, ...update }));
      setSaving(true);
      await onSave(update);
      setSaving(false);
      setPhase("idle");
    } catch (e: any) {
      setPhase("error");
    }
  }, [onSave]);

  // ── Mood save ────────────────────────────────────────────────────────────────
  async function saveMood() {
    setSaving(true);
    await onSave({ mood_tag: moodDraft });
    setWeather((prev) => ({ ...prev, mood_tag: moodDraft }));
    setSaving(false);
    setEditMood(false);
  }

  const hasReal  = !!weather.temperature;
  const hasMood  = !!weather.mood_tag;
  const showFetch = !hasReal || phase === "error";

  return (
    <motion.div
      className="vb-weather-strip"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Real weather segment */}
      <div className="vb-weather-seg">
        {hasReal ? (
          <span className="vb-weather-real">
            <span className="vb-weather-icon">{weather.weather_icon}</span>
            {weather.city && (
              <span className="vb-weather-city">
                <MapPin size={10} />
                {weather.city}
              </span>
            )}
            <span className="vb-weather-temp">{weather.temperature}°C</span>
            <span className="vb-weather-desc">{weather.weather_desc}</span>
          </span>
        ) : (
          <span className="vb-weather-empty">
            <CloudSun size={13} />
            No weather yet
          </span>
        )}

        {/* Fetch / refresh button */}
        <motion.button
          className="vb-weather-fetch-btn"
          onClick={fetchRealWeather}
          disabled={phase === "fetching"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Fetch real weather (uses your location)"
        >
          <RefreshCw size={11} className={phase === "fetching" ? "vb-spin" : ""} />
          {phase === "fetching" ? "Fetching…" : phase === "error" ? "Failed — retry" : hasReal ? "Refresh" : "Get Weather"}
        </motion.button>
      </div>

      <span className="vb-weather-sep">•</span>

      {/* Mood tag segment */}
      <div className="vb-weather-seg">
        <AnimatePresence mode="wait">
          {editingMood ? (
            <motion.div
              key="edit"
              className="vb-edit-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="vb-mood-prefix">☁</span>
              <input
                className="vb-mood-input vb-mood-strip-input"
                value={moodDraft}
                onChange={(e) => setMoodDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveMood(); if (e.key === "Escape") setEditMood(false); }}
                placeholder="e.g. Productive, Calm…"
                autoFocus
                maxLength={40}
              />
              <button className="vb-save-btn" onClick={saveMood} disabled={saving}>
                <Check size={12} />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="display"
              className="vb-mood-display"
              onClick={() => setEditMood(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span>☁</span>
              <span>{hasMood ? weather.mood_tag : "Set mood vibe"}</span>
              <Pencil size={10} className="vb-inline-pencil" style={{ opacity: 0.5 }} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
