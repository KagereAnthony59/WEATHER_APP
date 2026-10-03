import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Dimensions, 
  ActivityIndicator, 
  Platform, 
  Modal, 
  TextInput, 
  Animated 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

export interface SavedCity {
  name: string;
  latitude: number;
  longitude: number;
  temp?: number;
}

interface SpotData {
  name: string;
  temp: number;
  condition: string;
  wind: number;
  humidity: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  initialLocation: { lat: number; lon: number; name: string };
  savedCities?: SavedCity[];
  theme: any;
}

export const WeatherMap: React.FC<Props> = ({ 
  visible, 
  onClose, 
  initialLocation, 
  savedCities = [], 
  theme 
}) => {
  const [latestRadarTimestamp, setLatestRadarTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [webViewReady, setWebViewReady] = useState(false);
  
  // Base map & style state
  const [isSatelliteBase, setIsSatelliteBase] = useState(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'standard'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Spotter Mode State
  const [isSpotterActive, setIsSpotterActive] = useState(false);
  const [spotLocation, setSpotLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [spotData, setSpotData] = useState<SpotData | null>(null);
  const [isFetchingSpot, setIsFetchingSpot] = useState(false);

  // Animation values
  const spotFade = useRef(new Animated.Value(0)).current;

  const webViewRef = useRef<WebView>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch latest radar layer when visible
  useEffect(() => {
    if (visible) {
      fetchLatestRadar();
      startAutoRefresh();
    } else {
      stopAutoRefresh();
      setSpotLocation(null);
      setSpotData(null);
      setIsSpotterActive(false);
    }
    return () => {
      stopAutoRefresh();
    };
  }, [visible]);

  // Spotter hint banner fade
  useEffect(() => {
    Animated.timing(spotFade, {
      toValue: isSpotterActive ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isSpotterActive]);

  const fetchLatestRadar = async () => {
    try {
      setLoading(true);
      const res = await axios.get('https://api.rainviewer.com/public/weather-maps.json', { timeout: 10000 });
      if (res.data?.radar) {
        const past = res.data.radar.past || [];
        const nowcast = res.data.radar.nowcast || [];
        const all = [...past, ...nowcast];
        if (all.length > 0) {
          // Use the latest past frame or fallback to latest available
          const latestFrame = past.length > 0 ? past[past.length - 1] : all[all.length - 1];
          setLatestRadarTimestamp(latestFrame.time);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch radar data from RainViewer', e);
    } finally {
      setLoading(false);
    }
  };

  const startAutoRefresh = () => {
    stopAutoRefresh();
    refreshTimerRef.current = setInterval(fetchLatestRadar, 5 * 60 * 1000);
  };

  const stopAutoRefresh = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const tileUrl = useMemo(() => {
    if (!latestRadarTimestamp) return '';
    return `https://tilecache.rainviewer.com/v2/radar/${latestRadarTimestamp}/256/{z}/{x}/{y}/1/1_1.png`;
  }, [latestRadarTimestamp]);

  // Sync radar tile update with WebView
  useEffect(() => {
    if (webViewReady && tileUrl) {
      webViewRef.current?.injectJavaScript(`if (window.updateRadar) { window.updateRadar("${tileUrl}"); } true;`);
    }
  }, [tileUrl, webViewReady]);

  // Sync base layer change
  useEffect(() => {
    if (webViewReady) {
      const activeLayer = isSatelliteBase ? 'satellite' : (mapStyle === 'dark' ? 'dark' : 'standard');
      webViewRef.current?.injectJavaScript(`if (window.setMapLayer) { window.setMapLayer("${activeLayer}"); } true;`);
    }
  }, [isSatelliteBase, mapStyle, webViewReady]);

  const getWeatherText = (code: number) => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Raining';
    if (code <= 77) return 'Snowing';
    if (code <= 82) return 'Showers';
    return 'Stormy';
  };

  const handleSpotPress = useCallback(async (latitude: number, longitude: number) => {
    if (!isSpotterActive) return;
    
    setSpotLocation({ latitude, longitude });
    setIsFetchingSpot(true);
    setSpotData(null);

    // Update spot marker in webview
    webViewRef.current?.injectJavaScript(`if (window.setSpotter) { window.setSpotter(${latitude}, ${longitude}); } true;`);

    const tempSpotName = "LOCATING...";
    
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
      const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

      const weatherRes = await axios.get(weatherUrl, { timeout: 8000 }).catch(err => {
        console.warn('Weather fetch error', err);
        return null;
      });

      if (weatherRes && weatherRes.data?.current) {
        const current = weatherRes.data.current;
        setSpotData({
          name: tempSpotName,
          temp: current.temperature_2m,
          condition: getWeatherText(current.weather_code),
          wind: current.wind_speed_10m,
          humidity: current.relative_humidity_2m,
        });
      }

      const geoRes = await axios.get(geoUrl, { timeout: 8000 }).catch(err => {
        console.warn('Geo fetch error', err);
        return null;
      });

      if (geoRes && geoRes.data) {
        const loc = geoRes.data;
        const finalName = loc.locality || loc.city || loc.principalSubdivision || `COORDS: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        
        setSpotData(prev => prev ? { ...prev, name: finalName } : {
          name: finalName,
          temp: 0,
          condition: 'Scanning...',
          wind: 0,
          humidity: 0
        });
      } else {
        setSpotData(prev => prev ? { ...prev, name: `POINT: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}` } : null);
      }
    } catch (err) {
      console.warn('General spotter error', err);
    } finally {
      setIsFetchingSpot(false);
    }
  }, [isSpotterActive]);

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_CLICK') {
        handleSpotPress(data.lat, data.lng);
      } else if (data.type === 'MAP_READY') {
        setWebViewReady(true);
        if (tileUrl) {
          webViewRef.current?.injectJavaScript(`if (window.updateRadar) { window.updateRadar("${tileUrl}"); } true;`);
        }
      }
    } catch (err) {
      console.warn('Error parsing webview message', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery.trim())}&count=1&language=en&format=json`);
      if (res.data.results && res.data.results.length > 0) {
        const result = res.data.results[0];
        webViewRef.current?.injectJavaScript(`if (window.flyTo) { window.flyTo(${result.latitude}, ${result.longitude}, 11); } true;`);
      }
    } catch (e) {
      console.warn('Search geocoding failed', e);
    }
  };

  const reCenter = () => {
    webViewRef.current?.injectJavaScript(`if (window.flyTo) { window.flyTo(${initialLocation.lat}, ${initialLocation.lon}, 7); } true;`);
  };

  const toggleBaseMap = () => setIsSatelliteBase((prev) => !prev);
  const toggleMapStyle = () => setMapStyle(mapStyle === 'dark' ? 'standard' : 'dark');

  const clearSpotter = () => {
    setSpotLocation(null);
    setSpotData(null);
    webViewRef.current?.injectJavaScript(`if (window.setSpotter) { window.setSpotter(null, null); } true;`);
  };

  // Pre-generate map HTML with embedded Leaflet
  const mapHtml = useMemo(() => {
    const savedCitiesJson = JSON.stringify(savedCities);
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #020617; overflow: hidden; }
    .leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }
    
    .pulse-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .pulse-ring {
      position: absolute;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: rgba(56, 189, 248, 0.25);
      border: 1.5px solid rgba(56, 189, 248, 0.7);
      animation: pulse-anim 2s infinite ease-out;
    }
    @keyframes pulse-anim {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .pin-dot {
      width: 14px;
      height: 14px;
      background: #38bdf8;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
      z-index: 10;
    }

    .city-chip {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 4px 8px;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .spotter-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .spotter-ring {
      position: absolute;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px dashed #38bdf8;
      animation: spin-spot 4s linear infinite;
    }
    .spotter-dot {
      width: 10px;
      height: 10px;
      background: #f59e0b;
      border: 2px solid #fff;
      border-radius: 50%;
    }
    @keyframes spin-spot {
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var baseLayers = {
      dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }),
      standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 })
    };

    var map = L.map('map', {
      center: [${initialLocation.lat}, ${initialLocation.lon}],
      zoom: 7,
      layers: [baseLayers.dark],
      zoomControl: false,
      attributionControl: false
    });

    var currentBase = baseLayers.dark;
    var radarLayer = null;
    var spotterMarker = null;

    // Current location pulsing pin
    var currentIcon = L.divIcon({
      className: 'custom-icon',
      html: '<div class="pulse-marker"><div class="pulse-ring"></div><div class="pin-dot"></div></div>',
      iconSize: [46, 46],
      iconAnchor: [23, 23]
    });
    L.marker([${initialLocation.lat}, ${initialLocation.lon}], { icon: currentIcon }).addTo(map);

    // Render Saved Cities
    var savedCities = ${savedCitiesJson};
    if (savedCities && savedCities.length > 0) {
      savedCities.forEach(function(city) {
        var cityHtml = '<div class="city-chip"><span>' + city.name + '</span>' + (city.temp ? '<span style="color:#38bdf8;">' + Math.round(city.temp) + '°</span>' : '') + '</div>';
        var cityIcon = L.divIcon({
          className: 'custom-icon',
          html: cityHtml,
          iconSize: [80, 24],
          iconAnchor: [40, 12]
        });
        L.marker([city.latitude, city.longitude], { icon: cityIcon }).addTo(map);
      });
    }

    // Handle Map Click
    map.on('click', function(e) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MAP_CLICK',
          lat: e.latlng.lat,
          lng: e.latlng.lng
        }));
      }
    });

    window.setMapLayer = function(type) {
      map.removeLayer(currentBase);
      currentBase = (baseLayers[type] || baseLayers.dark).addTo(map);
      if (radarLayer) {
        radarLayer.bringToFront();
      }
    };

    window.updateRadar = function(url) {
      if (!url) {
        if (radarLayer) {
          map.removeLayer(radarLayer);
          radarLayer = null;
        }
        return;
      }
      if (radarLayer) {
        radarLayer.setUrl(url);
      } else {
        radarLayer = L.tileLayer(url, {
          opacity: 0.75,
          zIndex: 10,
          maxNativeZoom: 12,
          tileSize: 256
        }).addTo(map);
      }
    };

    window.flyTo = function(lat, lng, zoom) {
      map.flyTo([lat, lng], zoom || 7, { duration: 1.2 });
    };

    window.setSpotter = function(lat, lng) {
      if (spotterMarker) {
        map.removeLayer(spotterMarker);
        spotterMarker = null;
      }
      if (lat !== null && lng !== null) {
        var spotIcon = L.divIcon({
          className: 'custom-icon',
          html: '<div class="spotter-marker"><div class="spotter-ring"></div><div class="spotter-dot"></div></div>',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
        spotterMarker = L.marker([lat, lng], { icon: spotIcon }).addTo(map);
      }
    };

    // Notify React Native that map is ready
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
    }
  </script>
</body>
</html>`;
  }, [initialLocation.lat, initialLocation.lon, savedCities]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        {/* Leaflet Webview Map Engine */}
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleWebViewMessage}
          onLoadEnd={() => {
            setWebViewReady(true);
            if (tileUrl) {
              webViewRef.current?.injectJavaScript(`if (window.updateRadar) { window.updateRadar("${tileUrl}"); } true;`);
            }
          }}
        />

        {/* UI Overlay */}
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Header */}
          <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={onClose} style={styles.actionBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.title}>Weather Explorer</Text>
              </View>
              <TouchableOpacity onPress={reCenter} style={styles.actionBtn}>
                <Ionicons name="locate" size={20} color="#38bdf8" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.headerBottom}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" style={{ marginRight: 8 }} />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Search city, building or landmark..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
              </View>
            </View>
          </BlurView>

          {/* Side Controls */}
          <View style={styles.sideControls} pointerEvents="box-none">
            <TouchableOpacity onPress={reCenter} style={styles.fabBtn}>
              <Ionicons name="navigate" size={22} color="#fff" />
            </TouchableOpacity>
            
            <BlurView intensity={80} tint="dark" style={styles.controlShelf}>
              <TouchableOpacity onPress={toggleBaseMap} style={[styles.shelfItem, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
                <Ionicons name={isSatelliteBase ? "earth" : "map"} size={20} color={isSatelliteBase ? "#38bdf8" : "#fff"} />
                <Text style={styles.shelfText}>{isSatelliteBase ? 'Sat' : 'Map'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleMapStyle} style={styles.shelfItem} disabled={isSatelliteBase}>
                <Ionicons name={mapStyle === 'dark' ? "moon" : "sunny"} size={20} color={isSatelliteBase ? "rgba(255,255,255,0.2)" : "#fff"} />
                <Text style={[styles.shelfText, isSatelliteBase && { color: 'rgba(255,255,255,0.2)' }]}>{mapStyle === 'dark' ? 'Dark' : 'Std'}</Text>
              </TouchableOpacity>
            </BlurView>

            <BlurView intensity={80} tint="dark" style={[styles.controlShelf, { marginTop: 12 }]}>
              <TouchableOpacity 
                onPress={() => {
                  const nextState = !isSpotterActive;
                  setIsSpotterActive(nextState);
                  if (!nextState) clearSpotter();
                }} 
                style={[styles.shelfItem, isSpotterActive && { backgroundColor: 'rgba(56, 189, 248, 0.3)' }]}
              >
                <Ionicons name="eye" size={22} color={isSpotterActive ? "#38bdf8" : "#fff"} />
                <Text style={[styles.shelfText, isSpotterActive && { color: '#38bdf8' }]}>Spot</Text>
              </TouchableOpacity>
            </BlurView>
          </View>

          {/* Spotter Hint Banner */}
          {isSpotterActive && !spotLocation && (
            <Animated.View style={[styles.hintBanner, { opacity: spotFade }]}>
              <BlurView intensity={80} tint="dark" style={styles.hintContent}>
                <Ionicons name="information-circle" size={16} color="#38bdf8" style={{ marginRight: 6 }} />
                <Text style={styles.hintText}>TAP ANYWHERE ON MAP TO SPOT WEATHER</Text>
              </BlurView>
            </Animated.View>
          )}

          {/* Spotter Info Card */}
          {(isFetchingSpot || spotData) && (
            <View style={styles.spotterCardContainer}>
              <BlurView intensity={100} tint="dark" style={styles.spotterCard}>
                <View style={styles.spotterHeader}>
                  <Text style={styles.spotterTitle} numberOfLines={1}>
                    {isFetchingSpot && !spotData ? 'SCANNING SPOT...' : (spotData?.name.toUpperCase() || 'LOCATING...')}
                  </Text>
                  <TouchableOpacity onPress={clearSpotter}>
                    <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                </View>
                
                {isFetchingSpot && !spotData ? (
                  <View style={{ paddingVertical: 15, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#38bdf8" />
                    <Text style={[styles.spotLabel, { marginTop: 8 }]}>CONNECTING TO ATMOSPHERE</Text>
                  </View>
                ) : spotData && (
                  <View style={styles.spotterContent}>
                    <View style={styles.spotterRow}>
                      <View style={styles.spotterItem}>
                        <Text style={styles.spotValue}>{Math.round(spotData.temp)}°</Text>
                        <Text style={styles.spotLabel}>TEMP</Text>
                      </View>
                      <View style={styles.spotterItem}>
                        <Text style={styles.spotValue}>{spotData.wind}</Text>
                        <Text style={styles.spotLabel}>WIND M/S</Text>
                      </View>
                      <View style={styles.spotterItem}>
                        <Text style={styles.spotValue}>{spotData.humidity}%</Text>
                        <Text style={styles.spotLabel}>HUMIDITY</Text>
                      </View>
                    </View>
                    <View style={styles.conditionPill}>
                      <Text style={styles.spotCondition}>{spotData.condition.toUpperCase()}</Text>
                    </View>
                  </View>
                )}
              </BlurView>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#38bdf8" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFillObject, backgroundColor: '#020617' },
  overlay: { ...StyleSheet.absoluteFillObject },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 34,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerBottom: { width: '100%' },
  searchBar: { height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  actionBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  headerTitleContainer: { alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },

  sideControls: { position: 'absolute', top: 160, right: 15, alignItems: 'flex-end', gap: 12 },
  fabBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#38bdf8', alignItems: 'center', justifyContent: 'center', shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  controlShelf: { width: 62, borderRadius: 20, overflow: 'hidden', paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  shelfItem: { alignItems: 'center', paddingVertical: 8, width: '100%' },
  shelfText: { color: '#fff', fontSize: 8, fontWeight: '800', marginTop: 2, textTransform: 'uppercase' },
  
  hintBanner: { position: 'absolute', top: 140, width: '100%', alignItems: 'center' },
  hintContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  hintText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  
  spotterCardContainer: { position: 'absolute', top: 180, left: 15, width: width * 0.75 },
  spotterCard: { borderRadius: 24, padding: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  spotterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  spotterTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5, flex: 1, marginRight: 10 },
  spotterContent: { alignItems: 'center' },
  spotterRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  spotterItem: { alignItems: 'center' },
  spotValue: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 2 },
  spotLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  conditionPill: { backgroundColor: 'rgba(56, 189, 248, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.4)' },
  spotCondition: { color: '#38bdf8', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  loadingContainer: { position: 'absolute', top: height / 2 - 20, left: width / 2 - 20, zIndex: 100 },
});
