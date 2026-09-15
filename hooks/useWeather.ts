import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { trackWeatherViewed, trackCitySaved } from '../utils/analytics';

const SETTINGS_FILE = FileSystem.documentDirectory + 'weather_settings.json';
const CACHE_KEY = '@weather_cache_v2';

export interface PollenData {
  grass: number;
  birch: number;
  ragweed: number;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  humidity: number;
  weatherCode: number;
  isDay: number;
  aqi: number;
  pm2_5: number;
  pm10: number;
  ozone: number;
  nitrogenDioxide: number;
  uvIndex: number;
  surfacePressure: number;
  precipitation: number;
  pollen: PollenData;
  lastUpdated: string;
  daily: {
    time: string[];
    weatherCode: number[];
    temperatureMax: number[];
    temperatureMin: number[];
    sunrise: string[];
    sunset: string[];
    uvIndexMax: number[];
    precipitationSum: number[];
    precipitationProbabilityMax: number[];
    windSpeedMax: number[];
  };
  yesterdayMaxTemp: number;
  hourly: {
    time: string[];
    temperature: number[];
    apparentTemperature: number[];
    relativeHumidity: number[];
    weatherCode: number[];
    precipitationProbability: number[];
    windSpeed: number[];
    isDay: number[];
  };
}

export interface SavedCity {
  name: string;
  latitude: number;
  longitude: number;
}

export interface CitySearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // State/Region
}

const DEFAULT_WEATHER_BACKDROPS: Record<string, string> = {
  clear_day: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?auto=format&fit=crop&w=1080&q=80',
  clear_night: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1080&q=80',
  cloudy_day: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1080&q=80',
  cloudy_night: 'https://images.unsplash.com/photo-1532978879524-7634f590ff91?auto=format&fit=crop&w=1080&q=80',
  rain: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1080&q=80',
  snow: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=1080&q=80',
  thunder: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1080&q=80',
  fog: 'https://images.unsplash.com/photo-1487621167305-5d248087c724?auto=format&fit=crop&w=1080&q=80',
};

export const refineWeatherCode = (code: number, precipitation: number = 0, cloudCover: number = 0, rain: number = 0): number => {
  // If API reports drizzle/shower (codes 51, 53, 80) but actual precipitation is trace (< 0.2mm) and rain is 0:
  if ((code === 51 || code === 53 || code === 80) && precipitation < 0.2 && rain === 0) {
    if (cloudCover <= 25) return 0; // Clear
    if (cloudCover <= 60) return 1; // Mainly clear / scattered clouds
    if (cloudCover <= 85) return 2; // Partly cloudy
    return 3; // Overcast
  }
  return code;
};

const getFallbackBackdrop = (code?: number, isDay?: number): string => {
  const day = isDay !== 0;
  if (code === undefined) return day ? DEFAULT_WEATHER_BACKDROPS.clear_day : DEFAULT_WEATHER_BACKDROPS.clear_night;
  if (code >= 95) return DEFAULT_WEATHER_BACKDROPS.thunder;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return DEFAULT_WEATHER_BACKDROPS.snow;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return DEFAULT_WEATHER_BACKDROPS.rain;
  if (code >= 45 && code <= 48) return DEFAULT_WEATHER_BACKDROPS.fog;
  if (code >= 1 && code <= 3) return day ? DEFAULT_WEATHER_BACKDROPS.cloudy_day : DEFAULT_WEATHER_BACKDROPS.cloudy_night;
  return day ? DEFAULT_WEATHER_BACKDROPS.clear_day : DEFAULT_WEATHER_BACKDROPS.clear_night;
};

