import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withDelay,
  Easing,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Props {
  weatherCode: number;
  isDay: number;
}

const RAIN_COUNT = 40;
const SNOW_COUNT = 30;

const RainDrop = ({ index }: { index: number }) => {
  const translateX = useMemo(() => Math.random() * width, []);
  const delay = useMemo(() => Math.random() * 2000, []);
  const duration = useMemo(() => 800 + Math.random() * 400, []);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(height + 20, { 
          duration, 
          easing: Easing.linear 
        }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX }],
    opacity: interpolate(translateY.value, [0, height], [0.8, 0.4], Extrapolate.CLAMP),
  }));

  return (
    <Animated.View style={[styles.rainDrop, animatedStyle]} />
  );
};

const SnowFlake = ({ index }: { index: number }) => {
  const translateXBase = useMemo(() => Math.random() * width, []);
  const delay = useMemo(() => Math.random() * 5000, []);
  const duration = useMemo(() => 4000 + Math.random() * 3000, []);
  const size = useMemo(() => 4 + Math.random() * 6, []);
  
  const translateY = useSharedValue(-20);
  const drift = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(height + 20, { 
          duration, 
          easing: Easing.linear 
        }),
        -1,
        false
      )
    );
    drift.value = withRepeat(
      withTiming(20, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value }, 
      { translateX: translateXBase + drift.value }
    ],
    width: size,
    height: size,
    borderRadius: size / 2,
    opacity: interpolate(translateY.value, [0, height], [1, 0.3], Extrapolate.CLAMP),
  }));

  return (
    <Animated.View style={[styles.snowFlake, animatedStyle]} />
  );
};

const SunRay = ({ index }: { index: number }) => {
  const rotation = useSharedValue(index * 45);
  
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(rotation.value + 360, { 
        duration: 30000, 
        easing: Easing.linear 
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.sunRayContainer, animatedStyle]}>
        <LinearGradient
            colors={['rgba(255, 236, 179, 0.2)', 'transparent']}
            style={styles.sunRay}
        />
    </Animated.View>
  );
};

export const WeatherOverlay: React.FC<Props> = ({ weatherCode, isDay }) => {
  const isRain = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82) || weatherCode >= 95;
  const isSnow = (weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86);
  const isClear = weatherCode === 0 && isDay === 1;

  if (!isRain && !isSnow && !isClear) {
    return null;
  }

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', zIndex: 1 }]} pointerEvents="none">
      {isRain && Array.from({ length: RAIN_COUNT }).map((_, i) => (
        <RainDrop key={i} index={i} />
      ))}
      {isSnow && Array.from({ length: SNOW_COUNT }).map((_, i) => (
        <SnowFlake key={i} index={i} />
      ))}
      {isClear && (
          <View style={styles.sunContainer}>
             {Array.from({ length: 8 }).map((_, i) => (
                 <SunRay key={i} index={i} />
             ))}
          </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rainDrop: {
    position: 'absolute',
    width: 2,
    height: 15,
    backgroundColor: 'rgba(174, 214, 241, 0.6)',
    borderRadius: 1,
  },
  snowFlake: {
    position: 'absolute',
    backgroundColor: '#fff',
  },
  sunContainer: {
    position: 'absolute',
    top: -height * 0.2,
    right: -width * 0.2,
    width: width * 1.5,
    height: width * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunRayContainer: {
    position: 'absolute',
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunRay: {
    width: '100%',
    height: '100%',
  }
});
