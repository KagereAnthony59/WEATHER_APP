import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationSettings {
  morningBriefing: boolean;
  morningTime: string; // "07:00"
  rainAlert: boolean;
  uvAlert: boolean;
}

export const NOTIFICATION_SETTINGS_KEY = '@weather_notification_settings_v1';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  morningBriefing: true,
  morningTime: '07:30',
  rainAlert: true,
  uvAlert: true,
};

// Configure how notifications are presented when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from device
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('weather-alerts', {
        name: 'Weather Alerts & Daily Briefings',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#38bdf8',
        sound: 'default',
      });
    }

    return true;
  } catch (e) {
    console.warn('Error requesting notification permissions:', e);
    return false;
  }
};

/**
 * Load saved notification preferences
 */
export const loadNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load notification settings:', e);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
};

/**
 * Save notification preferences and resync schedules
 */
export const saveNotificationSettings = async (
  settings: NotificationSettings,
  cityName?: string,
  weatherData?: any
): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    if (cityName && weatherData) {
      await syncWeatherNotificationSchedules(settings, cityName, weatherData);
    }
  } catch (e) {
    console.warn('Failed to save notification settings:', e);
  }
};

/**
 * Synchronize daily weather briefing and alert schedules
 */
export const syncWeatherNotificationSchedules = async (
  settings: NotificationSettings,
  cityName: string,
  weatherData: any
): Promise<void> => {
  try {
    if (Platform.OS === 'web') return;

    // Cancel existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!weatherData) return;

    const granted = await requestNotificationPermissions();
    if (!granted) return;

    // 1. Morning Daily Briefing
    if (settings.morningBriefing) {
      const [hourStr, minuteStr] = (settings.morningTime || '07:30').split(':');
      const hour = parseInt(hourStr, 10) || 7;
      const minute = parseInt(minuteStr, 10) || 30;

      const currentTemp = Math.round(weatherData.temperature ?? 22);
      const highTemp = Math.round(weatherData.daily?.temperatureMax?.[0] ?? currentTemp);
      const lowTemp = Math.round(weatherData.daily?.temperatureMin?.[0] ?? currentTemp - 5);

      await Notifications.scheduleNotificationAsync({
        identifier: 'morning-briefing',
        content: {
          title: `🌤️ Morning Weather for ${cityName}`,
          body: `Today: High of ${highTemp}°C, Low of ${lowTemp}°C. Have a fantastic day!`,
          sound: 'default',
          data: { type: 'morning_briefing', cityName },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    }

    // 2. High Rain / Storm Warning Alert
    if (settings.rainAlert && weatherData.hourly?.precipitationProbability) {
      const maxPrecip = Math.max(...weatherData.hourly.precipitationProbability.slice(0, 12));
      if (maxPrecip >= 60) {
        await Notifications.scheduleNotificationAsync({
          identifier: 'rain-alert',
          content: {
            title: `🌧️ Rain & Commute Alert in ${cityName}`,
            body: `High probability (${maxPrecip}%) of rain expected in the next few hours. Don't forget your umbrella!`,
            sound: 'default',
            data: { type: 'rain_warning', cityName },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 60 * 15, // In 15 minutes
            repeats: false,
          },
        });
      }
    }

    // 3. Extreme UV Alert
    if (settings.uvAlert && weatherData.daily?.uvIndexMax?.[0] >= 8) {
      const uv = Math.round(weatherData.daily.uvIndexMax[0]);
      await Notifications.scheduleNotificationAsync({
        identifier: 'uv-alert',
        content: {
          title: `☀️ High UV Index Alert (${uv}) in ${cityName}`,
          body: `Peak midday sun exposure can cause sunburn quickly. Wear sunscreen and sunglasses.`,
          sound: 'default',
          data: { type: 'uv_warning', cityName },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 11,
          minute: 0,
        },
      });
    }
  } catch (e) {
    console.warn('Error scheduling notifications:', e);
  }
};

/**
 * Trigger an instant test notification so the user can verify
 */
export const sendTestWeatherNotification = async (cityName: string, temp: number): Promise<boolean> => {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌤️ K & A Weather Alert • ${cityName}`,
        body: `Live update: Currently ${Math.round(temp)}°C with smooth winds. Notifications are working perfectly!`,
        sound: 'default',
      },
      trigger: null, // Immediate
    });

    return true;
  } catch (e) {
    console.warn('Failed to send test notification:', e);
    return false;
  }
};
