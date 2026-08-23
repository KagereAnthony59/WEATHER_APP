import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ImageBackground, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WeatherData } from '../hooks/useWeather';
import { triggerImpactMedium, triggerSuccess } from '../utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  address: string;
  weather: WeatherData;
  cityImage: string | null;
  theme: any;
  isFahrenheit: boolean;
}

export const WeatherShareCard: React.FC<Props> = ({
  visible,
  onClose,
  address,
  weather,
  cityImage,
  theme,
  isFahrenheit
}) => {
  const displayTemp = (c: number) => Math.round(isFahrenheit ? (c * 9/5) + 32 : c);

  const getConditionName = (code: number) => {
    if (code === 0) return 'Clear Sky ☀️';
    if (code <= 3) return 'Partly Cloudy ⛅';
    if (code <= 48) return 'Overcast & Foggy 🌫️';
    if (code <= 67 || (code >= 80 && code <= 82)) return 'Rain Showers 🌧️';
    if (code <= 77 || (code >= 85 && code <= 86)) return 'Snow Flurries ❄️';
    if (code >= 95) return 'Thunderstorm ⛈️';
    return 'Clear 🌤️';
  };

  const handleShare = async () => {
    triggerImpactMedium();
    const tempUnit = isFahrenheit ? '°F' : '°C';
    const condition = getConditionName(weather.weatherCode);
    const text = `🌤️ Weather Report for ${address}:\n` +
      `🌡️ Current: ${displayTemp(weather.temperature)}${tempUnit} (Feels like ${displayTemp(weather.feelsLike)}${tempUnit})\n` +
      `☁️ Condition: ${condition}\n` +
      `💧 Humidity: ${weather.humidity}% | 💨 Wind: ${weather.windSpeed} km/h\n` +
      `🍃 Air Quality: ${weather.aqi > -1 ? weather.aqi : 'Good'} AQI\n\n` +
      `Checked via K & A Weather ⚡`;

    try {
      await Share.share({
        message: text,
        title: `Weather in ${address}`,
      });
      triggerSuccess();
    } catch (e) {
      console.warn('Share error', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.modalBg, borderColor: theme.modalBorder }]}>
          
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Share Weather Card</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Graphic Preview Card */}
          <View style={styles.previewCard}>
            {cityImage && (
              <ImageBackground source={{ uri: cityImage }} style={StyleSheet.absoluteFill} />
            )}
            <LinearGradient
              colors={['rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.88)']}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardLocation} numberOfLines={1}>{address}</Text>
                <Text style={styles.cardDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
              </View>
              <View style={styles.appBadge}>
                <Ionicons name="cloud" size={14} color="#38bdf8" />
                <Text style={styles.appBadgeText}>K&A WEATHER</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardTemp}>{displayTemp(weather.temperature)}°{isFahrenheit ? 'F' : 'C'}</Text>
              <Text style={styles.cardCondition}>{getConditionName(weather.weatherCode)}</Text>
              <Text style={styles.cardFeels}>Feels like {displayTemp(weather.feelsLike)}° • High {displayTemp(weather.daily.temperatureMax[0])}° / Low {displayTemp(weather.daily.temperatureMin[0])}°</Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.cardStat}>
                <Ionicons name="water-outline" size={16} color="#38bdf8" />
                <Text style={styles.cardStatText}>{weather.humidity}%</Text>
              </View>
              <View style={styles.cardStat}>
                <Ionicons name="speedometer-outline" size={16} color="#94a3b8" />
                <Text style={styles.cardStatText}>{weather.windSpeed} km/h</Text>
              </View>
              <View style={styles.cardStat}>
                <Ionicons name="leaf-outline" size={16} color="#10b981" />
                <Text style={styles.cardStatText}>{weather.aqi > -1 ? weather.aqi : 35} AQI</Text>
              </View>
              <View style={styles.cardStat}>
                <Ionicons name="sunny-outline" size={16} color="#f59e0b" />
                <Text style={styles.cardStatText}>UV {weather.uvIndex}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color="#ffffff" />
            <Text style={styles.shareBtnText}>Share via Apps / Messages</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  previewCard: {
    width: '100%',
    height: 320,
    borderRadius: 22,
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLocation: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  appBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBody: {
    alignItems: 'center',
  },
  cardTemp: {
    fontSize: 64,
    fontWeight: '900',
    color: '#ffffff',
  },
  cardCondition: {
    fontSize: 18,
    fontWeight: '700',
    color: '#38bdf8',
    marginTop: 2,
  },
  cardFeels: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    textAlign: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 10,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardStatText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  shareBtn: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 18,
    gap: 8,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
