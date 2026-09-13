import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerImpactLight } from '../utils/haptics';

interface Props {
  theme: any;
}

const WEATHER_TIPS = [
  {
    icon: 'flash-outline' as const,
    iconColor: '#fbbf24',
    tag: 'Science Trivia',
    title: 'Lightning Distance Rule',
    fact: 'Count the seconds between seeing lightning and hearing thunder, then divide by 5 to calculate how many miles away the strike hit (or divide by 3 for kilometers).'
  },
  {
    icon: 'water-outline' as const,
    iconColor: '#38bdf8',
    tag: 'Nature Fact',
    title: 'The Scent of Rain',
    fact: 'The pleasant, earthy smell that accompanies the first rain after a dry spell is called Petrichor. It is caused by soil bacteria releasing geosmin.'
  },
  {
    icon: 'cloud-outline' as const,
    iconColor: '#94a3b8',
    tag: 'Atmosphere Fact',
    title: 'Heavy Fluffy Clouds',
    fact: 'An average white cumulus cloud weighs around 1.1 million pounds (500,000 kg)—the equivalent of about 100 elephants floating overhead!'
  },
  {
    icon: 'color-palette-outline' as const,
    iconColor: '#a855f7',
    tag: 'Optics Trivia',
    title: 'Double Rainbows',
    fact: 'In a double rainbow, light reflects twice inside water droplets. The secondary outer bow always has its color order reversed, with red on the inside.'
  },
  {
    icon: 'sunny-outline' as const,
    iconColor: '#f59e0b',
    tag: 'Health & Sun',
    title: 'Peak UV Caution',
    fact: 'UV radiation is strongest when your shadow is shorter than you are (typically 10 AM to 4 PM). Remember eye protection and sunscreen on high index days.'
  },
  {
    icon: 'thermometer-outline' as const,
    iconColor: '#ec4899',
    tag: 'Nature Trivia',
    title: "Nature's Thermometer",
    fact: "You can calculate temperature using crickets! Count how many chirps you hear in 14 seconds and add 40 to get the temperature in °F (Dolbear's Law)."
  },
  {
    icon: 'snow-outline' as const,
    iconColor: '#67e8f9',
    tag: 'Winter Science',
    title: 'Snow Silence',
    fact: 'Freshly fallen snow traps sound waves in air pockets between flakes, absorbing acoustic vibrations and creating a noticeably quiet, peaceful hush outdoors.'
  }
];

export const WeatherWisdom: React.FC<Props> = ({ theme }) => {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    triggerImpactLight();
    setIndex((prev) => (prev + 1) % WEATHER_TIPS.length);
  };

  const currentTip = WEATHER_TIPS[index];

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }, theme.shadow]}>
      <View style={styles.topRow}>
        <View style={styles.tagBadge}>
          <Ionicons name={currentTip.icon} size={15} color={currentTip.iconColor} style={{ marginRight: 6 }} />
          <Text style={[styles.tagText, { color: currentTip.iconColor }]}>{currentTip.tag}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.nextButton, { backgroundColor: theme.pillBg, borderColor: theme.borderColor }]} 
          onPress={handleNext}
          activeOpacity={0.7}
        >
          <Text style={[styles.nextButtonText, { color: theme.text }]}>Next Fact</Text>
          <Ionicons name="shuffle-outline" size={14} color={theme.text} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>{currentTip.title}</Text>
      <Text style={[styles.fact, { color: theme.subtext }]}>{currentTip.fact}</Text>

      <View style={styles.indicatorRow}>
        {WEATHER_TIPS.map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.dot, 
              { backgroundColor: i === index ? currentTip.iconColor : 'rgba(150,150,150,0.3)' },
              i === index && styles.activeDot
            ]} 
          />
        ))}
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  nextButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  fact: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 14,
    height: 6,
    borderRadius: 3,
  },
});
