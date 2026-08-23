import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherData } from '../hooks/useWeather';
import { triggerImpactLight } from '../utils/haptics';

interface Props {
  weather: WeatherData;
  theme: any;
  isFahrenheit: boolean;
}

export const LifestyleAdvisories: React.FC<Props> = ({ weather, theme, isFahrenheit }) => {
  const [selectedCategory, setSelectedCategory] = useState<'outfit' | 'fitness' | 'lifestyle'>('outfit');

  const { temperature, feelsLike, windSpeed, humidity, weatherCode, isDay, uvIndex, daily } = weather;

  // 1. Outfit Calculation
  const getOutfitAdvice = () => {
    const isRaining = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82) || weatherCode >= 95;
    const isSnowing = (weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86);
    
    let tops = "Breathable T-shirt / Polo";
    let outer = "No jacket required";
    let accessories = isDay && uvIndex > 3 ? "Sunglasses recommended" : "No special gear";
    let icon = "shirt-outline";

    if (feelsLike < 5) {
      tops = "Thermal base & thick sweater";
      outer = "Heavy winter coat / Windbreaker";
      accessories = "Beanie, warm scarf & gloves";
      icon = "snowflake";
    } else if (feelsLike < 14) {
      tops = "Long-sleeve shirt or knitwear";
      outer = "Fleece jacket or trench coat";
      accessories = isDay ? "Light scarf / sunglasses" : "Light scarf";
      icon = "weather-windy";
    } else if (feelsLike < 22) {
      tops = "Comfortable tee or casual shirt";
      outer = "Light denim jacket for evening";
      accessories = isDay ? "Sunglasses" : "None";
      icon = "weather-partly-cloudy";
    } else {
      tops = "Lightweight cotton or linen";
      outer = "None (Stay hydrated & cool)";
      accessories = isDay ? "Sunglasses & sun hat" : "None";
      icon = "white-balance-sunny";
    }

    if (isRaining) {
      outer = "Waterproof raincoat / hooded shell";
      accessories += " + Umbrella ☔";
    } else if (isSnowing) {
      outer = "Waterproof insulated winter parka";
      accessories += " + Snow boots ❄️";
    }

    return { tops, outer, accessories, icon };
  };

  // 2. Outdoor Fitness Score (0-100)
  const getFitnessScore = () => {
    let score = 100;
    
    // Temperature penalties
    if (temperature < 0 || temperature > 35) score -= 40;
    else if (temperature < 8 || temperature > 28) score -= 20;
    else if (temperature < 12 || temperature > 24) score -= 8;

    // Wind penalty
    if (windSpeed > 35) score -= 30;
    else if (windSpeed > 20) score -= 15;

    // Rain penalty
    if (weatherCode >= 51) score -= 35;

    // Humidity penalty
    if (humidity > 85 && temperature > 22) score -= 20;

    score = Math.max(10, Math.min(100, score));

    let label = "Ideal Workout Conditions";
    let color = "#10b981";
    if (score < 40) { label = "Poor for Outdoors"; color = "#ef4444"; }
    else if (score < 70) { label = "Moderate Conditions"; color = "#f59e0b"; }
    else if (score < 85) { label = "Good Conditions"; color = "#3b82f6"; }

    return { score, label, color };
  };

  // 3. Practical Lifestyle Indexes
  const getCarWashScore = () => {
    const rainNext3Days = daily.precipitationSum.slice(0, 3).reduce((acc, curr) => acc + curr, 0);
    const maxRainProb = Math.max(...daily.precipitationProbabilityMax.slice(0, 3));

    if (rainNext3Days > 3 || maxRainProb > 45) {
      return { status: 'Poor Time', desc: 'Rain expected within 48h. Postpone wash.', icon: 'car-wash', color: '#ef4444' };
    } else if (rainNext3Days > 0.5 || maxRainProb > 25) {
      return { status: 'Fair', desc: 'Slight rain risk. Safe for quick rinse.', icon: 'car-wash', color: '#f59e0b' };
    }
    return { status: 'Great Time!', desc: 'Clear skies ahead. Perfect day to wash!', icon: 'car-wash', color: '#10b981' };
  };

  const getLaundryScore = () => {
    if (weatherCode >= 51) {
      return { status: 'Indoor Only', desc: 'Precipitation expected. Dry indoors.', icon: 'tumble-dryer', color: '#ef4444' };
    }
    if (humidity < 60 && isDay && windSpeed > 10) {
      return { status: 'Super Fast', desc: 'Low humidity & breeze. Rapid dry!', icon: 'weather-sunny', color: '#10b981' };
    }
    if (humidity > 80) {
      return { status: 'Slow Drying', desc: 'High humidity will delay drying.', icon: 'water-percent', color: '#f59e0b' };
    }
    return { status: 'Good to Dry', desc: 'Acceptable outdoor drying conditions.', icon: 'weather-partly-cloudy', color: '#3b82f6' };
  };

  const outfit = getOutfitAdvice();
  const fitness = getFitnessScore();
  const carWash = getCarWashScore();
  const laundry = getLaundryScore();

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }, theme.shadow]}>
      {/* Title */}
      <View style={styles.titleWrap}>
        <Ionicons name="bulb" size={18} color="#38bdf8" />
        <Text style={[styles.headerTitle, { color: theme.text }]}>Smart Lifestyle Insights</Text>
      </View>

      {/* Full-width Responsive Segmented Tab Bar */}
      <View style={[styles.pillContainer, { backgroundColor: theme.pillBg }]}>
        <TouchableOpacity
          style={[styles.tabPill, selectedCategory === 'outfit' && { backgroundColor: theme.text }]}
          onPress={() => {
            triggerImpactLight();
            setSelectedCategory('outfit');
          }}
        >
          <Ionicons 
            name="shirt-outline" 
            size={14} 
            color={selectedCategory === 'outfit' ? (theme.text === '#ffffff' ? '#0f172a' : '#ffffff') : theme.subtext} 
          />
          <Text style={[styles.tabText, { color: selectedCategory === 'outfit' ? (theme.text === '#ffffff' ? '#0f172a' : '#ffffff') : theme.subtext }]}>
            Outfit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, selectedCategory === 'fitness' && { backgroundColor: theme.text }]}
          onPress={() => {
            triggerImpactLight();
            setSelectedCategory('fitness');
          }}
        >
          <Ionicons 
            name="bicycle-outline" 
            size={14} 
            color={selectedCategory === 'fitness' ? (theme.text === '#ffffff' ? '#0f172a' : '#ffffff') : theme.subtext} 
          />
          <Text style={[styles.tabText, { color: selectedCategory === 'fitness' ? (theme.text === '#ffffff' ? '#0f172a' : '#ffffff') : theme.subtext }]}>
            Fitness
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, selectedCategory === 'lifestyle' && { backgroundColor: theme.text }]}
          onPress={() => {
            triggerImpactLight();
            setSelectedCategory('lifestyle');
          }}
        >
          <Ionicons 
            name="car-outline" 
            size={14} 
            color={selectedCategory === 'lifestyle' ? (theme.text === '#ffffff' ? '#0f172a' : '#ffffff') : theme.subtext} 
          />
          <Text style={[styles.tabText, { color: selectedCategory === 'lifestyle' ? (theme.text === '#ffffff' ? '#0f172a' : '#ffffff') : theme.subtext }]}>
            Daily
          </Text>
        </TouchableOpacity>
      </View>

      {/* Outfit View */}
      {selectedCategory === 'outfit' && (
        <View style={styles.contentWrap}>
          <View style={styles.outfitRow}>
            <View style={styles.outfitIconWrap}>
              <MaterialCommunityIcons name={outfit.icon as any} size={26} color="#38bdf8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.outfitHeader, { color: theme.text }]}>Today's Attire Guide</Text>
              <Text style={[styles.outfitSummary, { color: theme.subtext }]}>
                Feels like {Math.round(isFahrenheit ? (feelsLike * 9/5) + 32 : feelsLike)}°{isFahrenheit ? 'F' : 'C'}
              </Text>
            </View>
          </View>

          <View style={styles.outfitSpecsGrid}>
            <View style={[styles.outfitSpecCard, { backgroundColor: theme.pillBg }]}>
              <Text style={[styles.specTitle, { color: theme.subtext }]}>TOPS & BASE</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{outfit.tops}</Text>
            </View>

            <View style={[styles.outfitSpecCard, { backgroundColor: theme.pillBg }]}>
              <Text style={[styles.specTitle, { color: theme.subtext }]}>OUTERWEAR</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{outfit.outer}</Text>
            </View>

            <View style={[styles.outfitSpecCardFull, { backgroundColor: theme.pillBg }]}>
              <Text style={[styles.specTitle, { color: theme.subtext }]}>GEAR & ACCESSORIES</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{outfit.accessories}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Fitness View */}
      {selectedCategory === 'fitness' && (
        <View style={styles.contentWrap}>
          <View style={styles.fitnessHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fitnessScore, { color: fitness.color }]}>
                {fitness.score}
                <Text style={{ fontSize: 16, color: theme.subtext, fontWeight: '500' }}> / 100</Text>
              </Text>
              <Text style={[styles.fitnessLabel, { color: theme.text }]}>{fitness.label}</Text>
            </View>
            <View style={[styles.fitnessBadge, { backgroundColor: fitness.color + '20', borderColor: fitness.color }]}>
              <Ionicons name="bicycle" size={24} color={fitness.color} />
            </View>
          </View>

          <View style={styles.fitnessTips}>
            <View style={[styles.tipRow, { backgroundColor: theme.pillBg }]}>
              <Ionicons name="walk" size={18} color="#38bdf8" />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Running & Jogging: {fitness.score > 70 ? 'Ideal pacing conditions' : 'Moderate strain expected'}
              </Text>
            </View>
            <View style={[styles.tipRow, { backgroundColor: theme.pillBg }]}>
              <Ionicons name="sunny" size={18} color="#f59e0b" />
              <Text style={[styles.tipText, { color: theme.text }]}>
                UV Index {uvIndex}: {uvIndex > 5 ? 'Apply SPF 30+ sunscreen' : 'Low sun exposure risk'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Daily Index View */}
      {selectedCategory === 'lifestyle' && (
        <View style={styles.dailyGrid}>
          <View style={[styles.dailyCard, { backgroundColor: theme.pillBg }]}>
            <View style={styles.dailyCardHeader}>
              <MaterialCommunityIcons name="car-wash" size={20} color={carWash.color} />
              <Text style={[styles.dailyCardStatus, { color: carWash.color }]}>{carWash.status}</Text>
            </View>
            <Text style={[styles.dailyCardTitle, { color: theme.text }]}>Car Wash</Text>
            <Text style={[styles.dailyCardDesc, { color: theme.subtext }]}>{carWash.desc}</Text>
          </View>

          <View style={[styles.dailyCard, { backgroundColor: theme.pillBg }]}>
            <View style={styles.dailyCardHeader}>
              <MaterialCommunityIcons name="tumble-dryer" size={20} color={laundry.color} />
              <Text style={[styles.dailyCardStatus, { color: laundry.color }]}>{laundry.status}</Text>
            </View>
            <Text style={[styles.dailyCardTitle, { color: theme.text }]}>Laundry Drying</Text>
            <Text style={[styles.dailyCardDesc, { color: theme.subtext }]}>{laundry.desc}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  pillContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    gap: 4,
    width: '100%',
    marginBottom: 14,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 11,
    gap: 5,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentWrap: {
    gap: 10,
  },
  outfitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  outfitIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outfitHeader: {
    fontSize: 15,
    fontWeight: '700',
  },
  outfitSummary: {
    fontSize: 13,
    marginTop: 2,
  },
  outfitSpecsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  outfitSpecCard: {
    flex: 1,
    minWidth: '47%',
    padding: 12,
    borderRadius: 14,
  },
  outfitSpecCardFull: {
    width: '100%',
    padding: 12,
    borderRadius: 14,
  },
  specTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  specVal: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  fitnessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fitnessScore: {
    fontSize: 30,
    fontWeight: '800',
  },
  fitnessLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  fitnessBadge: {
    width: 48,
    height: 48,
    borderRadius: 15,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fitnessTips: {
    gap: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 10,
  },
  tipText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  dailyGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  dailyCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
  },
  dailyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dailyCardStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
  dailyCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  dailyCardDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
});
