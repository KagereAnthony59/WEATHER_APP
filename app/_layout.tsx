import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { PostHogProvider } from 'posthog-react-native';
import * as Updates from 'expo-updates';
import { posthog } from '../utils/analytics';

export default function RootLayout() {
  useEffect(() => {
    async function onFetchUpdateAsync() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log(`[OTA Update] Check skipped or error: ${error}`);
      }
    }
    onFetchUpdateAsync();
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <Stack screenOptions={{ headerShown: false }} />
    </PostHogProvider>
  );
}
