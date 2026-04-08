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

export default function WeatherScreen() {
  const { address, coordinates, weather, errorMsg, loading, searchResults, cityImage, autocompleteSearch, fetchCurrentLocation, refreshWeather, savedCities, toggleSavedCity, fetchWeatherBase, fetchSavedCitiesWeather } = useWeather();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Premium Settings State
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [isFahrenheit, setIsFahrenheit] = useState(false);
  const [isMph, setIsMph] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [is24Hour, setIs24Hour] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshWeather();
    setRefreshing(false);
  }, [refreshWeather]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
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

  const currentColors = weather 
    ? getGradientColors(weather.weatherCode, weather.isDay)
    : (isDarkMode ? ['#0f172a', '#020617'] as const : ['#7dd3fc', '#e0f2fe'] as const);

  const isSaved = savedCities.some(c => c.name === address);
  const handleToggleSave = () => {
    if (coordinates) {
      toggleSavedCity(address, coordinates.lat, coordinates.lon);
    }
  };

  const handleSelectCity = (city: CitySearchResult) => {
    setSearchQuery('');
    autocompleteSearch('');
    fetchWeatherBase(city.latitude, city.longitude, city.name);
  };

  const currentHourISO = weather?.hourly?.time?.find((t) => new Date(t).getHours() === new Date().getHours() && new Date(t).getDate() === new Date().getDate());
  const hourlyStartIndex = currentHourISO && weather ? weather.hourly.time.indexOf(currentHourISO) : 0;
  const next24Hours = weather?.hourly ? weather.hourly.time.slice(hourlyStartIndex, hourlyStartIndex + 24) : [];

  // Formatters
  const displayTemp = (c: number) => Math.round(isFahrenheit ? (c * 9/5) + 32 : c);
  const displaySpeed = (kmh: number) => Math.round(isMph ? kmh * 0.621371 : kmh);
  const displayTime = (isoString: string) => {
    const d = new Date(isoString);
    return is24Hour ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) 
                    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  const getHourFormat = (isoString: string) => {
    const d = new Date(isoString);
    if (is24Hour) return d.getHours() + ':00';
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h} ${ampm}`;
  };


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
        <ImageBackground source={{ uri: cityImage ?? undefined }} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient colors={currentColors} style={[StyleSheet.absoluteFill, { opacity: cityImage ? (isDarkMode ? 0.75 : 0.6) : 1 }]} />
      
      {weather && <WeatherOverlay weatherCode={weather.weatherCode} isDay={weather.isDay} />}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        <View style={{ zIndex: 20 }}>
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: t.searchBg, color: t.text }, t.shadow]}
              placeholder="Search for a city..."
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
              <Ionicons name="location-outline" size={24} color={t.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSettingsVisible(true)} style={[styles.iconButton, { marginLeft: 10, backgroundColor: t.searchBg }, t.shadow]}>
              <Ionicons name="settings-outline" size={24} color={t.text} />
            </TouchableOpacity>
          </View>

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
        </View>

        {savedCities.length > 0 && (
          <View style={styles.savedCitiesWrapper}>
            <View style={styles.savedCitiesHeader}>
                <Text style={[styles.savedCitiesTitle, { color: t.text }]}>Saved Cities</Text>
                <TouchableOpacity onPress={() => setDashboardVisible(true)} style={[styles.dashboardBtn, { backgroundColor: t.searchBg }, t.shadow]}>
                    <Ionicons name="stats-chart-outline" size={16} color={t.text} />
                    <Text style={[styles.dashboardBtnText, { color: t.text }]}>Compare</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedCitiesScroll}>
              {savedCities.map(city => (
                <TouchableOpacity key={city.name} style={[styles.savedCityPill, { backgroundColor: t.pillBg }, t.shadow]} onPress={() => fetchWeatherBase(city.latitude, city.longitude, city.name)}>
                  <Ionicons name="star" size={14} color="#f59e0b" />
                  <Text style={[styles.savedCityPillText, { color: t.text }]}>{city.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.content}>
          {loading && !refreshing && searchResults.length === 0 ? (
            <>
              <ActivityIndicator size="large" color={t.text} style={{ marginBottom: 20 }} />
              <Text style={[styles.subtitle, { color: t.subtext }]}>Fetching Weather...</Text>
            </>
          ) : errorMsg ? (
            <>
              <Ionicons name="warning-outline" size={64} color={t.text} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </>
          ) : weather ? (
            <Animated.ScrollView 
              contentContainerStyle={styles.scrollContent} 
              style={{ opacity: fadeAnim, width: '100%' }} 
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.text} />}
            >
              <View style={styles.currentWeatherContainer}>
                <View style={styles.addressRow}>
                  <Text style={[styles.addressText, { color: t.text }]}>{address}</Text>
                  {coordinates && (
                    <TouchableOpacity onPress={handleToggleSave} style={styles.saveButton}>
                      <Ionicons name={isSaved ? "heart" : "heart-outline"} size={28} color={isSaved ? "#ef4444" : t.text} />
                    </TouchableOpacity>
                  )}
                </View>
                <WeatherIcon 
                  code={weather.weatherCode} 
                  isDay={weather.isDay} 
                  size={140} 
                  style={styles.icon}
                />
                <Text style={[styles.tempText, { color: t.text }]}>{displayTemp(weather.temperature)}°{isFahrenheit ? 'F' : 'C'}</Text>
                <Text style={[styles.feelsLikeText, { color: t.subtext }]}>Feels like {displayTemp(weather.feelsLike)}°</Text>

                <View style={styles.detailsContainer}>
                  <View style={[styles.detailCard, { backgroundColor: t.cardBg, borderColor: t.borderColor }, t.shadow]}>
                    <Ionicons name="water" size={28} color="#38bdf8" />
                    <Text style={[styles.detailText, { color: t.text }]}>{weather.humidity}%</Text>
                    <Text style={[styles.detailLabel, { color: t.subtext }]}>Humidity</Text>
                  </View>
                  <View style={[styles.detailCard, { backgroundColor: t.cardBg, borderColor: t.borderColor }, t.shadow]}>
                    <MaterialCommunityIcons name="weather-windy" size={28} color="#94a3b8" />
                    <Text style={[styles.detailText, { color: t.text }]}>{displaySpeed(weather.windSpeed)} {isMph ? 'mph' : 'km/h'}</Text>
                    <Text style={[styles.detailLabel, { color: t.subtext }]}>Wind</Text>
                  </View>
                </View>

                <WeatherNarrative weather={weather} theme={t} />

              </View>

              {coordinates && (
                <View style={styles.radarContainer}>
                  <Text style={[styles.forecastTitle, { color: t.text, marginLeft: 15, marginBottom: 15 }]}>Weather Radar</Text>
                  <TouchableOpacity 
                    onPress={() => setMapVisible(true)} 
                    style={[styles.radarButton, { backgroundColor: t.cardBg, borderColor: t.borderColor }, t.shadow]}
                  >
                    <View style={styles.radarInfo}>
                      <View style={styles.radarIconContainer}>
                         <Ionicons name="map-outline" size={24} color="#4A90E2" />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={[styles.radarTitle, { color: t.text }]}>Precipitation Radar</Text>
                        <Text style={[styles.radarSubtitle, { color: t.subtext }]}>View live weather map</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={t.subtext} />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.extendedDetailsContainer}>
                 <View style={[styles.miniCard, { backgroundColor: t.cardBg }, t.shadow]}>
                   <Text style={[styles.miniTitle, { color: t.subtext }]}>AQI (US)</Text>
                   <Text style={[styles.miniValue, { color: t.text }, weather.aqi > 100 && { color: '#ef4444' }]}>
                     {weather.aqi > -1 ? weather.aqi : '--'}
                   </Text>
                 </View>
                 <View style={[styles.miniCard, { backgroundColor: t.cardBg }, t.shadow]}>
                   <Text style={[styles.miniTitle, { color: t.subtext }]}>UV Index</Text>
                   <Text style={[styles.miniValue, { color: t.text }, weather.daily.uvIndexMax[0] > 7 && { color: '#f59e0b' }]}>
                     {weather.daily.uvIndexMax[0]}
                   </Text>
                 </View>
                 <View style={[styles.miniCard, { backgroundColor: t.cardBg }, t.shadow]}>
                   <Text style={[styles.miniTitle, { color: t.subtext }]}>Sunrise</Text>
                   <Text style={[styles.miniValue, { color: t.text, fontSize: 16 }]}>{displayTime(weather.daily.sunrise[0])}</Text>
                 </View>
                 <View style={[styles.miniCard, { backgroundColor: t.cardBg }, t.shadow]}>
                   <Text style={[styles.miniTitle, { color: t.subtext }]}>Sunset</Text>
                   <Text style={[styles.miniValue, { color: t.text, fontSize: 16 }]}>{displayTime(weather.daily.sunset[0])}</Text>
                 </View>
              </View>

              {next24Hours.length > 0 && (
                <View style={styles.forecastContainer}>
                  <Text style={[styles.forecastTitle, { color: t.text }]}>Hourly Forecast</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forecastScroll}>
                    {next24Hours.map((time, idx) => {
                      const absoluteIdx = hourlyStartIndex + idx;
                      const isNow = idx === 0;
                      return (
                        <View key={time} style={[styles.forecastCard, { backgroundColor: t.cardBg, borderColor: getForecastBorderColor(weather.hourly.weatherCode[absoluteIdx], new Date(time).getHours() >= 6 && new Date(time).getHours() < 19 ? 1 : 0), borderWidth: 1.5 }, isNow && { borderColor: t.text, borderWidth: 2.5 }, t.shadow]}>
                          <Text style={[styles.forecastDay, { color: t.text }]}>{isNow ? 'Now' : getHourFormat(time)}</Text>
                          <WeatherIcon code={weather.hourly.weatherCode[absoluteIdx]} isDay={new Date(time).getHours() >= 6 && new Date(time).getHours() < 19 ? 1 : 0} size={32} style={{ marginVertical: 8 }} />
                          <Text style={[styles.forecastTemp, { color: t.text }]}>{displayTemp(weather.hourly.temperature[absoluteIdx])}°</Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {weather.daily && (
                <View style={styles.forecastContainer}>
                  <Text style={[styles.forecastTitle, { color: t.text }]}>7-Day Forecast</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forecastScroll}>
                    {weather.daily.time.map((time, idx) => {
                      const date = new Date(time);
                      const isToday = new Date().toDateString() === date.toDateString();
                      return (
                        <View key={time} style={[styles.forecastCard, { backgroundColor: t.cardBg, borderColor: getForecastBorderColor(weather.daily.weatherCode[idx], 1), borderWidth: 1.5 }, t.shadow]}>
                          <Text style={[styles.forecastDay, { color: t.text }]}>{isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                          <WeatherIcon code={weather.daily.weatherCode[idx]} isDay={1} size={36} style={{ marginVertical: 8 }} />
                          <Text style={[styles.forecastTemp, { color: t.text }]}>{displayTemp(weather.daily.temperatureMax[idx])}°</Text>
                          <Text style={[styles.forecastTempMin, { color: t.subtext }]}>{displayTemp(weather.daily.temperatureMin[idx])}°</Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </Animated.ScrollView>
          ) : null}
        </View>

        <Modal visible={settingsVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: t.modalBg }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: t.text }]}>Settings & Preferences</Text>
                <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                  <Ionicons name="close" size={28} color={t.text} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.settingRow, { borderBottomColor: t.modalBorder }]}>
                <View>
                  <Text style={[styles.settingText, { color: t.text }]}>App Theme</Text>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</Text>
                </View>
                <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ true: '#4A90E2', false: '#cbd5e1' }} />
              </View>

              <View style={[styles.settingRow, { borderBottomColor: t.modalBorder }]}>
                <View>
                  <Text style={[styles.settingText, { color: t.text }]}>Time Format</Text>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>{is24Hour ? '24-Hour (14:00)' : '12-Hour (2:00 PM)'}</Text>
                </View>
                <Switch value={is24Hour} onValueChange={setIs24Hour} trackColor={{ true: '#4A90E2', false: '#cbd5e1' }} />
              </View>

              <View style={[styles.settingRow, { borderBottomColor: t.modalBorder }]}>
                <View>
                  <Text style={[styles.settingText, { color: t.text }]}>Temperature Unit</Text>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>{isFahrenheit ? 'Fahrenheit (°F)' : 'Celsius (°C)'}</Text>
                </View>
                <Switch value={isFahrenheit} onValueChange={setIsFahrenheit} trackColor={{ true: '#4A90E2', false: '#cbd5e1' }} />
              </View>

              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View>
                  <Text style={[styles.settingText, { color: t.text }]}>Wind Speed Unit</Text>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>{isMph ? 'Miles / hr' : 'Kilometers / hr'}</Text>
                </View>
                <Switch value={isMph} onValueChange={setIsMph} trackColor={{ true: '#4A90E2', false: '#cbd5e1' }} />
              </View>
            </View>
          </View>
        </Modal>

      <MultiCityDashboard 
          visible={dashboardVisible} 
          onClose={() => setDashboardVisible(false)} 
          fetchData={fetchSavedCitiesWeather}
          onSelectCity={fetchWeatherBase}
          theme={t}
      />

      {coordinates && (
        <WeatherMap 
          visible={mapVisible} 
          onClose={() => setMapVisible(false)} 
          initialLocation={{ lat: coordinates.lat, lon: coordinates.lon, name: address }}
          savedCities={savedCities}
          theme={t}
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
    paddingTop: 60,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 15,
  },
  iconButton: {
    borderRadius: 15,
    padding: 12,
  },
  autocompleteContainer: {
    marginHorizontal: 5,
    marginTop: 0,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  autocompleteItem: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  autocompleteName: {
    fontSize: 16,
    fontWeight: '600',
  },
  autocompleteRegion: {
    fontSize: 12,
    marginTop: 2,
  },
  savedCitiesWrapper: {
    marginTop: 10,
  },
  savedCitiesScroll: {
    paddingHorizontal: 5,
    gap: 10,
  },
  savedCityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  savedCityPillText: {
    marginLeft: 5,
    fontWeight: '500',
  },
  savedCitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  savedCitiesTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  dashboardBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
    paddingHorizontal: 5,
    width: '100%',
  },
  currentWeatherContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  addressText: {
    fontSize: 36,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    marginLeft: 15,
  },
  icon: {
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  tempText: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  feelsLikeText: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 18,
    marginTop: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  detailCard: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    flex: 1,
    borderWidth: 1,
  },
  detailText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  detailLabel: {
    fontSize: 14,
  },
  adviceCard: {
    width: '100%',
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  adviceText: {
    fontSize: 15,
    lineHeight: 22,
  },
  extendedDetailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    gap: 10,
  },
  miniCard: {
    width: '47.5%',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 0,
  },
  miniTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  miniValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  forecastContainer: {
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  forecastTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    marginLeft: 15,
  },
  forecastScroll: {
    paddingRight: 0,
  },
  forecastCard: {
    alignItems: 'center',
    borderRadius: 15,
    padding: 15,
    marginRight: 10,
    minWidth: 80,
    borderWidth: 1,
  },
  forecastDay: {
    fontSize: 16,
    fontWeight: '500',
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  forecastTempMin: {
    fontSize: 14,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  settingText: {
    fontSize: 18,
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  radarContainer: {
    width: '100%',
    paddingVertical: 10,
    marginBottom: 20,
  },
  radarButton: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 0,
  },
  radarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radarIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  radarSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
});
