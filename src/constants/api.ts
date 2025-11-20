import { Platform } from 'react-native';

// 백엔드 API 기본 URL 설정
// 웹(PC): localhost 사용
// 모바일(iOS/Android): ngrok 사용 (두 기기가 같은 서버에 접속해야 하므로)
const LOCAL_API = 'http://localhost:3000/v1/api';
const NGROK_API = 'https://unkeeled-olympia-selfishly.ngrok-free.dev/v1/api';

// 환경 변수가 있으면 우선 사용, 없으면 플랫폼에 따라 자동 선택
export const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  (Platform.OS === 'web' ? LOCAL_API : NGROK_API);

// 소셜 로그인 엔드포인트
export const AUTH_ENDPOINTS = {
    google: `${API_BASE_URL}/auth/google`,
    kakao: `${API_BASE_URL}/auth/kakao`,
    naver: `${API_BASE_URL}/auth/naver`,
};

// 콜백 URL (앱 스킴 사용)
export const CALLBACK_URL = 'fatetry://auth/callback';

// 랭킹 엔드포인트
export const RANKING_ENDPOINTS = {
    overall: `${API_BASE_URL}/ranking/overall`,
    monthly: `${API_BASE_URL}/ranking/monthly`,
    local: `${API_BASE_URL}/ranking/local`,
};

// 사용자 좋아요 엔드포인트
export const getUserLikeEndpoint = (userId: number) => `${API_BASE_URL}/user/${userId}/like`;

