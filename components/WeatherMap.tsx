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

interface FrameData {
  time: number;
  path: string;
  type: 'past' | 'nowcast';
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
  const [radarFrames, setRadarFrames] = useState<FrameData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize radar data fetching when visible
  useEffect(() => {
    if (visible) {
      fetchRadarData();
      startAutoRefresh();
    } else {
      stopAnimation();
      stopAutoRefresh();
      setSpotLocation(null);
      setSpotData(null);
      setIsSpotterActive(false);
    }
    return () => {
      stopAnimation();
      stopAutoRefresh();
    };
  }, [visible]);

  // Handle play/pause animation cycle
  useEffect(() => {
    if (isPlaying && radarFrames.length > 0) {
      startAnimation();
    } else {
      stopAnimation();
    }
  }, [isPlaying, radarFrames, playbackSpeed]);

  // Spotter hint banner fade
  useEffect(() => {
    Animated.timing(spotFade, {
      toValue: isSpotterActive ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isSpotterActive]);

  const fetchRadarData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('https://api.rainviewer.com/public/weather-maps.json', { timeout: 10000 });
      if (res.data?.radar) {
        const pastRadar = (res.data.radar.past || []).map((f: any) => ({ ...f, type: 'past' as const }));
        const nowcastRadar = (res.data.radar.nowcast || []).map((f: any) => ({ ...f, type: 'nowcast' as const }));
        const allFrames = [...pastRadar, ...nowcastRadar];
        setRadarFrames(allFrames);
        if (allFrames.length > 0) {
          const defaultIdx = pastRadar.length > 0 ? pastRadar.length - 1 : 0;
          setCurrentIndex(defaultIdx);
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
    refreshTimerRef.current = setInterval(fetchRadarData, 5 * 60 * 1000);
  };

  const stopAutoRefresh = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const startAnimation = () => {
    stopAnimation();
    const interval = 1000 / playbackSpeed;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (radarFrames.length > 0 ? (prev + 1) % radarFrames.length : 0));
    }, interval);
  };

  const stopAnimation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const currentFrame = radarFrames[currentIndex];
  const currentTimestamp = currentFrame?.time;

  const tileUrl = useMemo(() => {
    if (!currentTimestamp) return '';
    return `https://tilecache.rainviewer.com/v2/radar/${currentTimestamp}/256/{z}/{x}/{y}/1/1_1.png`;
  }, [currentTimestamp]);

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
  const toggleSpeed = () => {
    const speeds = [1, 2, 4];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

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
      border-radius: 50%;
      background: #38bdf8;
      border: 2.5px solid #ffffff;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
      z-index: 2;
    }

    .spotter-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .spotter-ring {
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(245, 158, 11, 0.3);
      border: 1.5px solid #f59e0b;
      animation: pulse-anim 1.5s infinite ease-out;
    }
    .spotter-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #f59e0b;
      border: 2px solid #ffffff;
      box-shadow: 0 0 10px rgba(245, 158, 11, 0.9);
      z-index: 2;
    }

    .city-badge {
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 12px;
      padding: 4px 8px;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transform: translate(-50%, -50%);
    }
    .city-temp {
      color: #38bdf8;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${initialLocation.lat}, ${initialLocation.lon}],
      zoom: 6,
      zoomControl: false,
      attributionControl: false
    });

    var baseLayers = {
      dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }),
      standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 })
    };

    var currentBase = baseLayers.dark.addTo(map);
    var radarLayer = null;
    var spotterMarker = null;

    var mainIcon = L.divIcon({
      className: 'custom-icon',
      html: '<div class="pulse-marker"><div class="pulse-ring"></div><div class="pin-dot"></div></div>',
      iconSize: [46, 46],
      iconAnchor: [23, 23]
    });
    L.marker([${initialLocation.lat}, ${initialLocation.lon}], { icon: mainIcon }).addTo(map);

    try {
      var saved = ${savedCitiesJson};
      if (Array.isArray(saved)) {
        saved.forEach(function(city) {
          if (city && city.latitude && city.longitude) {
            var tempStr = (city.temp !== undefined && city.temp !== null && city.temp !== 0) ? '<span class="city-temp">' + Math.round(city.temp) + '°</span> ' : '';
            var cityIcon = L.divIcon({
              className: 'custom-icon',
              html: '<div class="city-badge">' + tempStr + city.name + '</div>',
              iconSize: [100, 26],
              iconAnchor: [50, 13]
            });
            L.marker([city.latitude, city.longitude], { icon: cityIcon }).addTo(map);
          }
        });
      }
    } catch(e) {}

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
              <TouchableOpacity onPress={toggleSpeed} style={styles.speedBtn}>
                <Text style={styles.speedLabel}>SPEED</Text>
                <Text style={styles.speedText}>{playbackSpeed}x</Text>
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

          {/* Bottom Playback & Scrubber Controls */}
          <View style={styles.bottomControls} pointerEvents="box-none">
            <BlurView intensity={90} tint="dark" style={styles.controlsCard}>
              <View style={styles.playbackHeader}>
                <View>
                  <Text style={styles.timeText}>
                    {currentTimestamp ? new Date(currentTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </Text>
                  <Text style={[styles.typeLabel, currentFrame?.type === 'nowcast' && { color: '#f59e0b' }]}>
                    {currentFrame?.type === 'nowcast' ? 'PREDICTED FUTURE' : 'PRECIPITATION RADAR'}
                  </Text>
                </View>
                
                <View style={styles.legend}>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendPill, { backgroundColor: 'rgba(56, 189, 248, 0.7)' }]} />
                    <View style={[styles.legendPill, { backgroundColor: 'rgba(34, 197, 94, 0.7)' }]} />
                    <View style={[styles.legendPill, { backgroundColor: 'rgba(234, 179, 8, 0.7)' }]} />
                    <View style={[styles.legendPill, { backgroundColor: 'rgba(239, 68, 68, 0.7)' }]} />
                  </View>
                </View>
              </View>

              <View style={styles.scrubberRow}>
                <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)} style={styles.miniPlayBtn}>
                  <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.scrubberContainer}>
                  {radarFrames.map((frame, idx) => (
                    <TouchableOpacity 
                      key={frame.time} 
                      style={[
                        styles.scrubBar, 
                        idx <= currentIndex && { backgroundColor: frame.type === 'nowcast' ? '#f59e0b' : '#38bdf8' },
                        idx === currentIndex && { height: 8, backgroundColor: '#fff' }
                      ]} 
                      onPress={() => { setIsPlaying(false); setCurrentIndex(idx); }}
                    />
                  ))}
                </View>
              </View>
            </BlurView>
          </View>
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
  speedBtn: { width: 50, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(56, 189, 248, 0.15)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  speedLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 7, fontWeight: '800' },
  speedText: { color: '#38bdf8', fontWeight: '800', fontSize: 12, marginTop: -2 },

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
  bottomControls: { position: 'absolute', bottom: 20, left: 15, right: 15 },
  controlsCard: { borderRadius: 24, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  playbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  timeText: { color: '#fff', fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  typeLabel: { color: '#38bdf8', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginTop: 1 },
  scrubberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniPlayBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#38bdf8', alignItems: 'center', justifyContent: 'center' },
  scrubberContainer: { flex: 1, flexDirection: 'row', height: 12, gap: 3, alignItems: 'center' },
  scrubBar: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1.5 },
  legend: { alignItems: 'flex-end' },
  legendRow: { flexDirection: 'row', gap: 2 },
  legendPill: { width: 15, height: 4, borderRadius: 2 },
});
