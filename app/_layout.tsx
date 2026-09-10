import { Stack } from 'expo-router';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '../utils/analytics';

export default function RootLayout() {
  return (
    <PostHogProvider client={posthog}>
      <Stack screenOptions={{ headerShown: false }} />
    </PostHogProvider>
  );
}
