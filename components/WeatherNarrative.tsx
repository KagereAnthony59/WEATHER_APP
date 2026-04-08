import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeatherData } from '../hooks/useWeather';

interface Props {
  weather: WeatherData;
  theme: any;
}

export const WeatherNarrative: React.FC<Props> = ({ weather, theme }) => {
  const getNarrative = () => {
    let narrative = "";
    const { temperature, yesterdayMaxTemp, daily, hourly, weatherCode, isDay, aqi } = weather;
    
    // 1. Temperature Analysis
    const tempDiff = temperature - yesterdayMaxTemp;
    if (Math.abs(tempDiff) > 2) {
      narrative += `It's about ${Math.round(Math.abs(tempDiff))}° ${tempDiff > 0 ? 'warmer' : 'cooler'} than this time yesterday. `;
    } else {
      narrative += "Temperatures are holding steady compared to yesterday. ";
    }

    // 2. Condition Specifics
    if (weatherCode >= 51 && weatherCode <= 67) narrative += "Expect drizzle and rain to persist. ";
    else if (weatherCode >= 80 && weatherCode <= 82) narrative += "Showers are likely throughout the day. ";
    else if (weatherCode === 0) narrative += "You'll enjoy clear, beautiful skies. ";
    else if (weatherCode <= 3) narrative += "Mostly clear with some passing clouds. ";

    // 3. Precipitation Probability
    const maxRainProb = Math.max(...hourly.precipitationProbability.slice(0, 12));
    if (maxRainProb > 50 && !narrative.includes("rain") && !narrative.includes("Showers")) {
      narrative += `There's a high chance (${maxRainProb}%) of rain in the next few hours. `;
    }

    // 4. Extras (UV/AQI)
    if (daily.uvIndexMax[0] > 7 && isDay) narrative += "UV levels are very high—don't forget your sunscreen! ";
    if (aqi > 100) narrative += "Air quality is a bit poor today, so take care if you have allergies. ";

    // 5. Sunset/Sunrise context
    const now = new Date();
    const sunset = new Date(daily.sunset[0]);
    if (now < sunset && isDay) {
        const hoursToSunset = Math.round((sunset.getTime() - now.getTime()) / (1000 * 60 * 60));
        if (hoursToSunset <= 2) {
            narrative += `Sunset is just ${hoursToSunset} ${hoursToSunset === 1 ? 'hour' : 'hours'} away. `;
        }
    }

    return narrative.trim();
  };

  const narrative = getNarrative();

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }, theme.shadow]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="sparkles" size={20} color="#f59e0b" />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Today's Insight</Text>
      </View>
      <Text style={[styles.text, { color: theme.text }]}>{narrative}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.9,
  },
});
