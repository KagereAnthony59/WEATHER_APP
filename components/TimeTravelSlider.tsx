import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeatherData } from '../hooks/useWeather';
import { triggerSelection, triggerImpactLight } from '../utils/haptics';

interface Props {
  weather: WeatherData;
  theme: any;
  selectedIndex: number | null;
  onSelectHour: (index: number | null) => void;
  isFahrenheit: boolean;
  is24Hour: boolean;
}

export const TimeTravelSlider: React.FC<Props> = ({ 
  weather, 
  theme, 
  selectedIndex, 
  onSelectHour,
  isFahrenheit,
  is24Hour 
}) => {
  const hourly = weather.hourly;
  const currentHourISO = hourly.time.find(t => new Date(t).getHours() === new Date().getHours() && new Date(t).getDate() === new Date().getDate());
  const startIndex = currentHourISO ? hourly.time.indexOf(currentHourISO) : 0;
  const next24Hours = hourly.time.slice(startIndex, startIndex + 24);

  const displayTemp = (c: number) => Math.round(isFahrenheit ? (c * 9/5) + 32 : c);

  const formatHour = (isoString: string) => {
    const d = new Date(isoString);
    if (is24Hour) return d.getHours() + ':00';
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h} ${ampm}`;
  };

  const WeatherIconMini = ({ code, isDay }: { code: number, isDay: number }) => {
    if (code === 0) return <Ionicons name={isDay ? 'sunny' : 'moon'} size={20} color={isDay ? '#f59e0b' : '#fef08a'} />;
    if (code <= 3) return <Ionicons name="cloud-outline" size={20} color="#cbd5e1" />;
    if (code <= 67 || (code >= 80 && code <= 82)) return <Ionicons name="rainy-outline" size={20} color="#38bdf8" />;
    if (code <= 77 || (code >= 85 && code <= 86)) return <Ionicons name="snow-outline" size={20} color="#e0f2fe" />;
    if (code >= 95) return <Ionicons name="flash-outline" size={20} color="#fbbf24" />;
    return <Ionicons name="cloud-outline" size={20} color="#cbd5e1" />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }, theme.shadow]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="time-outline" size={20} color="#38bdf8" />
          <Text style={[styles.title, { color: theme.text }]}>24-Hour Time Scrubber</Text>
        </View>

        {selectedIndex !== null && (
          <TouchableOpacity 
            style={[styles.resetBtn, { backgroundColor: theme.pillBg }]}
            onPress={() => {
              triggerImpactLight();
              onSelectHour(null);
            }}
          >
            <Ionicons name="radio-button-on" size={12} color="#10b981" />
            <Text style={[styles.resetBtnText, { color: theme.text }]}>Back to Live</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.hint, { color: theme.subtext }]}>
        Tap any hour below to preview future conditions, temperature & feel:
      </Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollRow}
      >
        {next24Hours.map((time, idx) => {
          const absoluteIdx = startIndex + idx;
          const isSelected = selectedIndex === absoluteIdx;
          const isNow = idx === 0 && selectedIndex === null;
          const rainProb = hourly.precipitationProbability[absoluteIdx] ?? 0;

          return (
            <TouchableOpacity
              key={time}
              style={[
                styles.hourPill,
                { backgroundColor: isSelected ? theme.text : theme.pillBg, borderColor: isSelected ? theme.text : theme.borderColor },
                isSelected && { transform: [{ scale: 1.05 }] },
                isNow && { borderColor: '#38bdf8', borderWidth: 1.5 }
              ]}
              onPress={() => {
                triggerSelection();
                if (idx === 0) onSelectHour(null);
                else onSelectHour(absoluteIdx);
              }}
            >
              <Text 
                style={[
                  styles.hourLabel, 
                  { color: isSelected ? (theme.text === '#ffffff' ? '#0f172a' : '#ffffff') : theme.text }
                ]}
              >
                {idx === 0 ? 'Now' : formatHour(time)}
              </Text>

              <WeatherIconMini 
                code={hourly.weatherCode[absoluteIdx]} 
                isDay={hourly.isDay[absoluteIdx]} 
              />

              <Text 
                style={[
                  styles.hourTemp, 
                  { color: isSelected ? (theme.text === '#ffffff' ? '#0f172a' : '#ffffff') : theme.text }
                ]}
              >
                {displayTemp(hourly.temperature[absoluteIdx])}°
              </Text>

              {rainProb > 15 ? (
                <View style={styles.rainProbWrap}>
                  <Ionicons name="water" size={10} color="#38bdf8" />
                  <Text style={[styles.rainProbText, { color: isSelected ? (theme.text === '#ffffff' ? '#0f172a' : '#ffffff') : '#38bdf8' }]}>
                    {rainProb}%
                  </Text>
                </View>
              ) : (
                <View style={{ height: 14 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    marginBottom: 14,
  },
  scrollRow: {
    gap: 8,
    paddingVertical: 4,
  },
  hourPill: {
    width: 68,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
  },
  hourLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  hourTemp: {
    fontSize: 15,
    fontWeight: '800',
  },
  rainProbWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 14,
  },
  rainProbText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
