import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherData } from '../hooks/useWeather';

interface Props {
  weather: WeatherData;
  theme: any;
  isMph?: boolean;
}

export const DrivingCommuteSafety: React.FC<Props> = ({ weather, theme, isMph = false }) => {
  const { temperature, weatherCode, windSpeed, precipitation } = weather;

  // Compute road safety condition
  const getRoadCondition = () => {
    // Freezing / Snow conditions
    if (weatherCode >= 71 && weatherCode <= 77 || weatherCode >= 85 && weatherCode <= 86 || (temperature <= 0 && precipitation > 0)) {
      return {
        status: 'Hazardous / Icy',
        score: 'High Caution',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.12)',
        icon: 'snowflake-alert' as const,
        grip: 'Very Low (Ice & Snow)',
        visibility: 'Reduced (Snowfall)',
        windImpact: windSpeed > 35 ? 'Severe Crosswinds' : 'Moderate',
        advice: 'Braking distances increase up to 10x. Accelerate and steer gently with headlights on.'
      };
    }

    // Heavy rain or thunderstorms
    if (weatherCode >= 95 || weatherCode === 65 || weatherCode === 67 || weatherCode === 82 || precipitation > 5) {
      return {
        status: 'Heavy Rain / Hydroplaning',
        score: 'Caution Needed',
        color: '#f97316',
        bgColor: 'rgba(249, 115, 22, 0.12)',
        icon: 'weather-pouring' as const,
        grip: 'Low (Standing Water)',
        visibility: 'Poor (< 1 km)',
        windImpact: windSpeed > 40 ? 'Heavy Gusts' : 'Noticeable',
        advice: 'High hydroplaning risk. Avoid cruise control, slow down by 15-20%, and keep 4s following gap.'
      };
    }

    // Light rain or drizzle
    if ((weatherCode >= 51 && weatherCode <= 63) || (weatherCode >= 80 && weatherCode <= 81) || precipitation > 0.2) {
      return {
        status: 'Wet Surface / Reduced Grip',
        score: 'Moderate',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.12)',
        icon: 'weather-rainy' as const,
        grip: 'Moderate (Wet Asphalt)',
        visibility: 'Good (~5 km)',
        windImpact: windSpeed > 30 ? 'Moderate Gusts' : 'Minimal',
        advice: 'Roads are slickest during the first 15 minutes of rainfall as oil residue mixes with water.'
      };
    }

    // Fog / Mist
    if (weatherCode >= 45 && weatherCode <= 48) {
      return {
        status: 'Foggy / Reduced Sight',
        score: 'Use Low Beams',
        color: '#a855f7',
        bgColor: 'rgba(168, 85, 247, 0.12)',
        icon: 'weather-fog' as const,
        grip: 'Normal (Damp)',
        visibility: 'Very Low (< 500 m)',
        windImpact: 'Calm',
        advice: 'Use low-beam headlights or dedicated fog lights. Never use high beams in heavy fog.'
      };
    }

    // High winds on dry roads
    if (windSpeed >= 40) {
      return {
        status: 'Strong Crosswinds Alert',
        score: 'Wind Warning',
        color: '#f97316',
        bgColor: 'rgba(249, 115, 22, 0.12)',
        icon: 'weather-windy-variant' as const,
        grip: 'Good (Dry)',
        visibility: 'Clear (> 10 km)',
        windImpact: `High (${Math.round(isMph ? windSpeed * 0.621371 : windSpeed)} ${isMph ? 'mph' : 'km/h'})`,
        advice: 'Keep a firm two-handed grip on the steering wheel, especially on bridges and open highways.'
      };
    }

    // Clear / Optimal
    return {
      status: 'Optimal Driving Conditions',
      score: 'Safe & Clear',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      icon: 'shield-check-outline' as const,
      grip: 'Optimal (Dry Asphalt)',
      visibility: 'Excellent (> 10 km)',
      windImpact: `Light (${Math.round(isMph ? windSpeed * 0.621371 : windSpeed)} ${isMph ? 'mph' : 'km/h'})`,
      advice: 'Road surfaces are dry with unobstructed sightlines. Standard following distance applies.'
    };
  };

  const road = getRoadCondition();

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }, theme.shadow]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: road.bgColor }]}>
            <Ionicons name="car-sport" size={18} color={road.color} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Commute & Driving Safety</Text>
            <Text style={[styles.statusSubtitle, { color: road.color }]}>{road.status}</Text>
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: road.bgColor, borderColor: road.color }]}>
          <Text style={[styles.badgeText, { color: road.color }]}>{road.score}</Text>
        </View>
      </View>

      {/* 3 Metric Mini-Pills */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricPill, { backgroundColor: theme.pillBg, borderColor: theme.borderColor }]}>
          <MaterialCommunityIcons name="tire" size={16} color={road.color} />
          <Text style={[styles.metricLabel, { color: theme.subtext }]}>Road Grip</Text>
          <Text style={[styles.metricVal, { color: theme.text }]} numberOfLines={1}>{road.grip.split(' ')[0]}</Text>
        </View>

        <View style={[styles.metricPill, { backgroundColor: theme.pillBg, borderColor: theme.borderColor }]}>
          <Ionicons name="eye-outline" size={16} color="#38bdf8" />
          <Text style={[styles.metricLabel, { color: theme.subtext }]}>Visibility</Text>
          <Text style={[styles.metricVal, { color: theme.text }]} numberOfLines={1}>{road.visibility.split(' ')[0]}</Text>
        </View>

        <View style={[styles.metricPill, { backgroundColor: theme.pillBg, borderColor: theme.borderColor }]}>
          <MaterialCommunityIcons name="weather-windy" size={16} color="#94a3b8" />
          <Text style={[styles.metricLabel, { color: theme.subtext }]}>Crosswinds</Text>
          <Text style={[styles.metricVal, { color: theme.text }]} numberOfLines={1}>{road.windImpact.split(' ')[0]}</Text>
        </View>
      </View>

      {/* Driving Guidance Text */}
      <View style={[styles.adviceBox, { backgroundColor: theme.pillBg }]}>
        <Ionicons name="information-circle-outline" size={16} color={road.color} style={{ marginRight: 8, marginTop: 1 }} />
        <Text style={[styles.adviceText, { color: theme.subtext }]}>{road.advice}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 18,
    borderRadius: 22,
    marginTop: 15,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
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
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  metricPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 14,
  },
  adviceText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    fontWeight: '400',
  },
});