export const useWeather = () => {
  const [address, setAddress] = useState<string>('Detecting Location...');
  const [coordinates, setCoordinates] = useState<{lat: number, lon: number} | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [savedCities, setSavedCities] = useState<SavedCity[]>([]);
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [cityImage, setCityImage] = useState<any>(DEFAULT_WEATHER_BACKDROPS.clear_day);

  // 1. Instant Startup: Hydrate from AsyncStorage cache
  useEffect(() => {
    (async () => {
      try {
        const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached && cached.weather) {
            setWeather(cached.weather);
            if (cached.address) setAddress(cached.address);
            if (cached.coordinates) setCoordinates(cached.coordinates);
            if (cached.cityImage) setCityImage(cached.cityImage);
            setIsCached(true);
            setLoading(false);
          }
        }
      } catch (e) {
        console.warn('Cache hydration error:', e);
      }
    })();
  }, []);

  const fetchCityImage = async (cityName: string, weatherCode?: number, isDay?: number): Promise<any> => {
    const fallbackUrl = getFallbackBackdrop(weatherCode, isDay);
    try {
      const accessKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY || 'O8cYL7g7vogChwbYekIEU7c-vjDyEBR0ZD9cZjoDQjo';
      
      // Attempt 1: City skyline photo
      let res = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(cityName + ' skyline')}&orientation=portrait&per_page=1&client_id=${accessKey}`, { timeout: 4500 });
      
      if (res.data && res.data.results && res.data.results.length > 0) {
        const url = res.data.results[0].urls.regular;
        setCityImage(url);
        return url;
      }

      // Attempt 2: Direct city name
      res = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(cityName)}&orientation=portrait&per_page=1&client_id=${accessKey}`, { timeout: 4500 });
      
      if (res.data && res.data.results && res.data.results.length > 0) {
        const url = res.data.results[0].urls.regular;
        setCityImage(url);
        return url;
      }

      // Fallback: Condition-based HD backdrop
      setCityImage(fallbackUrl);
      return fallbackUrl;
    } catch (e) {
      console.warn('Unsplash live fetch skipped or timed out, using curated backdrop');
      setCityImage(fallbackUrl);
      return fallbackUrl;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(SETTINGS_FILE);
        if (fileInfo.exists) {
          const contents = await FileSystem.readAsStringAsync(SETTINGS_FILE);
          const data = JSON.parse(contents);
          if (data.savedCities) setSavedCities(data.savedCities);
        }
      } catch(e) {
        console.error("FS Read error", e);
      }
    })();
  }, []);

  const toggleSavedCity = async (placeName: string, lat: number, lon: number) => {
    let updated;
    const isCurrentlySaved = savedCities.some(c => c.name === placeName);
    if (isCurrentlySaved) {
      updated = savedCities.filter(c => c.name !== placeName);
      trackCitySaved(placeName, 'remove');
    } else {
      updated = [...savedCities, { name: placeName, latitude: lat, longitude: lon }];
      trackCitySaved(placeName, 'add');
    }
    setSavedCities(updated);
    try {
      await FileSystem.writeAsStringAsync(SETTINGS_FILE, JSON.stringify({ savedCities: updated }));
    } catch (e) {
      console.error('FS Write Error', e);
    }
  };

  const autocompleteSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const geoResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=15&language=en&format=json`, { timeout: 5000 });
      if (geoResponse.data.results && geoResponse.data.results.length > 0) {
        setSearchResults(geoResponse.data.results);
      } else {
        const osmResponse = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1`, {
          headers: { 'User-Agent': 'WeatherAppGlobal/1.0 (react-native-expo)' },
          timeout: 5000
        });
        
        if (osmResponse.data && osmResponse.data.length > 0) {
          const mappedFallback: CitySearchResult[] = osmResponse.data.map((item: any, index: number) => {
            const address = item.address || {};
            const placeName = address.city || address.town || address.village || address.district || address.county || item.name || query;
            return {
              id: item.place_id || (index + 99999),
              name: placeName,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              country: address.country || 'Unknown',
              admin1: address.state || address.region || address.county || '',
            };
          });
          setSearchResults(mappedFallback);
        } else {
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error(error);
      setSearchResults([]);
    }
  };

  const fetchWeatherBase = async (latitude: number, longitude: number, placeName: string) => {
    try {
      setLoading(true);
      
      const [weatherResponse, aqiResponse] = await Promise.all([
        axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m,precipitation,rain,showers,cloud_cover,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation_probability,precipitation,rain,showers,cloud_cover,wind_speed_10m,is_day&timezone=auto&past_days=1`, { timeout: 9000 }),
        axios.get(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,uv_index&hourly=grass_pollen,birch_pollen,ragweed_pollen&timezone=auto`, { timeout: 9000 }).catch(() => ({ data: { current: { us_aqi: -1, pm2_5: 0, pm10: 0, ozone: 0, nitrogen_dioxide: 0, uv_index: 0 }, hourly: { grass_pollen: [], birch_pollen: [], ragweed_pollen: [] } } }))
      ]);
      
      const current = weatherResponse.data.current;
      const daily = weatherResponse.data.daily;
      const hourly = weatherResponse.data.hourly;
      
      const aqiCurrent = aqiResponse.data.current || {};
      const aqiHourly = aqiResponse.data.hourly || {};
      
      const currentHourIndex = new Date().getHours();
      const pollenData: PollenData = {
        grass: aqiHourly.grass_pollen && aqiHourly.grass_pollen[currentHourIndex] !== undefined ? Math.round(aqiHourly.grass_pollen[currentHourIndex]) : 0,
        birch: aqiHourly.birch_pollen && aqiHourly.birch_pollen[currentHourIndex] !== undefined ? Math.round(aqiHourly.birch_pollen[currentHourIndex]) : 0,
        ragweed: aqiHourly.ragweed_pollen && aqiHourly.ragweed_pollen[currentHourIndex] !== undefined ? Math.round(aqiHourly.ragweed_pollen[currentHourIndex]) : 0,
      };

      const refinedCurrentCode = refineWeatherCode(
        current.weather_code,
        current.precipitation ?? 0,
        current.cloud_cover ?? 0,
        current.rain ?? 0
      );

      const refinedHourlyCodes = hourly.weather_code.slice(24).map((rawCode: number, idx: number) => {
        const precip = hourly.precipitation ? (hourly.precipitation.slice(24)[idx] ?? 0) : 0;
        const cloud = hourly.cloud_cover ? (hourly.cloud_cover.slice(24)[idx] ?? 0) : 0;
        const rainVal = hourly.rain ? (hourly.rain.slice(24)[idx] ?? 0) : 0;
        return refineWeatherCode(rawCode, precip, cloud, rainVal);
      });

      const newWeatherData: WeatherData = {
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        weatherCode: refinedCurrentCode,
        isDay: current.is_day,
        aqi: aqiCurrent.us_aqi ?? -1,
        pm2_5: Math.round(aqiCurrent.pm2_5 ?? 0),
        pm10: Math.round(aqiCurrent.pm10 ?? 0),
        ozone: Math.round(aqiCurrent.ozone ?? 0),
        nitrogenDioxide: Math.round(aqiCurrent.nitrogen_dioxide ?? 0),
        uvIndex: daily.uv_index_max ? daily.uv_index_max[1] : 0,
        surfacePressure: Math.round(current.surface_pressure ?? 1013),
        precipitation: current.precipitation ?? 0,
        pollen: pollenData,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        daily: {
          time: daily.time.slice(1), // Remove yesterday
          weatherCode: daily.weather_code.slice(1),
          temperatureMax: daily.temperature_2m_max.slice(1),
          temperatureMin: daily.temperature_2m_min.slice(1),
          sunrise: daily.sunrise.slice(1),
          sunset: daily.sunset.slice(1),
          uvIndexMax: daily.uv_index_max.slice(1),
          precipitationSum: daily.precipitation_sum.slice(1),
          precipitationProbabilityMax: daily.precipitation_probability_max ? daily.precipitation_probability_max.slice(1) : daily.time.slice(1).map(() => 0),
          windSpeedMax: daily.wind_speed_10max ? daily.wind_speed_10max.slice(1) : daily.time.slice(1).map(() => current.wind_speed_10m),
        },
        yesterdayMaxTemp: daily.temperature_2m_max[0],
        hourly: {
          time: hourly.time.slice(24),
          temperature: hourly.temperature_2m.slice(24),
          apparentTemperature: hourly.apparent_temperature ? hourly.apparent_temperature.slice(24) : hourly.temperature_2m.slice(24),
          relativeHumidity: hourly.relative_humidity_2m ? hourly.relative_humidity_2m.slice(24) : hourly.temperature_2m.slice(24).map(() => current.relative_humidity_2m),
          weatherCode: refinedHourlyCodes,
          precipitationProbability: hourly.precipitation_probability.slice(24),
          windSpeed: hourly.wind_speed_10m ? hourly.wind_speed_10m.slice(24) : hourly.temperature_2m.slice(24).map(() => current.wind_speed_10m),
          isDay: hourly.is_day ? hourly.is_day.slice(24) : hourly.temperature_2m.slice(24).map(() => 1),
        }
      };

      setWeather(newWeatherData);
      setAddress(placeName);
      setCoordinates({lat: latitude, lon: longitude});
      setErrorMsg(null);
      setIsCached(false);

      // Track telemetry
      trackWeatherViewed(placeName, newWeatherData.temperature, newWeatherData.weatherCode, newWeatherData.aqi);

      const fetchedImg = await fetchCityImage(placeName, refinedCurrentCode, current.is_day);

      // Persist to offline cache
      try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          weather: newWeatherData,
          address: placeName,
          coordinates: { lat: latitude, lon: longitude },
          cityImage: fetchedImg,
        }));
      } catch (cacheErr) {
        console.warn('AsyncStorage cache write error:', cacheErr);
      }

    } catch (err) {
      setErrorMsg('Failed to fetch weather data. Please check your network connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied. Please search for a city above.');
        setLoading(false);
        return;
      }

      // Try current position with balanced accuracy, fallback to last known
      let loc = null;
      try {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (posErr) {
        console.warn('getCurrentPositionAsync failed, trying getLastKnownPositionAsync:', posErr);
        try {
          loc = await Location.getLastKnownPositionAsync({});
        } catch (lastErr) {
          console.warn('getLastKnownPositionAsync failed:', lastErr);
        }
      }

      if (!loc) {
        throw new Error('Unable to retrieve device coordinates');
      }

      const { latitude, longitude } = loc.coords;

      // Safe reverse geocoding
      let placeName = 'Current Location';
      try {
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });

        if (reverseGeocode && reverseGeocode.length > 0) {
          const details = reverseGeocode[0];
          placeName = details.city || details.subregion || details.region || details.district || details.country || 'Current Location';
        }
      } catch (geoError) {
        console.warn('ExpoLocation.reverseGeocodeAsync failed, using OpenStreetMap fallback:', geoError);
        try {
          const osmResponse = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
            headers: { 'User-Agent': 'WeatherAppGlobal/1.0 (react-native-expo)' },
            timeout: 6000
          });
          if (osmResponse.data && osmResponse.data.address) {
            const addr = osmResponse.data.address;
            placeName = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state || 'Current Location';
          }
        } catch (osmErr) {
          console.warn('OSM reverse geocode fallback failed:', osmErr);
        }
      }

      await fetchWeatherBase(latitude, longitude, placeName);
    } catch (err) {
      console.error('Location error:', err);
      setErrorMsg('Failed to get location. Please enable GPS or search for a city above.');
      setLoading(false);
    }
  }, []);

  const refreshWeather = async () => {
    if (coordinates && address) {
      await fetchWeatherBase(coordinates.lat, coordinates.lon, address);
    } else {
      await fetchCurrentLocation();
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  const fetchSavedCitiesWeather = async () => {
    if (savedCities.length === 0) return [];
    try {
      const lats = savedCities.map(c => c.latitude).join(',');
      const lons = savedCities.map(c => c.longitude).join(',');
      const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code,precipitation,rain,cloud_cover,is_day&timezone=auto`, { timeout: 8000 });
      
      const data = Array.isArray(res.data) ? res.data : [res.data];
      return savedCities.map((city, idx) => {
        const cur = data[idx]?.current;
        const refinedCode = refineWeatherCode(
          cur?.weather_code ?? 0,
          cur?.precipitation ?? 0,
          cur?.cloud_cover ?? 0,
          cur?.rain ?? 0
        );
        return {
          ...city,
          temp: cur?.temperature_2m ?? 0,
          weatherCode: refinedCode,
          isDay: cur?.is_day ?? 1,
        };
      });
    } catch (e) {
      console.error('Bulk fetch error', e);
      return [];
    }
  };

  return { 
    address, 
    coordinates, 
    weather, 
    errorMsg, 
    loading, 
    isCached,
    searchResults, 
    cityImage, 
    autocompleteSearch, 
    fetchCurrentLocation, 
    refreshWeather, 
    savedCities, 
    toggleSavedCity, 
    fetchWeatherBase, 
    fetchSavedCitiesWeather 
  };
};
