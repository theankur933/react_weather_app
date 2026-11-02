import React, { useEffect, useState } from "react";
import {
  Search,
  MapPin,
  Navigation,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Droplets,
  Wind,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Thermometer,
  LoaderCircle,
  RefreshCw,
  Moon,
  CloudDrizzle,
} from "lucide-react";
import "./index.css";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

function weatherInfo(code, isDay = true) {
  if (code === 0)
    return {
      label: "Clear sky",
      icon: isDay ? Sun : Moon,
    };
  if ([1, 2].includes(code))
    return {
      label: "Partly cloudy",
      icon: isDay ? CloudSun : Cloud,
    };
  if (code === 3) return { label: "Overcast", icon: Cloud };
  if ([45, 48].includes(code)) return { label: "Foggy", icon: CloudFog };
  if ([51, 53, 55, 56, 57].includes(code))
    return { label: "Drizzle", icon: CloudDrizzle };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { label: "Rainy", icon: CloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { label: "Snowy", icon: CloudSnow };
  if ([95, 96, 99].includes(code))
    return { label: "Thunderstorm", icon: CloudLightning };
  return { label: "Cloudy", icon: Cloud };
}

function App() {
  const [city, setCity] = useState("Delhi");
  const [search, setSearch] = useState("");
  const [weather, setWeather] = useState(null);
  const [unit, setUnit] = useState("C");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);

  const temperature = (value) =>
    unit === "C" ? Math.round(value) : Math.round((value * 9) / 5 + 32);

  const speed = (value) => Math.round(value * 10) / 10;

  async function loadWeather(place) {
    setLoading(true);
    setError("");

    try {
      const geo = await fetch(
        `${GEO_URL}?name=${encodeURIComponent(place)}&count=1&language=en&format=json`,
      );
      if (!geo.ok) throw new Error("Unable to search for this city.");

      const geoData = await geo.json();
      const result = geoData.results?.[0];

      if (!result) throw new Error("City not found. Try another city.");

      await fetchWeather(result);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  }

  async function fetchWeather(place) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        latitude: place.latitude,
        longitude: place.longitude,
        current: [
          "temperature_2m",
          "relative_humidity_2m",
          "apparent_temperature",
          "is_day",
          "precipitation",
          "weather_code",
          "wind_speed_10m",
          "surface_pressure",
        ].join(","),
        hourly: [
          "temperature_2m",
          "precipitation_probability",
          "weather_code",
          "relative_humidity_2m",
        ].join(","),
        daily: [
          "weather_code",
          "temperature_2m_max",
          "temperature_2m_min",
          "sunrise",
          "sunset",
          "uv_index_max",
          "precipitation_probability_max",
        ].join(","),
        timezone: "auto",
        forecast_days: 7,
        forecast_hours: 24,
      });

      const response = await fetch(`${WEATHER_URL}?${params}`);
      if (!response.ok) throw new Error("Weather service unavailable.");

      const data = await response.json();

      setLocation({
        name: place.name,
        country: place.country,
        admin: place.admin1,
        latitude: place.latitude,
        longitude: place.longitude,
      });
      setWeather(data);
      setCity(place.name);
    } catch (err) {
      setError(err.message || "Could not load weather.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather("Delhi");
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) {
      loadWeather(search.trim());
      setSearch("");
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `${GEO_URL}?name=${coords.latitude},${coords.longitude}&count=1&language=en`,
          );
          const data = await response.json();
          const place = data.results?.[0];

          if (place) {
            await fetchWeather({
              ...place,
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
          } else {
            await fetchWeather({
              name: "My Location",
              country: "",
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
          }
        } catch {
          setError("Could not detect your location.");
          setLoading(false);
        }
      },
      () => {
        setError("Location permission denied. Search for a city instead.");
        setLoading(false);
      },
    );
  }

  const current = weather?.current;
  const hourly = weather?.hourly;
  const daily = weather?.daily;
  const currentInfo = current
    ? weatherInfo(current.weather_code, current.is_day)
    : weatherInfo(0);

  const formatHour = (time) =>
    new Date(time).toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });

  const formatDay = (time, index) => {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";
    return new Date(time).toLocaleDateString("en-US", {
      weekday: "short",
    });
  };

  const hourIndices = hourly
    ? hourly.time
        .map((_, i) => i)
        .filter((i) => new Date(hourly.time[i]) >= new Date())
        .slice(0, 24)
    : [];

  const uvLabel = (uv) =>
    uv <= 2
      ? "Low"
      : uv <= 5
        ? "Moderate"
        : uv <= 7
          ? "High"
          : uv <= 10
            ? "Very high"
            : "Extreme";

  return (
    <main className="app">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Weatherly home">
          <span className="brand-icon">
            <CloudSun size={25} />
          </span>
          <span>
            weatherly<span className="brand-dot">.</span>
          </span>
        </a>

        <div className="header-right">
          <span className="live-status">
            <span className="live-dot" /> LIVE WEATHER
          </span>
          <div className="unit-switch">
            <button
              className={unit === "C" ? "active" : ""}
              onClick={() => setUnit("C")}
            >
              °C
            </button>
            <button
              className={unit === "F" ? "active" : ""}
              onClick={() => setUnit("F")}
            >
              °F
            </button>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">YOUR PERSONAL WEATHER STATION</span>
          <h1>
            Every day, <span>in focus.</span>
          </h1>
          <p>
            Beautifully simple weather forecasts for wherever life takes you.
          </p>
        </div>

        <form className="search-bar" onSubmit={handleSearch}>
          <Search size={19} />
          <input
            aria-label="Search city"
            placeholder="Search city or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" disabled={!search.trim()}>
            Search
          </button>
        </form>
      </section>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      {loading && !weather && (
        <div className="loading-screen">
          <LoaderCircle className="spin" size={32} />
          <p>Getting your forecast...</p>
        </div>
      )}

      {weather && current && (
        <>
          <section className="location-row">
            <div>
              <div className="location-name">
                <MapPin size={18} />
                <h2>{location?.name || city}</h2>
                {location?.country && <span>{location.country}</span>}
              </div>
              <p>
                {location?.admin ? `${location.admin} · ` : ""}
                Local time:{" "}
                {new Date().toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: weather.timezone,
                })}
              </p>
            </div>

            <div className="location-actions">
              <button className="icon-button" onClick={useMyLocation}>
                <Navigation size={16} /> My location
              </button>
              <button
                className="icon-button"
                onClick={() => location && fetchWeather(location)}
                aria-label="Refresh weather"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </section>

          <section className="main-grid">
            <div className="current-card">
              <div className="card-top">
                <span>CURRENT WEATHER</span>
                <span className="updated">● LIVE DATA</span>
              </div>

              <div className="current-main">
                <div>
                  <div className="temperature">
                    {temperature(current.temperature_2m)}
                    <sup>°{unit}</sup>
                  </div>
                  <h3>{currentInfo.label}</h3>
                  <p>
                    Feels like {temperature(current.apparent_temperature)}°
                    {unit}
                  </p>
                </div>
                <div className="hero-weather-icon">
                  <currentInfo.icon size={112} strokeWidth={1.2} />
                </div>
              </div>

              <div className="current-footer">
                <span>
                  <Thermometer size={17} /> Real-time conditions
                </span>
                <span>
                  {new Date(current.time).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="details-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">AT A GLANCE</span>
                  <h3>Weather details</h3>
                </div>
              </div>

              <div className="details-grid">
                <Detail
                  icon={Droplets}
                  label="Humidity"
                  value={`${current.relative_humidity_2m}%`}
                  sub="Relative humidity"
                />
                <Detail
                  icon={Wind}
                  label="Wind speed"
                  value={`${speed(current.wind_speed_10m)} km/h`}
                  sub="At ground level"
                />
                <Detail
                  icon={Eye}
                  label="Visibility"
                  value="—"
                  sub="Not available"
                />
                <Detail
                  icon={Gauge}
                  label="Pressure"
                  value={`${Math.round(current.surface_pressure)} hPa`}
                  sub="Surface pressure"
                />
                <Detail
                  icon={CloudRain}
                  label="Precipitation"
                  value={`${current.precipitation} mm`}
                  sub="Current amount"
                />
                <Detail
                  icon={Sun}
                  label="UV index"
                  value={daily ? daily.uv_index_max[0] : "—"}
                  sub={daily ? uvLabel(daily.uv_index_max[0]) : "Daily maximum"}
                />
              </div>
            </div>
          </section>

          <section className="content-card hourly-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">PLAN YOUR DAY</span>
                <h3>Hourly forecast</h3>
              </div>
              <span className="subtle-label">Next 24 hours</span>
            </div>

            <div className="hourly-list">
              {hourIndices.map((i) => {
                const info = weatherInfo(
                  hourly.weather_code[i],
                  new Date(hourly.time[i]).getHours() >= 6 &&
                    new Date(hourly.time[i]).getHours() < 19,
                );
                const Icon = info.icon;
                return (
                  <div className="hour-item" key={hourly.time[i]}>
                    <span className="hour-time">
                      {formatHour(hourly.time[i])}
                    </span>
                    <Icon size={27} strokeWidth={1.6} />
                    <strong>{temperature(hourly.temperature_2m[i])}°</strong>
                    <span className="rain-chance">
                      <Droplets size={12} />
                      {hourly.precipitation_probability[i] ?? 0}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="content-card weekly-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">THE WEEK AHEAD</span>
                <h3>7-day forecast</h3>
              </div>
              <span className="subtle-label">Daily outlook</span>
            </div>

            <div className="weekly-list">
              {daily.time.map((day, i) => {
                const info = weatherInfo(daily.weather_code[i]);
                const Icon = info.icon;
                return (
                  <div className="day-row" key={day}>
                    <span className="day-name">{formatDay(day, i)}</span>
                    <div className="day-condition">
                      <Icon size={24} strokeWidth={1.6} />
                      <span>{info.label}</span>
                    </div>
                    <div className="day-rain">
                      <Droplets size={13} />
                      {daily.precipitation_probability_max[i] ?? 0}%
                    </div>
                    <div className="day-temperatures">
                      <span>{temperature(daily.temperature_2m_max[i])}°</span>
                      <div className="temp-track">
                        <span
                          style={{
                            left: `${Math.max(
                              0,
                              Math.min(
                                85,
                                (daily.temperature_2m_min[i] + 10) * 2,
                              ),
                            )}%`,
                            width: "30%",
                          }}
                        />
                      </div>
                      <span>{temperature(daily.temperature_2m_min[i])}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="sun-cards">
            <div className="sun-card">
              <div className="sun-icon sunrise">
                <Sunrise size={28} />
              </div>
              <div>
                <span>SUNRISE</span>
                <strong>
                  {new Date(daily.sunrise[0]).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </strong>
              </div>
            </div>
            <div className="sun-card">
              <div className="sun-icon sunset">
                <Sunset size={28} />
              </div>
              <div>
                <span>SUNSET</span>
                <strong>
                  {new Date(daily.sunset[0]).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </strong>
              </div>
            </div>
          </section>
        </>
      )}

      <footer className="footer">
        <div className="brand footer-brand">
          <CloudSun size={20} /> weatherly<span className="brand-dot">.</span>
        </div>
        <p>Weather data provided by Open-Meteo · Made for everyday living.</p>
      </footer>
    </main>
  );
}

function Detail({ icon: Icon, label, value, sub }) {
  return (
    <div className="detail-item">
      <div className="detail-icon">
        <Icon size={20} />
      </div>
      <div>
        <span className="detail-label">{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}

export default App;
