import React from 'react';
import { View } from 'react-native';

interface Props {
  weatherCode: number;
  isDay: number;
}

export const WeatherOverlay: React.FC<Props> = () => {
  // Animations on web are handled differently or skipped for simplicity in this fallback
  return <View pointerEvents="none" />;
};
