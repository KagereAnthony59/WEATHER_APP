import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherData } from '../hooks/useWeather';

interface Props {
  weather: WeatherData;
  theme: any;
  is24Hour: boolean;
}

// Calculate Moon Phase & Illumination from current date
const getMoonPhase = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let jd = 0;

  // Julian Day approx
  jd = (1461 * (year + 4800 + ((month - 14) / 12 | 0))) / 4 +
       (367 * (month - 2 - 12 * ((month - 14) / 12 | 0))) / 12 -
       (3 * (((year + 4900 + ((month - 14) / 12 | 0)) / 100) | 0)) / 4 +
       day - 32075;

  // Synodic month 29.53058867
  const phaseDays = (jd - 2451549.5) % 29.53058867;
  const normalized = (phaseDays < 0 ? phaseDays + 29.53058867 : phaseDays) / 29.53058867;
  
  // Illumination percentage
  const illumination = Math.round((1 - Math.cos(normalized * 2 * Math.PI)) / 2 * 100);

  let phaseName = "New Moon";
  let iconName = "moon-new";

  if (normalized < 0.03 || normalized > 0.97) {
    phaseName = "New Moon";
    iconName = "moon-new";
  } else if (normalized < 0.22) {
    phaseName = "Waxing Crescent";
    iconName = "moon-waxing-crescent";
  } else if (normalized < 0.28) {
    phaseName = "First Quarter";
    iconName = "moon-first-quarter";
  } else if (normalized < 0.47) {
    phaseName = "Waxing Gibbous";
    iconName = "moon-waxing-gibbous";
  } else if (normalized < 0.53) {
    phaseName = "Full Moon";
    iconName = "moon-full";
  } else if (normalized < 0.72) {
    phaseName = "Waning Gibbous";
    iconName = "moon-waning-gibbous";
  } else if (normalized < 0.78) {
    phaseName = "Last Quarter";
    iconName = "moon-last-quarter";
  } else {
    phaseName = "Waning Crescent";
    iconName = "moon-waning-crescent";
  }

  return { phaseName, illumination, iconName };
};

