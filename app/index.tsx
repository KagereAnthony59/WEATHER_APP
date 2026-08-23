import { View, Text, StyleSheet, ActivityIndicator, Animated, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, RefreshControl, Modal, Switch, ImageBackground } from 'react-native';
import { useEffect, useRef, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useWeather, CitySearchResult } from '../hooks/useWeather';
import { WeatherOverlay } from '../components/WeatherOverlay';
import { WeatherNarrative } from '../components/WeatherNarrative';
import { MultiCityDashboard } from '../components/MultiCityDashboard';
import { WeatherMap } from '../components/WeatherMap';
import { SoundscapePlayer } from '../components/SoundscapePlayer';
import { LifestyleAdvisories } from '../components/LifestyleAdvisories';
import { CelestialArc } from '../components/CelestialArc';
import { HealthMetrics } from '../components/HealthMetrics';
import { TimeTravelSlider } from '../components/TimeTravelSlider';
import { WeatherShareCard } from '../components/WeatherShareCard';
import { triggerImpactLight, triggerImpactMedium, triggerSelection } from '../utils/haptics';

export default function WeatherScreen() {
  const { 
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
  } = useWeather();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Premium Settings State
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [shareCardVisible, setShareCardVisible] = useState(false);
  const [isFahrenheit, setIsFahrenheit] = useState(false);
  const [isMph, setIsMph] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [is24Hour, setIs24Hour] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  
  // Time travel scrubber preview
  const [previewHourIndex, setPreviewHourIndex] = useState<number | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Refresh handler
  const onRefresh = useCallback(async () => {
    triggerImpactLight();
    setRefreshing(true);
    await refreshWeather();
    setRefreshing(false);
  }, [refreshWeather]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [loading, fadeAnim]);

  const getForecastBorderColor = (code: number, isDay: number) => {
    if (code === 0) return isDay ? 'rgba(245, 158, 11, 0.8)' : 'rgba(253, 224, 71, 0.6)';
    if (code >= 1 && code <= 3) return 'rgba(226, 232, 240, 0.8)';
    if (code >= 45 && code <= 48) return 'rgba(203, 213, 225, 0.7)';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rgba(56, 189, 248, 0.8)';
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'rgba(255, 255, 255, 0.9)';
    if (code >= 95 && code <= 99) return 'rgba(129, 140, 248, 0.8)';
    return 'rgba(255, 255, 255, 0.5)';
  };

  const WeatherIcon = ({ code, isDay, size, style }: { code: number, isDay: number, size: number, style?: any }) => {
    if (code === 0) {
      return <Ionicons name={isDay ? 'sunny' : 'moon'} size={size} color={isDay ? '#f59e0b' : '#fef08a'} style={style} />;
    } else if (code >= 1 && code <= 3) {
      return (
        <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
          <Ionicons name={isDay ? 'sunny' : 'moon'} size={size * 0.7} color={isDay ? '#f59e0b' : '#fef08a'} style={{ position: 'absolute', top: 0, right: 0 }} />
          <Ionicons name="cloud" size={size * 0.8} color="#cbd5e1" style={{ position: 'absolute', bottom: size * 0.05, left: 0 }} />
        </View>
      );
    } else if (code >= 45 && code <= 48) {
      return <Ionicons name="cloud" size={size} color="#cbd5e1" style={style} />;
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      return (
        <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
          <Ionicons name="cloud" size={size * 0.8} color="#94a3b8" style={{ position: 'absolute', top: size * 0.05 }} />
          <Ionicons name="water" size={size * 0.3} color="#38bdf8" style={{ position: 'absolute', bottom: 0, left: size * 0.25 }} />
          <Ionicons name="water" size={size * 0.3} color="#38bdf8" style={{ position: 'absolute', bottom: 0, right: size * 0.25 }} />
        </View>
      );
    } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
      return <Ionicons name="snow" size={size} color="#e0f2fe" style={style} />;
    } else if (code >= 95 && code <= 99) {
      return (
        <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
          <Ionicons name="cloud" size={size * 0.8} color="#94a3b8" style={{ position: 'absolute', top: size * 0.05 }} />
          <Ionicons name="flash" size={size * 0.5} color="#fbbf24" style={{ position: 'absolute', bottom: -size * 0.05 }} />
        </View>
      );
    } else {
      return <Ionicons name={isDay ? 'sunny' : 'moon'} size={size} color={isDay ? '#f59e0b' : '#fef08a'} style={style} />;
    }
  };

  const getGradientColors = (code: number, isDay: number) => {
    if (isDarkMode) {
      if (!isDay) return ['#0B101E', '#1B2838'] as const;
      if (code === 0) return ['#1e3a8a', '#0f172a'] as const;
      if (code >= 1 && code <= 3) return ['#334155', '#0f172a'] as const;
      if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return ['#1e293b', '#020617'] as const;
      if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return ['#475569', '#0f172a'] as const;
      return ['#0f172a', '#020617'] as const;
    } else {
      if (!isDay) return ['#64748b', '#334155'] as const;
      if (code === 0) return ['#7dd3fc', '#e0f2fe'] as const;
      if (code >= 1 && code <= 3) return ['#bae6fd', '#f1f5f9'] as const;
      if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return ['#cdb4db', '#bde0fe'] as const;
      if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return ['#e0f2fe', '#ffffff'] as const;
      return ['#93c5fd', '#eff6ff'] as const;
    }
  };

  // Active or Preview weather data
  const isPreviewing = previewHourIndex !== null && weather?.hourly?.temperature[previewHourIndex] !== undefined;
  
  const currentTemp = isPreviewing 
    ? weather!.hourly.temperature[previewHourIndex!]
    : (weather?.temperature ?? 0);

  const currentFeelsLike = isPreviewing 
    ? weather!.hourly.apparentTemperature[previewHourIndex!]
    : (weather?.feelsLike ?? 0);

  const currentCode = isPreviewing 
    ? weather!.hourly.weatherCode[previewHourIndex!]
    : (weather?.weatherCode ?? 0);

  const currentIsDay = isPreviewing 
    ? weather!.hourly.isDay[previewHourIndex!]
    : (weather?.isDay ?? 1);

  const currentHumidity = isPreviewing 
    ? weather!.hourly.relativeHumidity[previewHourIndex!]
    : (weather?.humidity ?? 0);

  const currentWind = isPreviewing 
    ? weather!.hourly.windSpeed[previewHourIndex!]
    : (weather?.windSpeed ?? 0);

  const currentColors = weather 
    ? getGradientColors(currentCode, currentIsDay)
    : (isDarkMode ? ['#0f172a', '#020617'] as const : ['#7dd3fc', '#e0f2fe'] as const);

  const isSaved = savedCities.some(c => c.name === address);
  const handleToggleSave = () => {
    triggerImpactMedium();
    if (coordinates) {
      toggleSavedCity(address, coordinates.lat, coordinates.lon);
    }
  };

  const handleSelectCity = (city: CitySearchResult) => {
    triggerSelection();
    setSearchQuery('');
    autocompleteSearch('');
    setPreviewHourIndex(null);
    fetchWeatherBase(city.latitude, city.longitude, city.name);
  };

  // Formatters
  const displayTemp = (c: number) => Math.round(isFahrenheit ? (c * 9/5) + 32 : c);
  const displaySpeed = (kmh: number) => Math.round(isMph ? kmh * 0.621371 : kmh);

  // Dynamic Theme
  const t = isDarkMode ? {
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.65)',
    cardBg: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255,255,255,0.15)',
    searchBg: 'rgba(255, 255, 255, 0.12)',
    modalBg: '#0F172A',
    modalBorder: 'rgba(255,255,255,0.15)',
    pillBg: 'rgba(255, 255, 255, 0.08)',
    shadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.44,
        shadowRadius: 10.32,
        elevation: 16,
    }
  } : {
    text: '#0f172a',
    subtext: '#475569',
    cardBg: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(255,255,255,0.8)',
    searchBg: 'rgba(255, 255, 255, 0.8)',
    modalBg: '#f8fafc',
    modalBorder: 'rgba(0,0,0,0.05)',
    pillBg: 'rgba(255,255,255,0.9)',
    shadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {cityImage && (
        <ImageBackground source={{ uri: cityImage }} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient colors={currentColors} style={[StyleSheet.absoluteFill, { opacity: cityImage ? (isDarkMode ? 0.75 : 0.6) : 1 }]} />
      
      {weather && <WeatherOverlay weatherCode={currentCode} isDay={currentIsDay} />}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        {/* Top Floating Control Bar */}
        <View style={{ zIndex: 20, paddingTop: Platform.OS === 'android' ? 10 : 0 }}>
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: t.searchBg, color: t.text }, t.shadow]}
              placeholder="Search city or country..."
              placeholderTextColor={t.subtext}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                autocompleteSearch(text);
              }}
              onSubmitEditing={() => {
                if (searchResults.length > 0) {
                  handleSelectCity(searchResults[0]);
                }
              }}
            />
            
            <TouchableOpacity onPress={fetchCurrentLocation} style={[styles.iconButton, { backgroundColor: t.searchBg }, t.shadow]}>
              <Ionicons name="location-outline" size={20} color={t.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { triggerImpactLight(); setShareCardVisible(true); }} style={[styles.iconButton, { backgroundColor: t.searchBg }, t.shadow]}>
              <Ionicons name="share-social-outline" size={20} color={t.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { triggerImpactLight(); setSettingsVisible(true); }} style={[styles.iconButton, { backgroundColor: t.searchBg }, t.shadow]}>
              <Ionicons name="settings-outline" size={20} color={t.text} />
            </TouchableOpacity>
          </View>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && searchQuery.length > 1 && (
            <View style={[styles.autocompleteContainer, { backgroundColor: t.modalBg, borderColor: t.modalBorder }]}>
              <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
                {searchResults.map((city, idx) => (
                  <TouchableOpacity key={city.id} style={[styles.autocompleteItem, idx < searchResults.length - 1 && { borderBottomColor: t.modalBorder, borderBottomWidth: 1 }]} onPress={() => handleSelectCity(city)}>
                    <Ionicons name="map-outline" size={20} color={t.text} style={{ marginRight: 10 }} />
                    <View>
                      <Text style={[styles.autocompleteName, { color: t.text }]}>{city.name}</Text>
                      <Text style={[styles.autocompleteRegion, { color: t.subtext }]}>{city.admin1 ? city.admin1 + ', ' : ''}{city.country}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Quick Toolbar (Soundscape + Saved Cities compare) */}
          <View style={styles.quickBarRow}>
            <SoundscapePlayer weatherCode={currentCode} isDay={currentIsDay} theme={t} />

            {savedCities.length > 0 && (
              <TouchableOpacity onPress={() => { triggerSelection(); setDashboardVisible(true); }} style={[styles.comparePill, { backgroundColor: t.cardBg, borderColor: t.borderColor }, t.shadow]}>
                <Ionicons name="stats-chart-outline" size={14} color="#38bdf8" />
                <Text style={[styles.comparePillText, { color: t.text }]}>Compare ({savedCities.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Saved Cities Horizontal Quick Bar */}
        {savedCities.length > 0 && (
          <View style={styles.savedCitiesWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedCitiesScroll}>
              {savedCities.map(city => (
                <TouchableOpacity 
                  key={city.name} 
                  style={[styles.savedCityPill, { backgroundColor: t.pillBg }, t.shadow]} 
                  onPress={() => {
                    triggerSelection();
                    setPreviewHourIndex(null);
                    fetchWeatherBase(city.latitude, city.longitude, city.name);
                  }}
                >
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={[styles.savedCityPillText, { color: t.text }]}>{city.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.content}>
          {loading && !weather && searchResults.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#38bdf8" style={{ marginBottom: 16 }} />
              <Text style={[styles.subtitle, { color: t.text }]}>Fetching Weather Data...</Text>
              <Text style={[styles.subHint, { color: t.subtext }]}>Acquiring real-time atmospheric measurements</Text>
            </View>
          ) : errorMsg && !weather ? (
            <View style={styles.errorContainer}>
              <Ionicons name="location-outline" size={60} color="#f59e0b" style={{ marginBottom: 12 }} />
              <Text style={[styles.errorText, { color: t.text }]}>{errorMsg}</Text>
              <TouchableOpacity 
                style={[styles.retryBtn, { backgroundColor: t.cardBg, borderColor: t.borderColor }, t.shadow]}
                onPress={fetchCurrentLocation}
              >
                <Ionicons name="refresh" size={18} color={t.text} />
                <Text style={[styles.retryBtnText, { color: t.text }]}>Retry Location</Text>
              </TouchableOpacity>
            </View>
          ) : weather ? (
            <Animated.ScrollView 
              contentContainerStyle={styles.scrollContent} 
              style={{ opacity: fadeAnim, width: '100%' }} 
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.text} />}
            >
              {/* Main Weather Hero Container */}
              <View style={styles.currentWeatherContainer}>
                
                {/* Location & Save Bookmark */}
                <View style={styles.addressRow}>
                  <Text style={[styles.addressText, { color: t.text }]} numberOfLines={1}>{address}</Text>
                  {coordinates && (
                    <TouchableOpacity onPress={handleToggleSave} style={styles.saveButton}>
                      <Ionicons name={isSaved ? "heart" : "heart-outline"} size={26} color={isSaved ? "#ef4444" : t.text} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Cached Offline Banner */}
                {isCached && (
                  <View style={[styles.cacheBadge, { backgroundColor: t.pillBg }]}>
                    <Ionicons name="cloud-offline-outline" size={14} color="#f59e0b" />
                    <Text style={[styles.cacheBadgeText, { color: t.subtext }]}>Offline Cache • Live update syncing...</Text>
                  </View>
                )}

                {/* Time Travel Preview Notice */}
                {isPreviewing && (
                  <View style={[styles.previewNotice, { backgroundColor: '#38bdf820', borderColor: '#38bdf8' }]}>
                    <Ionicons name="time" size={14} color="#38bdf8" />
                    <Text style={styles.previewNoticeText}>
                      Previewing {new Date(weather.hourly.time[previewHourIndex!]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </View>
                )}

                <WeatherIcon 
                  code={currentCode} 
                  isDay={currentIsDay} 
                  size={135} 
                  style={styles.icon}
                />

                <Text style={[styles.tempText, { color: t.text }]}>{displayTemp(currentTemp)}°{isFahrenheit ? 'F' : 'C'}</Text>
                <Text style={[styles.feelsLikeText, { color: t.subtext }]}>Feels like {displayTemp(currentFeelsLike)}°</Text>

                {/* Primary Dual Spec Cards */}
                <View style={styles.detailsContainer}>
                  <View style={[styles.detailCard, { backgroundColor: t.cardBg, borderColor: t.borderColor }, t.shadow]}>
                    <Ionicons name="water" size={24} color="#38bdf8" />
                    <Text style={[styles.detailText, { color: t.text }]}>{currentHumidity}%</Text>
                    <Text style={[styles.detailLabel, { color: t.subtext }]}>Humidity</Text>
                  </View>
                  <View style={[styles.detailCard, { backgroundColor: t.cardBg, borderColor: t.borderColor }, t.shadow]}>
                    <MaterialCommunityIcons name="weather-windy" size={24} color="#94a3b8" />
                    <Text style={[styles.detailText, { color: t.text }]}>{displaySpeed(currentWind)} {isMph ? 'mph' : 'km/h'}</Text>
                    <Text style={[styles.detailLabel, { color: t.subtext }]}>Wind Speed</Text>
                  </View>
                </View>

                {/* Contextual Weather Insight Narrative */}
                <WeatherNarrative weather={weather} theme={t} />

              </View>

              {/* 1. Interactive 24-Hour Time-Travel Scrubber */}
              <TimeTravelSlider 
                weather={weather} 
                theme={t} 
                selectedIndex={previewHourIndex} 
                onSelectHour={setPreviewHourIndex}
                isFahrenheit={isFahrenheit}
                is24Hour={is24Hour}
              />

              {/* 2. 7-Day Forecast */}
              {weather.daily && (
                <View style={styles.forecastContainer}>
                  <Text style={[styles.forecastTitle, { color: t.text }]}>7-Day Outlook</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forecastScroll}>
                    {weather.daily.time.map((time, idx) => {
                      const date = new Date(time);
                      const isToday = new Date().toDateString() === date.toDateString();
                      return (
                        <View key={time} style={[styles.forecastCard, { backgroundColor: t.cardBg, borderColor: getForecastBorderColor(weather.daily.weatherCode[idx], 1), borderWidth: 1.5 }, t.shadow]}>
                          <Text style={[styles.forecastDay, { color: t.text }]}>{isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                          <WeatherIcon code={weather.daily.weatherCode[idx]} isDay={1} size={32} style={{ marginVertical: 8 }} />
                          <Text style={[styles.forecastTemp, { color: t.text }]}>{displayTemp(weather.daily.temperatureMax[idx])}°</Text>
                          <Text style={[styles.forecastTempMin, { color: t.subtext }]}>{displayTemp(weather.daily.temperatureMin[idx])}°</Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* 3. Smart Lifestyle & Activity Advisories */}
              <LifestyleAdvisories weather={weather} theme={t} isFahrenheit={isFahrenheit} />

              {/* 4. Dynamic Celestial Arc (Sun & Moon Tracker) */}
              <CelestialArc weather={weather} theme={t} is24Hour={is24Hour} />

              {/* 5. Health, Allergy & Pollen Hub */}
              <HealthMetrics weather={weather} theme={t} />

              {/* 6. Live Weather Radar Launcher */}
              {coordinates && (
                <View style={styles.radarContainer}>
                  <Text style={[styles.forecastTitle, { color: t.text, marginBottom: 12 }]}>Live Precipitation Radar</Text>
                  <TouchableOpacity 
                    onPress={() => { triggerImpactMedium(); setMapVisible(true); }} 
                    style={[styles.radarButton, { backgroundColor: t.cardBg, borderColor: t.borderColor }, t.shadow]}
                  >
                    <View style={styles.radarInfo}>
                      <View style={styles.radarIconContainer}>
                         <Ionicons name="map" size={24} color="#38bdf8" />
                      </View>
                      <View style={{ marginLeft: 14 }}>
                        <Text style={[styles.radarTitle, { color: t.text }]}>Interactive Weather Map</Text>
                        <Text style={[styles.radarSubtitle, { color: t.subtext }]}>Radar nowcasting & storm spotter</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={t.subtext} />
                  </TouchableOpacity>
                </View>
              )}

            </Animated.ScrollView>
          ) : null}
        </View>

        {/* Settings Modal */}
        <Modal visible={settingsVisible} animationType="fade" transparent={true} onRequestClose={() => setSettingsVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: t.modalBg }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: t.text }]}>Settings & Preferences</Text>
                <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                  <Ionicons name="close" size={26} color={t.text} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.settingRow, { borderBottomColor: t.modalBorder }]}>
                <View>
                  <Text style={[styles.settingText, { color: t.text }]}>App Theme</Text>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>{isDarkMode ? 'Dark Glass' : 'Light Sky'}</Text>
                </View>
                <Switch value={isDarkMode} onValueChange={(val) => { triggerSelection(); setIsDarkMode(val); }} trackColor={{ true: '#38bdf8', false: '#cbd5e1' }} />
              </View>

              <View style={[styles.settingRow, { borderBottomColor: t.modalBorder }]}>
                <View>
                  <Text style={[styles.settingText, { color: t.text }]}>Time Format</Text>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>{is24Hour ? '24-Hour (14:00)' : '12-Hour (2:00 PM)'}</Text>
                </View>
                <Switch value={is24Hour} onValueChange={(val) => { triggerSelection(); setIs24Hour(val); }} trackColor={{ true: '#38bdf8', false: '#cbd5e1' }} />
              </View>

              <View style={[styles.settingRow, { borderBottomColor: t.modalBorder }]}>
                <View>
                  <Text style={[styles.settingText, { color: t.text }]}>Temperature Unit</Text>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>{isFahrenheit ? 'Fahrenheit (°F)' : 'Celsius (°C)'}</Text>
                </View>
                <Switch value={isFahrenheit} onValueChange={(val) => { triggerSelection(); setIsFahrenheit(val); }} trackColor={{ true: '#38bdf8', false: '#cbd5e1' }} />
              </View>

              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View>
                  <Text style={[styles.settingText, { color: t.text }]}>Wind Speed Unit</Text>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>{isMph ? 'Miles / hr' : 'Kilometers / hr'}</Text>
                </View>
                <Switch value={isMph} onValueChange={(val) => { triggerSelection(); setIsMph(val); }} trackColor={{ true: '#38bdf8', false: '#cbd5e1' }} />
              </View>
            </View>
          </View>
        </Modal>

        {/* Multi-City Compare Modal */}
        <MultiCityDashboard 
          visible={dashboardVisible} 
          onClose={() => setDashboardVisible(false)} 
          fetchData={fetchSavedCitiesWeather}
          onSelectCity={(lat, lon, name) => {
            setPreviewHourIndex(null);
            fetchWeatherBase(lat, lon, name);
          }}
          theme={t}
        />

        {/* Live Weather Radar Modal */}
        {coordinates && (
          <WeatherMap
            visible={mapVisible}
            onClose={() => setMapVisible(false)}
            initialLocation={{
              lat: coordinates.lat,
              lon: coordinates.lon,
              name: address
            }}
            savedCities={savedCities}
            theme={t}
          />
        )}

        {/* Graphic Weather Share Card */}
        {weather && (
          <WeatherShareCard
            visible={shareCardVisible}
            onClose={() => setShareCardVisible(false)}
            address={address}
            weather={weather}
            cityImage={cityImage}
            theme={t}
            isFahrenheit={isFahrenheit}
          />
        )}

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 44 : 52,
    paddingBottom: 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  comparePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  comparePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  autocompleteContainer: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  autocompleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  autocompleteName: {
    fontSize: 15,
    fontWeight: '700',
  },
  autocompleteRegion: {
    fontSize: 12,
    marginTop: 2,
  },
  savedCitiesWrapper: {
    marginTop: 2,
    marginBottom: 6,
  },
  savedCitiesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  savedCityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  savedCityPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingBottom: 50,
    paddingHorizontal: 16,
    width: '100%',
  },
  currentWeatherContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
    maxWidth: '90%',
  },
  addressText: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveButton: {
    marginLeft: 12,
  },
  cacheBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginVertical: 4,
  },
  cacheBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  previewNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    marginTop: 6,
  },
  previewNoticeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  icon: {
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  tempText: {
    fontSize: 68,
    fontWeight: '900',
    marginBottom: 2,
  },
  feelsLikeText: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  subHint: {
    fontSize: 13,
    marginTop: 4,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 40,
    marginTop: 30,
  },
  errorText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    gap: 8,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    marginBottom: 6,
  },
  detailCard: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    flex: 1,
    borderWidth: 1,
  },
  detailText: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
  },
  forecastContainer: {
    width: '100%',
    marginTop: 15,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  forecastScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  forecastCard: {
    width: 80,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 18,
  },
  forecastDay: {
    fontSize: 13,
    fontWeight: '700',
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: '800',
  },
  forecastTempMin: {
    fontSize: 12,
    marginTop: 2,
  },
  radarContainer: {
    width: '100%',
    marginTop: 15,
  },
  radarButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  radarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radarIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  radarSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
});
