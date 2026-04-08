import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, ActivityIndicator, Platform, Modal, TextInput, Animated } from 'react-native';
import MapView, { UrlTile, PROVIDER_GOOGLE, Marker, Region, MapPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

interface SavedCity {
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

export const WeatherMap: React.FC<Props> = ({ visible, onClose, initialLocation, savedCities = [], theme }) => {
  const [radarFrames, setRadarFrames] = useState<FrameData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Advanced State
  const [isSatelliteBase, setIsSatelliteBase] = useState(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'standard'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentZoom, setCurrentZoom] = useState(5);
  
  // Spotter Mode State
  const [isSpotterActive, setIsSpotterActive] = useState(false);
  const [spotLocation, setSpotLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [spotData, setSpotData] = useState<SpotData | null>(null);
  const [isFetchingSpot, setIsFetchingSpot] = useState(false);

  // Animation values
  const spotFade = useRef(new Animated.Value(0)).current;

  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      fetchRadarData();
      startAutoRefresh();
    } else {
      stopAnimation();
      stopAutoRefresh();
    }
    return () => {
        stopAnimation();
        stopAutoRefresh();
    };
  }, [visible]);

  useEffect(() => {
    if (isPlaying && radarFrames.length > 0) {
      startAnimation();
    } else {
      stopAnimation();
    }
  }, [isPlaying, radarFrames, playbackSpeed]);

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
      const res = await axios.get('https://api.rainviewer.com/public/weather-maps.json');
      const pastRadar = res.data.radar.past.map((f: any) => ({ ...f, type: 'past' }));
      const nowcastRadar = res.data.radar.nowcast.map((f: any) => ({ ...f, type: 'nowcast' }));
      const allFrames = [...pastRadar, ...nowcastRadar];
      setRadarFrames(allFrames);
      if (currentIndex === 0 || currentIndex >= allFrames.length) {
          setCurrentIndex(pastRadar.length - 1);
      }
    } catch (e) {
      console.error('Failed to fetch radar data', e);
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
      setCurrentIndex((prev) => (prev + 1) % radarFrames.length);
    }, interval);
  };

  const stopAnimation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const getWeatherText = (code: number) => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Raining';
    if (code <= 77) return 'Snowing';
    if (code <= 82) return 'Showers';
    return 'Stormy';
  };

  const handleMapPress = useCallback(async (e: MapPressEvent) => {
      if (!isSpotterActive) return;
      
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setSpotLocation({ latitude, longitude });
      setIsFetchingSpot(true);
      setSpotData(null);

      // Initial state to show something is happening
      let tempSpotName = "LOCATING...";
      
      try {
          // Fetch weather and location independently for resilience
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
          const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

          const weatherRes = await axios.get(weatherUrl).catch(err => {
              console.error('Weather fetch error', err);
              return null;
          });

          // Update data as soon as we have weather, even if geocoding is still pending
          if (weatherRes && weatherRes.data.current) {
              const current = weatherRes.data.current;
              setSpotData({
                  name: tempSpotName,
                  temp: current.temperature_2m,
                  condition: getWeatherText(current.weather_code),
                  wind: current.wind_speed_10m,
                  humidity: current.relative_humidity_2m,
              });
          }

          // Fetch location and update name
          const geoRes = await axios.get(geoUrl).catch(err => {
              console.error('Geo fetch error', err);
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
          console.error('General spotter error', err);
      } finally {
          setIsFetchingSpot(false);
      }
  }, [isSpotterActive]);

  const currentFrame = radarFrames[currentIndex];
  const currentTimestamp = currentFrame?.time;

  const tileUrl = useMemo(() => {
    if (!currentTimestamp) return null;
    return `https://tilecache.rainviewer.com/v2/radar/${currentTimestamp}/256/{z}/{x}/{y}/1/1_1.png`;
  }, [currentTimestamp]);

  const handleSearch = async () => {
      if (!searchQuery) return;
      try {
          const res = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=1&language=en&format=json`);
          if (res.data.results && res.data.results.length > 0) {
              const result = res.data.results[0];
              mapRef.current?.animateToRegion({
                  latitude: result.latitude,
                  longitude: result.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
              }, 1500);
          }
      } catch (e) {
          console.error('Search failed', e);
      }
  };

  const reCenter = () => {
      mapRef.current?.animateToRegion({
          latitude: initialLocation.lat,
          longitude: initialLocation.lon,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
      }, 1000);
  };

  const handleRegionChange = (region: Region) => {
      const zoom = Math.log2(360 / region.longitudeDelta);
      setCurrentZoom(zoom);
  };

  const toggleBaseMap = () => setIsSatelliteBase((prev) => !prev);
  const toggleMapStyle = () => setMapStyle(mapStyle === 'dark' ? 'standard' : 'dark');
  const toggleSpeed = () => {
      const speeds = [1, 2, 4];
      const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
      setPlaybackSpeed(speeds[nextIdx]);
  };

  const isRadarVisible = currentZoom <= 12;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          mapType={isSatelliteBase ? 'hybrid' : 'standard'}
          initialRegion={{
              latitude: initialLocation.lat,
              longitude: initialLocation.lon,
              latitudeDelta: 5.0,
              longitudeDelta: 5.0,
          }}
          onPress={handleMapPress}
          onRegionChangeComplete={handleRegionChange}
          maxZoomLevel={20}
          minZoomLevel={3}
          zoomControlEnabled={false}
          zoomEnabled={true}
          customMapStyle={(!isSatelliteBase && mapStyle === 'dark') ? darkMapStyle : []}
        >
          {isRadarVisible && tileUrl && (
            <UrlTile
              key={`radar-tile-${currentTimestamp}-${isSatelliteBase}`}
              urlTemplate={tileUrl}
              zIndex={10}
              opacity={0.75}
              maximumZ={12}
              tileSize={256}
            />
          )}

          {spotLocation && (
              <Marker 
                coordinate={spotLocation} 
                onPress={() => setSpotLocation(null)}
                zIndex={20}
              >
                  <View style={styles.spotterMarker}>
                      <View style={styles.spotterPulse} />
                      <View style={styles.spotterDot} />
                  </View>
              </Marker>
          )}
          
          <Marker coordinate={{ latitude: initialLocation.lat, longitude: initialLocation.lon }} zIndex={2}>
            <View style={styles.mainMarker}>
              <View style={styles.pulseContainer}><View style={styles.pulse} /></View>
              <Ionicons name="location-sharp" size={42} color="#4A90E2" style={styles.dropIcon} />
            </View>
          </Marker>

          {savedCities.map((city) => {
            const hasTemp = city.temp && city.temp !== 0;
            return (
              <Marker key={city.name} coordinate={{ latitude: city.latitude, longitude: city.longitude }}>
                <View style={[styles.cityMarker, isSatelliteBase && { backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                  {hasTemp && <Text style={[styles.cityMarkerTemp, isSatelliteBase && { color: '#fff' }]}>{Math.round(city.temp || 0)}°</Text>}
                  <View style={[styles.cityMarkerDot, !hasTemp && { marginTop: 0 }]} />
                </View>
              </Marker>
            );
          })}
        </MapView>

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
                      <Ionicons name={isSatelliteBase ? "earth" : "map"} size={20} color={isSatelliteBase ? "#4A90E2" : "#fff"} />
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
                        setIsSpotterActive(!isSpotterActive);
                        if(isSpotterActive) setSpotLocation(null);
                    }} 
                    style={[styles.shelfItem, isSpotterActive && { backgroundColor: 'rgba(74, 144, 226, 0.3)' }]}
                   >
                      <Ionicons name="eye" size={22} color={isSpotterActive ? "#4A90E2" : "#fff"} />
                      <Text style={[styles.shelfText, isSpotterActive && { color: '#4A90E2' }]}>Spot</Text>
                  </TouchableOpacity>
              </BlurView>
          </View>

          {/* Spotter Hint Banner */}
          {isSpotterActive && !spotLocation && (
              <Animated.View style={[styles.hintBanner, { opacity: spotFade }]}>
                  <BlurView intensity={80} tint="dark" style={styles.hintContent}>
                      <Ionicons name="information-circle" size={16} color="#4A90E2" style={{ marginRight: 6 }} />
                      <Text style={styles.hintText}>TAP ANYWHERE ON MAP TO SPOT WEATHER</Text>
                  </BlurView>
              </Animated.View>
          )}

          {/* Spotter Info Card */}
          {(isFetchingSpot || spotData) && (
              <View style={styles.spotterCardContainer}>
                  <BlurView intensity={100} tint="dark" style={styles.spotterCard}>
                      <View style={styles.spotterHeader}>
                          <Text style={styles.spotterTitle} numberOfLines={1}>{isFetchingSpot && !spotData ? 'SCANNING SPOT...' : (spotData?.name.toUpperCase() || 'LOCATING...')}</Text>
                          <TouchableOpacity onPress={() => { setSpotLocation(null); setSpotData(null); }}>
                              <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
                          </TouchableOpacity>
                      </View>
                      
                      {isFetchingSpot && !spotData ? (
                          <View style={{ paddingVertical: 15, alignItems: 'center' }}>
                             <ActivityIndicator size="small" color="#4A90E2" />
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
               <ActivityIndicator size="large" color="#4A90E2" />
            </View>
          )}

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
                                    idx <= currentIndex && { backgroundColor: frame.type === 'nowcast' ? '#f59e0b' : '#4A90E2' },
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

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#020617" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#94A3B8" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#020617" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1E293B" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
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
  speedBtn: { width: 50, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(74, 144, 226, 0.15)', borderWidth: 1, borderColor: 'rgba(74, 144, 226, 0.3)' },
  speedLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 7, fontWeight: '800' },
  speedText: { color: '#4A90E2', fontWeight: '800', fontSize: 12, marginTop: -2 },

  sideControls: { position: 'absolute', top: 160, right: 15, alignItems: 'flex-end', gap: 12 },
  fabBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4A90E2', alignItems: 'center', justifyContent: 'center', shadowColor: '#4A90E2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  controlShelf: { width: 62, borderRadius: 20, overflow: 'hidden', paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  shelfItem: { alignItems: 'center', paddingVertical: 8, width: '100%' },
  shelfText: { color: '#fff', fontSize: 8, fontWeight: '800', marginTop: 2, textTransform: 'uppercase' },
  
  hintBanner: { position: 'absolute', top: 140, width: '100%', alignItems: 'center' },
  hintContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(74, 144, 226, 0.3)' },
  hintText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  spotterMarker: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  spotterPulse: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(74, 144, 226, 0.2)', borderWidth: 1, borderColor: '#4A90E2' },
  spotterDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff', shadowColor: '#4A90E2', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 5 },
  
  spotterCardContainer: { position: 'absolute', top: 180, left: 15, width: width * 0.75 },
  spotterCard: { borderRadius: 24, padding: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  spotterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  spotterTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5, flex: 1, marginRight: 10 },
  spotterContent: { alignItems: 'center' },
  spotterRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  spotterItem: { alignItems: 'center' },
  spotValue: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 2 },
  spotLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  conditionPill: { backgroundColor: 'rgba(74, 144, 226, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(74, 144, 226, 0.4)' },
  spotCondition: { color: '#4A90E2', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  loadingContainer: { position: 'absolute', top: height / 2 - 20, left: width / 2 - 20, zIndex: 100 },
  bottomControls: { position: 'absolute', bottom: 20, left: 15, right: 15 },
  controlsCard: { borderRadius: 24, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  playbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  timeText: { color: '#fff', fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  typeLabel: { color: '#4A90E2', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginTop: 1 },
  scrubberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniPlayBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4A90E2', alignItems: 'center', justifyContent: 'center' },
  scrubberContainer: { flex: 1, flexDirection: 'row', height: 12, gap: 3, alignItems: 'center' },
  scrubBar: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1.5 },
  legend: { alignItems: 'flex-end' },
  legendRow: { flexDirection: 'row', gap: 2 },
  legendPill: { width: 15, height: 4, borderRadius: 2 },
  mainMarker: { alignItems: 'center', justifyContent: 'center' },
  pulseContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(74, 144, 226, 0.2)', borderWidth: 1, borderColor: 'rgba(74, 144, 226, 0.4)' },
  dropIcon: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 8 },
  cityMarker: { backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  cityMarkerTemp: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  cityMarkerDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#4A90E2', marginTop: 2 }
});