export const CelestialArc: React.FC<Props> = ({ weather, theme, is24Hour }) => {
  const sunriseStr = weather.daily.sunrise[0];
  const sunsetStr = weather.daily.sunset[0];

  const now = new Date();
  const sunrise = new Date(sunriseStr);
  const sunset = new Date(sunsetStr);

  const totalDaylightMs = sunset.getTime() - sunrise.getTime();
  const elapsedMs = now.getTime() - sunrise.getTime();

  let sunProgress = 0; // 0 (sunrise) to 1 (sunset)
  let isDaytime = false;

  if (now >= sunrise && now <= sunset) {
    sunProgress = Math.min(1, Math.max(0, elapsedMs / totalDaylightMs));
    isDaytime = true;
  } else if (now > sunset) {
    sunProgress = 1;
    isDaytime = false;
  } else {
    sunProgress = 0;
    isDaytime = false;
  }

  // Golden hour starts ~50 mins before sunset
  const goldenHourTime = new Date(sunset.getTime() - 50 * 60 * 1000);

  // Solar noon
  const solarNoonTime = new Date(sunrise.getTime() + totalDaylightMs / 2);

  // Format helper
  const formatClock = (d: Date) => {
    return is24Hour 
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Daylight remaining text
  let remainingText = "";
  if (isDaytime) {
    const minsLeft = Math.round((sunset.getTime() - now.getTime()) / (1000 * 60));
    const hrs = Math.floor(minsLeft / 60);
    const mins = minsLeft % 60;
    remainingText = `${hrs}h ${mins}m daylight left`;
  } else {
    const minsToSunrise = Math.round((sunrise.getTime() + 24 * 60 * 60 * 1000 - now.getTime()) / (1000 * 60)) % (24 * 60);
    const hrs = Math.floor(minsToSunrise / 60);
    const mins = minsToSunrise % 60;
    remainingText = `${hrs}h ${mins}m to sunrise`;
  }

  const moon = getMoonPhase(now);

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }, theme.shadow]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="sunny" size={18} color="#f59e0b" />
          <Text style={[styles.cardTitle, { color: theme.text }]}>Sun & Moon Cycle</Text>
        </View>
        <Text style={[styles.daylightText, { color: theme.subtext }]}>{remainingText}</Text>
      </View>

      {/* Sun Arc Path Visualizer */}
      <View style={styles.arcContainer}>
        <View style={[styles.horizonLine, { backgroundColor: theme.borderColor }]} />

        {/* Progress Fill Line */}
        <View 
          style={[
            styles.progressLine, 
            { 
              width: `${Math.round(sunProgress * 100)}%`, 
              backgroundColor: isDaytime ? '#f59e0b' : theme.subtext 
            }
          ]} 
        />

        {/* Sun Indicator Pin */}
        <View 
          style={[
            styles.sunMarker, 
            { 
              left: `${Math.min(94, Math.max(4, Math.round(sunProgress * 100)))}%`,
              backgroundColor: isDaytime ? '#f59e0b' : '#64748b'
            }
          ]}
        >
          <Ionicons 
            name={isDaytime ? "sunny" : "moon"} 
            size={14} 
            color="#ffffff" 
          />
        </View>
      </View>

      {/* Solar Keypoints (4 columns equally spaced) */}
      <View style={styles.solarPointsRow}>
        <View style={styles.pointItem}>
          <Text style={[styles.pointLabel, { color: theme.subtext }]}>SUNRISE</Text>
          <Text style={[styles.pointValue, { color: theme.text }]}>{formatClock(sunrise)}</Text>
        </View>

        <View style={styles.pointItem}>
          <Text style={[styles.pointLabel, { color: theme.subtext }]}>NOON</Text>
          <Text style={[styles.pointValue, { color: theme.text }]}>{formatClock(solarNoonTime)}</Text>
        </View>

        <View style={styles.pointItem}>
          <Text style={[styles.pointLabel, { color: theme.subtext }]}>GOLDEN</Text>
          <Text style={[styles.pointValue, { color: '#f59e0b' }]}>{formatClock(goldenHourTime)}</Text>
        </View>

        <View style={styles.pointItem}>
          <Text style={[styles.pointLabel, { color: theme.subtext }]}>SUNSET</Text>
          <Text style={[styles.pointValue, { color: theme.text }]}>{formatClock(sunset)}</Text>
        </View>
      </View>

      {/* Moon Phase Section */}
      <View style={[styles.moonContainer, { backgroundColor: theme.pillBg }]}>
        <View style={styles.moonLeft}>
          <MaterialCommunityIcons name={moon.iconName as any} size={30} color="#e0f2fe" />
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.moonTitle, { color: theme.text }]}>{moon.phaseName}</Text>
            <Text style={[styles.moonSub, { color: theme.subtext }]}>{moon.illumination}% Illuminated</Text>
          </View>
        </View>
        <View style={styles.moonRight}>
          <Ionicons name="sparkles" size={14} color="#f59e0b" style={{ marginRight: 4 }} />
          <Text style={[styles.moonHint, { color: theme.subtext }]}>Full in ~{Math.round((1 - moon.illumination/100) * 14)}d</Text>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  daylightText: {
    fontSize: 12,
    fontWeight: '600',
  },
  arcContainer: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 8,
    marginBottom: 14,
  },
  horizonLine: {
    height: 4,
    width: '100%',
    borderRadius: 2,
  },
  progressLine: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  sunMarker: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -13,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  solarPointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pointItem: {
    flex: 1,
    alignItems: 'center',
  },
  pointLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pointValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  moonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 15,
  },
  moonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moonTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  moonSub: {
    fontSize: 11,
    marginTop: 2,
  },
  moonRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moonHint: {
    fontSize: 11,
    fontWeight: '500',
  },
});
