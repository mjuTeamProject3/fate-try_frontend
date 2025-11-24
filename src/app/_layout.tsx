import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import * as Linking from 'expo-linking';

import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nProvider } from '@/contexts/i18nContext';
import { API_BASE_URL } from '@/constants/api';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'login', // 초기 화면을 로그인으로 설정 (로그인 상태 확인 후 자동 리다이렉트)
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // 로그인 상태 확인 함수 (토큰 검증 및 refresh 포함)
  const checkLoginStatus = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      // 1. 토큰이 없거나 임시 토큰이면 로그인 화면으로
      if (!accessToken || accessToken.startsWith('temp_')) {
        setIsLoggedIn(false);
        return false;
      }
      
      // 2. 서버에 토큰 유효성 검증
      try {
        const response = await fetch(`${API_BASE_URL}/auth/protected`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          // 토큰 유효 → 로그인 상태 유지
          setIsLoggedIn(true);
          return true;
        }
      } catch (error) {
        console.log('토큰 검증 실패, refresh 시도:', error);
      }
      
      // 3. 토큰 만료 → refresh 시도
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });
          
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            // 새 토큰 저장
            if (data.success?.accessToken && data.success?.refreshToken) {
              await AsyncStorage.setItem('accessToken', data.success.accessToken);
              await AsyncStorage.setItem('refreshToken', data.success.refreshToken);
              await AsyncStorage.setItem('isLoggedIn', 'true');
              
              setIsLoggedIn(true);
              return true;
            }
          }
        } catch (error) {
          console.error('Refresh 실패:', error);
        }
      }
      
      // 4. 모두 실패 → 로그아웃 처리
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('isLoggedIn');
      setIsLoggedIn(false);
      return false;
      
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
      setIsLoggedIn(false);
      return false;
    }
  };

  // Deep linking 처리 함수
  const handleDeepLink = async (url: string) => {
    try {
      console.log('🔗 Deep link 수신:', url);
      const parsed = Linking.parse(url);
      
      // 인증 콜백 처리
      if (parsed.path === 'auth/callback') {
        const accessToken = parsed.queryParams?.accessToken as string;
        const refreshToken = parsed.queryParams?.refreshToken as string;
        const profileComplete = parsed.queryParams?.profileComplete as string;
        const missingFields = parsed.queryParams?.missingFields as string;
        
        if (accessToken) {
          // 토큰 저장
          await AsyncStorage.setItem('accessToken', accessToken);
          if (refreshToken) {
            await AsyncStorage.setItem('refreshToken', refreshToken);
          }
          await AsyncStorage.setItem('isLoggedIn', 'true');
          
          // 프로필 완성 여부에 따라 라우팅
          if (profileComplete === 'true') {
            // 프로필 완성 → 홈 화면으로
            console.log('✅ 프로필 완성, 홈 화면으로 이동');
            router.replace('/(tabs)');
          } else {
            // 프로필 미완성 → 프로필 정보 입력 페이지로
            console.log('📝 프로필 미완성, 프로필 정보 입력 페이지로 이동');
            if (missingFields) {
              console.log('⚠️ 누락된 필드:', missingFields);
            }
            router.replace('/signup-additional');
          }
        }
      } 
      // 에러 처리
      else if (parsed.path === 'auth/error') {
        const error = parsed.queryParams?.error as string;
        console.error('❌ 로그인 에러:', error);
        // 에러 메시지를 표시하거나 로그인 화면으로 이동
        router.replace('/login');
      }
    } catch (error) {
      console.error('Deep link 처리 오류:', error);
    }
  };

  // 초기 로그인 상태 확인 및 Deep linking 설정
  useEffect(() => {
    (async () => {
      const isLoggedIn = await checkLoginStatus();
      setIsInitialized(true);
      
      // 로그인되어 있으면 홈으로 자동 이동
      if (isLoggedIn) {
        router.replace('/(tabs)');
      }
      
      // 초기 URL 확인 (앱이 이미 열려있을 때)
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleDeepLink(initialUrl);
      }
      
      // Deep link 리스너 등록
      const subscription = Linking.addEventListener('url', (event) => {
        handleDeepLink(event.url);
      });
      
      return () => {
        subscription.remove();
      };
    })();
  }, []);

  // segments 변경 시 로그인 상태 다시 확인
  useEffect(() => {
    if (isInitialized) {
      checkLoginStatus();
    }
  }, [segments]);

  // 로그인 상태에 따라 라우팅
  useEffect(() => {
    if (!isInitialized || isLoggedIn === null) return; // 초기화 전이거나 로그인 상태 확인 중

    const inAuthGroup = segments[0] === '(tabs)';
    const isLoginScreen = segments[0] === 'login';

    if (!isLoggedIn && inAuthGroup) {
      // 로그인되지 않았는데 탭 화면에 있으면 로그인 화면으로 이동
      router.replace('/login');
    } else if (isLoggedIn && isLoginScreen) {
      // 로그인되어 있는데 로그인 화면에 있으면 홈으로 이동
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, segments, isInitialized]);

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

  // 초기화 전에는 아무것도 렌더링하지 않음
  if (!isInitialized) {
    return null;
  }

  return (
    <I18nProvider>
      <ThemeProvider value={theme}>
        {/* 전체 스택 네비게이터에서 기본 헤더를 숨겨서
            각 화면에서 커스텀 헤더를 직접 그릴 수 있도록 설정 */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </I18nProvider>
  );
}
