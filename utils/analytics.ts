import { Platform } from 'react-native';
import PostHog from 'posthog-react-native';

export const POSTHOG_API_KEY = 'phc_rnARUT4DVPNsEcoeHTsYFTdABnd9SM9UPWiKHRpTbMis';
export const POSTHOG_HOST = 'https://eu.i.posthog.com';

export const posthog = new PostHog(POSTHOG_API_KEY, {
  host: POSTHOG_HOST,
  captureAppLifecycleEvents: true,
  flushAt: 1,
  flushInterval: 2000,
});

/**
 * Generic safe event tracker with instant flush
 */
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  try {
    if (posthog) {
      posthog.capture(event, properties);
      posthog.flush();
    }
  } catch (e) {
    console.warn('PostHog capture error:', e);
  }
};

/**
 * Track app launch & session start
 */
export const trackAppOpened = () => {
  trackEvent('app_opened', {
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track user searching for a city
 */
export const trackCitySearch = (cityName: string, country?: string, lat?: number, lon?: number) => {
  trackEvent('city_searched', {
    city_name: cityName,
    country: country || 'Unknown',
    latitude: lat,
    longitude: lon,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track when a user views current weather
 */
export const trackWeatherViewed = (cityName: string, temperature: number, weatherCode: number, aqi?: number) => {
  trackEvent('weather_viewed', {
    city_name: cityName,
    temperature,
    weather_code: weatherCode,
    air_quality_index: aqi,
  });
};

/**
 * Track user saving or removing favorite cities
 */
export const trackCitySaved = (cityName: string, action: 'add' | 'remove') => {
  trackEvent('city_saved_toggle', {
    city_name: cityName,
    action,
  });
};

/**
 * Track user interacting with time-travel forecast slider
 */
export const trackTimeTravel = (targetHour: string) => {
  trackEvent('time_travel_scrubbed', {
    target_hour: targetHour,
  });
};

/**
 * Track precipitation radar map opened
 */
export const trackRadarOpened = () => {
  trackEvent('radar_map_opened');
};
