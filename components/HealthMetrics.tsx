import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherData } from '../hooks/useWeather';

interface Props {
  weather: WeatherData;
  theme: any;
}

export const HealthMetrics: React.FC<Props> = ({ weather, theme }) => {
  const { aqi, pm2_5, pm10, ozone, nitrogenDioxide, pollen } = weather;

  // AQI categorization
  const getAqiDetails = (val: number) => {
    if (val < 0) return { category: 'Unavailable', color: '#94a3b8', desc: 'No sensor station data nearby.' };
    if (val <= 50) return { category: 'Good', color: '#10b981', desc: 'Air quality is ideal for outdoor activities.' };
    if (val <= 100) return { category: 'Moderate', color: '#f59e0b', desc: 'Acceptable quality; sensitive individuals should take note.' };
    if (val <= 150) return { category: 'Unhealthy for Sensitive', color: '#f97316', desc: 'Sensitive groups should reduce heavy outdoor exertion.' };
    if (val <= 200) return { category: 'Unhealthy', color: '#ef4444', desc: 'Everyone may begin to experience health effects.' };
    return { category: 'Hazardous', color: '#a855f7', desc: 'Serious health risk. Avoid outdoor activity.' };
  };

  const aqiInfo = getAqiDetails(aqi);

  // Pollen severity
  const getPollenSeverity = (val: number) => {
    if (val <= 10) return { label: 'Low', color: '#10b981' };
    if (val <= 40) return { label: 'Moderate', color: '#f59e0b' };
    return { label: 'High', color: '#ef4444' };
  };

  const grassSev = getPollenSeverity(pollen?.grass ?? 0);
  const birchSev = getPollenSeverity(pollen?.birch ?? 0);
  const ragweedSev = getPollenSeverity(pollen?.ragweed ?? 0);

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }, theme.shadow]}>
      {/* Title */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="lungs" size={20} color="#10b981" />
          <Text style={[styles.title, { color: theme.text }]}>Air Quality & Allergens</Text>
        </View>
      </View>

      {/* Main AQI Gauge Summary Card */}
      <View style={[styles.aqiSummary, { backgroundColor: theme.pillBg }]}>
        <View style={styles.aqiTopRow}>
          <View>
            <Text style={[styles.aqiNumber, { color: aqiInfo.color }]}>
              {aqi > -1 ? aqi : '--'}
              <Text style={{ fontSize: 13, color: theme.subtext, fontWeight: '500' }}> US AQI</Text>
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: aqiInfo.color + '22', borderColor: aqiInfo.color }]}>
            <Text style={[styles.badgeText, { color: aqiInfo.color }]}>{aqiInfo.category}</Text>
          </View>
        </View>
        <Text style={[styles.aqiDesc, { color: theme.text }]}>{aqiInfo.desc}</Text>
      </View>

      {/* Pollutant Grid */}
      <View style={styles.pollutantGrid}>
        <View style={[styles.pollutantCard, { backgroundColor: theme.pillBg }]}>
          <Text style={[styles.pollutantLabel, { color: theme.subtext }]}>PM2.5</Text>
          <Text style={[styles.pollutantVal, { color: theme.text }]}>{pm2_5} <Text style={styles.unit}>µg/m³</Text></Text>
        </View>

        <View style={[styles.pollutantCard, { backgroundColor: theme.pillBg }]}>
          <Text style={[styles.pollutantLabel, { color: theme.subtext }]}>PM10</Text>
          <Text style={[styles.pollutantVal, { color: theme.text }]}>{pm10} <Text style={styles.unit}>µg/m³</Text></Text>
        </View>

        <View style={[styles.pollutantCard, { backgroundColor: theme.pillBg }]}>
          <Text style={[styles.pollutantLabel, { color: theme.subtext }]}>OZONE (O₃)</Text>
          <Text style={[styles.pollutantVal, { color: theme.text }]}>{ozone} <Text style={styles.unit}>µg/m³</Text></Text>
        </View>

        <View style={[styles.pollutantCard, { backgroundColor: theme.pillBg }]}>
          <Text style={[styles.pollutantLabel, { color: theme.subtext }]}>NO₂</Text>
          <Text style={[styles.pollutantVal, { color: theme.text }]}>{nitrogenDioxide} <Text style={styles.unit}>µg/m³</Text></Text>
        </View>
      </View>

      {/* Pollen Radar */}
      <View style={styles.pollenSection}>
        <Text style={[styles.pollenSectionTitle, { color: theme.subtext }]}>POLLEN & ALLERGEN RADAR</Text>
        
        <View style={styles.pollenRows}>
          <View style={[styles.pollenItem, { backgroundColor: theme.pillBg }]}>
            <Ionicons name="leaf-outline" size={18} color="#10b981" />
            <Text style={[styles.pollenName, { color: theme.text }]}>Grass</Text>
            <Text style={[styles.pollenStatus, { color: grassSev.color }]}>{grassSev.label}</Text>
          </View>

          <View style={[styles.pollenItem, { backgroundColor: theme.pillBg }]}>
            <MaterialCommunityIcons name="tree-outline" size={18} color="#f59e0b" />
            <Text style={[styles.pollenName, { color: theme.text }]}>Tree (Birch)</Text>
            <Text style={[styles.pollenStatus, { color: birchSev.color }]}>{birchSev.label}</Text>
          </View>

          <View style={[styles.pollenItem, { backgroundColor: theme.pillBg }]}>
            <Ionicons name="flower-outline" size={18} color="#ef4444" />
            <Text style={[styles.pollenName, { color: theme.text }]}>Ragweed</Text>
            <Text style={[styles.pollenStatus, { color: ragweedSev.color }]}>{ragweedSev.label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  aqiSummary: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  aqiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  aqiNumber: {
    fontSize: 26,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  aqiDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  pollutantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pollutantCard: {
    flex: 1,
    minWidth: '47%',
    padding: 12,
    borderRadius: 14,
  },
  pollutantLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  pollutantVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  unit: {
    fontSize: 11,
    fontWeight: '400',
    opacity: 0.7,
  },
  pollenSection: {
    gap: 8,
  },
  pollenSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pollenRows: {
    flexDirection: 'row',
    gap: 8,
  },
  pollenItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 13,
    gap: 3,
  },
  pollenName: {
    fontSize: 12,
    fontWeight: '600',
  },
  pollenStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
});
