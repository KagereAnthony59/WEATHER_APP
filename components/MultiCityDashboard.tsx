import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CityWeather {
  name: string;
  latitude: number;
  longitude: number;
  temp: number;
  weatherCode: number;
  isDay: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  fetchData: () => Promise<CityWeather[]>;
  onSelectCity: (latitude: number, longitude: number, name: string) => void;
  theme: any;
}

const WeatherIconSmall = ({ code, isDay }: { code: number, isDay: number }) => {
  if (code === 0) return <Ionicons name={isDay ? 'sunny' : 'moon'} size={24} color={isDay ? '#f59e0b' : '#fef08a'} />;
  if (code <= 3) return <Ionicons name="cloud-outline" size={24} color="#cbd5e1" />;
  if (code <= 67 || (code >= 80 && code <= 82)) return <Ionicons name="rainy-outline" size={24} color="#38bdf8" />;
  if (code <= 77 || (code >= 85 && code <= 86)) return <Ionicons name="snow-outline" size={24} color="#e0f2fe" />;
  return <Ionicons name="cloud-outline" size={24} color="#cbd5e1" />;
};

export const MultiCityDashboard: React.FC<Props> = ({ visible, onClose, fetchData, onSelectCity, theme }) => {
  const [cities, setCities] = useState<CityWeather[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchData().then(data => {
        setCities(data);
        setLoading(false);
      });
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.modalBg }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>City Comparison</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.text} style={{ flex: 1 }} />
          ) : cities.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Ionicons name="heart-dislike-outline" size={64} color={theme.subtext} />
                <Text style={[styles.emptyText, { color: theme.subtext }]}>No saved cities yet.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.grid}>
                {cities.map((city, idx) => (
                  <TouchableOpacity 
                    key={city.name} 
                    style={[styles.cityCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
                    onPress={() => {
                        onSelectCity(city.latitude, city.longitude, city.name);
                        onClose();
                    }}
                  >
                    <Text style={[styles.cityName, { color: theme.text }]} numberOfLines={1}>{city.name}</Text>
                    <View style={styles.weatherRow}>
                        <WeatherIconSmall code={city.weatherCode} isDay={city.isDay} />
                        <Text style={[styles.cityTemp, { color: theme.text }]}>{Math.round(city.temp)}°</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  content: {
    height: '80%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cityCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cityTemp: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0.6,
  },
  emptyText: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: '500',
  }
});
