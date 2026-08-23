import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const triggerSelection = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch (e) {
    // Ignore haptic errors on unsupported hardware
  }
};

export const triggerImpactLight = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {
    // Ignore
  }
};

export const triggerImpactMedium = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (e) {
    // Ignore
  }
};

export const triggerSuccess = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
    // Ignore
  }
};
