import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nProvider } from '@/contexts/i18nContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('app_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed.darkModeEnabled === 'boolean') {
            setOverride(parsed.darkModeEnabled ? 'dark' : 'light');
          }
        }
      } catch {}
    })();

    const sub = (event: any) => {
      if (event?.type === 'theme_change') {
        setOverride(event.payload === 'dark' ? 'dark' : 'light');
      }
    };
    // @ts-ignore - simple event bus on window for this app
    (global as any).__APP_EVENT_BUS__ = (global as any).__APP_EVENT_BUS__ || { listeners: [] };
    (global as any).__APP_EVENT_BUS__.listeners.push(sub);
    return () => {
      const bus = (global as any).__APP_EVENT_BUS__;
      if (!bus) return;
      bus.listeners = bus.listeners.filter((l: any) => l !== sub);
    };
  }, []);

  const theme = (override ?? systemScheme) === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <I18nProvider>
      <ThemeProvider value={theme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </I18nProvider>
  );
}
