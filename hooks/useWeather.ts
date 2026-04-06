import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import axios from 'axios';

const SETTINGS_FILE = FileSystem.documentDirectory + 'weather_settings.json';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  humidity: number;
  weatherCode: number;
  isDay: number;
  aqi: number;
  daily: {
    time: string[];
    weatherCode: number[];
    temperatureMax: number[];
    temperatureMin: number[];
    sunrise: string[];
    sunset: string[];
    uvIndexMax: number[];
  };
  hourly: {
    time: string[];
    temperature: number[];
    weatherCode: number[];
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

export const useWeather = () => {
  const [address, setAddress] = useState<string>('Unknown Location');
  const [coordinates, setCoordinates] = useState<{lat: number, lon: number} | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedCities, setSavedCities] = useState<SavedCity[]>([]);
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [cityImage, setCityImage] = useState<string | null>(null);

  const fetchCityImage = async (cityName: string) => {
    try {
      const res = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=1200&titles=${encodeURIComponent(cityName)}&origin=*`, {
        headers: { 'User-Agent': 'WeatherAppTest/1.0 (react-native-expo)' }
      });
      const pages = res.data?.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pageId !== '-1' && pages[pageId].thumbnail) {
          setCityImage(pages[pageId].thumbnail.source);
          return;
        }
      }
      setCityImage(null);
    } catch (e) {
      setCityImage(null);
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
    if (savedCities.some(c => c.name === placeName)) {
      updated = savedCities.filter(c => c.name !== placeName);
    } else {
      updated = [...savedCities, { name: placeName, latitude: lat, longitude: lon }];
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
      const geoResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=15&language=en&format=json`);
      if (geoResponse.data.results && geoResponse.data.results.length > 0) {
        setSearchResults(geoResponse.data.results);
      } else {
        const osmResponse = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1`, {
          headers: { 'User-Agent': 'WeatherAppGlobal/1.0 (react-native-expo)' }
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
        axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&hourly=temperature_2m,weather_code&timezone=auto`),
        axios.get(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi&timezone=auto`).catch(() => ({ data: { current: { us_aqi: -1 } } }))
      ]);
      
      const current = weatherResponse.data.current;
      const daily = weatherResponse.data.daily;
      const hourly = weatherResponse.data.hourly;
      const aqiScore = aqiResponse.data.current?.us_aqi ?? -1;
      
      setWeather({
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        weatherCode: current.weather_code,
        isDay: current.is_day,
        aqi: aqiScore,
        daily: {
          time: daily.time,
          weatherCode: daily.weather_code,
          temperatureMax: daily.temperature_2m_max,
          temperatureMin: daily.temperature_2m_min,
          sunrise: daily.sunrise,
          sunset: daily.sunset,
          uvIndexMax: daily.uv_index_max,
        },
        hourly: {
          time: hourly.time,
          temperature: hourly.temperature_2m,
          weatherCode: hourly.weather_code,
        }
      });
      setAddress(placeName);
      setCoordinates({lat: latitude, lon: longitude});
      setErrorMsg(null);
      fetchCityImage(placeName);
    } catch (err) {
      setErrorMsg('Failed to fetch weather data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });

      let placeName = 'Current Location';
      if (reverseGeocode.length > 0) {
        const details = reverseGeocode[0];
        placeName = details.city || details.region || details.country || 'Current Location';
      }

      await fetchWeatherBase(loc.coords.latitude, loc.coords.longitude, placeName);
    } catch (err) {
      setErrorMsg('Failed to get location');
      console.error(err);
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

  return { address, coordinates, weather, errorMsg, loading, searchResults, cityImage, autocompleteSearch, fetchCurrentLocation, refreshWeather, savedCities, toggleSavedCity, fetchWeatherBase };
};
