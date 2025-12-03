import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
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
  
  // 재시도 방지용 ref
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  // 렌더링 로그 제어용 ref
  const hasRenderedRef = useRef(false);
  const hasLoggedBlackScreenRef = useRef(false);
  // 이전 segments 추적 (라우팅 로그 최적화용)
  const prevSegmentsRef = useRef<string | undefined>(undefined);
  // 초기 라우팅 시도 여부 추적
  const hasAttemptedInitialRoutingRef = useRef(false);

  // 로그인 상태 확인 함수 (토큰 검증 및 refresh 포함)
  const checkLoginStatus = async () => {
    const startTime = Date.now();
    console.log('[로그인 체크] 시작', { 
      isChecking: isCheckingRef.current, 
      lastCheck: lastCheckTimeRef.current,
      timeSinceLastCheck: Date.now() - lastCheckTimeRef.current 
    });
    
    // 중복 호출 방지: 이미 체크 중이면 무시
    if (isCheckingRef.current) {
      console.log('[로그인 체크] ⚠️ 이미 체크 중이므로 무시');
      return false;
    }
    
    // 최근 5초 이내에 체크했으면 무시 (너무 자주 호출 방지)
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 5000) {
      console.log('[로그인 체크] ⚠️ 최근에 체크했으므로 무시', {
        timeSinceLastCheck: now - lastCheckTimeRef.current,
        lastCheckTime: new Date(lastCheckTimeRef.current).toISOString()
      });
      return false;
    }
    
    isCheckingRef.current = true;
    lastCheckTimeRef.current = now;
    console.log('[로그인 체크] ✅ 체크 시작');
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      console.log('[로그인 체크] 토큰 확인', { 
        hasToken: !!accessToken, 
        isTempToken: accessToken?.startsWith('temp_') 
      });
      
      // 1. 토큰이 없거나 임시 토큰이면 로그인 화면으로
      if (!accessToken || accessToken.startsWith('temp_')) {
        console.log('[로그인 체크] ❌ 토큰 없음 또는 임시 토큰');
        setIsLoggedIn(false);
        isCheckingRef.current = false;
        return false;
      }
      
      // 2. 서버에 토큰 유효성 검증 (타임아웃 추가)
      try {
        console.log('[로그인 체크] 🔄 토큰 검증 시작', { url: `${API_BASE_URL}/auth/protected` });
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
        
        const fetchStartTime = Date.now();
        const response = await fetch(`${API_BASE_URL}/auth/protected`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const fetchDuration = Date.now() - fetchStartTime;
        console.log('[로그인 체크] 토큰 검증 응답', { 
          ok: response.ok, 
          status: response.status,
          duration: `${fetchDuration}ms`
        });
        
        if (response.ok) {
          // 토큰 유효 → 로그인 상태 유지
          console.log('[로그인 체크] ✅ 토큰 유효');
          setIsLoggedIn(true);
          isCheckingRef.current = false;
          return true;
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('[로그인 체크] ⏱️ 토큰 검증 타임아웃');
        } else if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
          console.error('[로그인 체크] ❌ 네트워크 에러 - 서버에 연결할 수 없음:', error.message);
          // 네트워크 에러인 경우에도 계속 진행 (refresh 시도)
        } else {
          console.log('[로그인 체크] ❌ 토큰 검증 실패, refresh 시도:', error.message || error);
        }
      }
      
      // 3. 토큰 만료 → refresh 시도 (타임아웃 추가)
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      console.log('[로그인 체크] 🔄 Refresh 토큰 확인', { hasRefreshToken: !!refreshToken });
      
      if (refreshToken) {
        try {
          console.log('[로그인 체크] 🔄 Refresh 시작');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
          
          const refreshStartTime = Date.now();
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          const refreshDuration = Date.now() - refreshStartTime;
          console.log('[로그인 체크] Refresh 응답', { 
            ok: refreshResponse.ok, 
            status: refreshResponse.status,
            duration: `${refreshDuration}ms`
          });
          
          if (refreshResponse.ok) {
            // 안전한 JSON 파싱
            let data;
            try {
              const contentType = refreshResponse.headers.get('content-type');
              if (!contentType || !contentType.includes('application/json')) {
                const text = await refreshResponse.text();
                throw new Error(`Expected JSON but got ${contentType}`);
              }
              const text = await refreshResponse.text();
              data = text ? JSON.parse(text) : null;
            } catch (parseError) {
              console.error('Refresh 응답 파싱 오류:', parseError);
              throw new Error('응답 파싱 실패');
            }
            
            // 새 토큰 저장
            if (data && data.success?.accessToken && data.success?.refreshToken) {
              console.log('[로그인 체크] ✅ Refresh 성공 - 새 토큰 저장');
              await AsyncStorage.setItem('accessToken', data.success.accessToken);
              await AsyncStorage.setItem('refreshToken', data.success.refreshToken);
              await AsyncStorage.setItem('isLoggedIn', 'true');
              
              setIsLoggedIn(true);
              isCheckingRef.current = false;
              return true;
            } else {
              console.log('[로그인 체크] ❌ Refresh 응답에 토큰 없음');
            }
          } else {
            console.log('[로그인 체크] ❌ Refresh 실패', { status: refreshResponse.status });
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log('[로그인 체크] ⏱️ Refresh 타임아웃');
          } else if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
            console.error('[로그인 체크] ❌ Refresh 네트워크 에러 - 서버에 연결할 수 없음:', error.message);
          } else {
            console.error('[로그인 체크] ❌ Refresh 실패:', error.message || error);
          }
        }
      } else {
        console.log('[로그인 체크] ❌ Refresh 토큰 없음');
      }
      
      // 4. 모두 실패 → 로그아웃 처리
      console.log('[로그인 체크] ❌ 모든 인증 실패 - 로그아웃 처리');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('isLoggedIn');
      setIsLoggedIn(false);
      isCheckingRef.current = false;
      return false;
      
    } catch (error) {
      console.error('[로그인 체크] ❌ 예외 발생:', error);
      setIsLoggedIn(false);
      isCheckingRef.current = false;
      return false;
    } finally {
      // 체크 완료 플래그 리셋 (에러가 발생해도 리셋)
      const totalDuration = Date.now() - startTime;
      console.log('[로그인 체크] ✅ 체크 완료', { 
        duration: `${totalDuration}ms`,
        isChecking: isCheckingRef.current 
      });
      isCheckingRef.current = false;
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
    let isMounted = true;
    let subscription: any = null;
    const initStartTime = Date.now();
    
    console.log('[초기화] 🚀 시작');
    
    (async () => {
      try {
        // 타임아웃 설정: 최대 10초 후에는 무조건 초기화 완료 (네트워크가 느릴 수 있으므로 여유 있게)
        const timeoutId = setTimeout(() => {
          if (isMounted) {
            const elapsed = Date.now() - initStartTime;
            console.warn('[초기화] ⏱️ 타임아웃 - 강제로 초기화 완료', { elapsed: `${elapsed}ms` });
            console.warn('[초기화] ⚠️ 네트워크가 느리거나 서버에 연결할 수 없습니다. 오프라인 모드로 진행합니다.');
            setIsInitialized(true);
            setIsLoggedIn(false);
          }
        }, 10000); // 10초로 증가 (네트워크가 느릴 수 있음)
        
        console.log('[초기화] 🔄 Promise.allSettled 시작');
        // 병렬 처리: 로그인 상태 확인과 초기 URL 확인을 동시에 실행
        // Promise.allSettled 사용으로 하나가 실패해도 계속 진행
        const results = await Promise.allSettled([
          checkLoginStatus().catch(err => {
            const errorMessage = err?.message || String(err);
            if (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch')) {
              console.error('[초기화] ❌ 로그인 상태 확인 실패 - 네트워크 에러:', errorMessage);
            } else {
              console.error('[초기화] ❌ 로그인 상태 확인 실패:', errorMessage);
            }
            return false; // 네트워크 에러 시에도 false 반환하여 로그아웃 상태로 처리
          }),
          Promise.race([
            Linking.getInitialURL(),
            new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 3000)) // 3초 타임아웃
          ]).catch((err) => {
            console.error('[초기화] ❌ Deep link 확인 실패:', err);
            return null;
          }),
        ]);
        
        clearTimeout(timeoutId);
        const elapsed = Date.now() - initStartTime;
        console.log('[초기화] ✅ Promise.allSettled 완료', { 
          elapsed: `${elapsed}ms`,
          loginStatus: results[0].status,
          deepLinkStatus: results[1].status
        });
        
        if (!isMounted) {
          console.log('[초기화] ⚠️ 컴포넌트 언마운트됨');
          return;
        }
        
        // 결과 추출
        const isLoggedIn = results[0].status === 'fulfilled' ? results[0].value : false;
        const initialUrl = results[1].status === 'fulfilled' ? results[1].value : null;
        
        // 에러 상세 정보 추출
        const loginError = results[0].status === 'rejected' ? results[0].reason : null;
        const loginErrorMsg = loginError?.message || String(loginError || '');
        const isNetworkError = loginErrorMsg.includes('Network request failed') || 
                              loginErrorMsg.includes('Failed to fetch') ||
                              loginErrorMsg.includes('AbortError');
        
        console.log('[초기화] 결과', { 
          isLoggedIn, 
          hasInitialUrl: !!initialUrl,
          loginResultStatus: results[0].status,
          loginResultValue: results[0].status === 'fulfilled' ? results[0].value : results[0].reason,
          isNetworkError,
          errorMessage: loginErrorMsg
        });
        
        // 네트워크 에러인 경우 경고 로그
        if (isNetworkError) {
          console.warn('[초기화] ⚠️ 네트워크 에러 발생 - 서버에 연결할 수 없습니다. 오프라인 모드로 진행합니다.');
        }
        
        // 무조건 초기화 완료 (네트워크 에러가 있어도)
        setIsInitialized(true);
        console.log('[초기화] ✅ 초기화 완료', { isLoggedIn, isNetworkError });
        
        // 초기화 시 라우팅은 하지 않음 (라우팅 로직에서 처리)
        // segments가 아직 로드되지 않았을 수 있으므로 라우팅 로직에서 처리하는 것이 안전함
        
        // 초기 URL 확인 (앱이 이미 열려있을 때)
        if (initialUrl) {
          try {
            console.log('[초기화] 🔗 Deep link 처리:', initialUrl);
            await handleDeepLink(initialUrl);
          } catch (err) {
            console.error('[초기화] ❌ Deep link 처리 실패:', err);
          }
        }
        
        // Deep link 리스너 등록
        subscription = Linking.addEventListener('url', (event) => {
          handleDeepLink(event.url);
        });
      } catch (error: any) {
        const errorMessage = error?.message || String(error || 'Unknown error');
        const isNetworkError = errorMessage.includes('Network request failed') || 
                              errorMessage.includes('Failed to fetch');
        
        if (isNetworkError) {
          console.error('[초기화] ❌ 초기화 중 네트워크 에러:', errorMessage);
          console.warn('[초기화] ⚠️ 서버에 연결할 수 없습니다. 오프라인 모드로 진행합니다.');
        } else {
          console.error('[초기화] ❌ 초기화 중 오류:', errorMessage);
        }
        
        // 에러 발생 시에도 초기화 완료하여 최소한 로그인 화면은 보이도록
        if (isMounted) {
          setIsInitialized(true);
          setIsLoggedIn(false);
          console.log('[초기화] ✅ 에러 발생했지만 초기화 완료 (오프라인 모드)');
        }
      }
    })();
    
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // segments 변경 시 로그인 상태 다시 확인 제거
  // 무한 루프 방지를 위해 segments 변경 시 API 호출하지 않음
  // 초기화 시에만 한 번 호출하고, 이후에는 수동으로만 호출

  // 로그인 상태에 따라 라우팅
  useEffect(() => {
    if (!isInitialized || isLoggedIn === null) {
      return; // 초기화 전이거나 로그인 상태 확인 중
    }

    // segments가 아직 로드되지 않았을 때
    if (!segments || segments.length === 0 || segments[0] === undefined) {
      // 초기화가 완료되고 로그인 상태가 확정되었는데 segments가 없으면
      // 한 번은 라우팅을 시도 (초기 로드 시)
      if (!hasAttemptedInitialRoutingRef.current) {
        hasAttemptedInitialRoutingRef.current = true;
        console.log('[라우팅] 🚀 초기 라우팅 시도', { isLoggedIn });
        
        if (isLoggedIn) {
          console.log('[라우팅] 🏠 홈으로 이동 (segments 없음)');
          router.replace('/(tabs)');
        } else {
          console.log('[라우팅] 🔐 로그인 화면으로 이동 (segments 없음)');
          router.replace('/login');
        }
      } else {
        // 이미 시도했는데 segments가 여전히 없으면 로그만 출력 (너무 많이 출력 방지)
        if (prevSegmentsRef.current === undefined) {
          console.log('[라우팅] ⏸️ segments 로딩 중 (이미 라우팅 시도함)');
        }
      }
      return;
    }
    
    // segments가 로드되었으면 초기 라우팅 시도 플래그 리셋
    hasAttemptedInitialRoutingRef.current = false;
    
    const currentSegment = segments[0];
    const segmentsChanged = prevSegmentsRef.current !== currentSegment;
    prevSegmentsRef.current = currentSegment;
    
    // segments가 변경되었거나 초기 로드 시에만 상세 로그 출력
    if (segmentsChanged) {
      console.log('[라우팅] 체크', { 
        isInitialized, 
        isLoggedIn, 
        segments: currentSegment,
        currentScreen: segments.join('/'),
        segmentsChanged
      });
    }

    const inAuthGroup = segments[0] === '(tabs)';
    const isLoginScreen = segments[0] === 'login';
    const isSignupScreen = segments[0] === 'signup-additional';
    const isOtherScreen = !inAuthGroup && !isLoginScreen && !isSignupScreen;

    // segments가 변경되었을 때만 상세 로그 출력
    if (segmentsChanged) {
      console.log('[라우팅] 화면 상태', { 
        inAuthGroup, 
        isLoginScreen, 
        isSignupScreen, 
        isOtherScreen 
      });
    }

    // 이미 올바른 화면에 있으면 라우팅하지 않음 (불필요한 라우팅 방지)
    if (!isLoggedIn) {
      // 로그인되지 않았는데 탭 화면이나 다른 보호된 화면에 있으면 로그인 화면으로 이동
      if (inAuthGroup || isOtherScreen) {
        console.log('[라우팅] 🔐 로그인 화면으로 이동');
        router.replace('/login');
      } else if (segmentsChanged) {
        console.log('[라우팅] ✅ 이미 올바른 화면 (로그인/회원가입)');
      }
      // 이미 로그인 화면이나 회원가입 화면에 있으면 그대로 유지
    } else {
      // 로그인되어 있는데 로그인 화면에 있으면 홈으로 이동
      if (isLoginScreen) {
        console.log('[라우팅] 🏠 홈으로 이동');
        router.replace('/(tabs)');
      } else if (segmentsChanged) {
        console.log('[라우팅] ✅ 이미 올바른 화면 (홈)');
      }
      // 이미 탭 화면에 있으면 그대로 유지
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
      } else if (event?.type === 'login_success') {
        // 로그인 성공 이벤트 수신 시 로그인 상태 다시 확인
        console.log('[이벤트] 로그인 성공 이벤트 수신, 로그인 상태 재확인');
        checkLoginStatus();
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
    // 렌더링 로그는 최초 1번만 출력 (너무 많이 출력되는 것 방지)
    if (!hasLoggedBlackScreenRef.current) {
      console.log('[렌더링] ⏸️ 초기화 전 - 블랙 스크린', { 
        isInitialized, 
        isLoggedIn 
      });
      hasLoggedBlackScreenRef.current = true;
    }
    return null;
  }
  
  // 초기화 완료 후 첫 렌더링만 로그 출력
  if (!hasRenderedRef.current) {
    console.log('[렌더링] ✅ 화면 렌더링', { 
      isInitialized, 
      isLoggedIn, 
      segments: segments[0] 
    });
    hasRenderedRef.current = true;
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
