// 백엔드 API 기본 URL 설정
// 실제 백엔드 서버 URL로 변경해주세요
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// 소셜 로그인 엔드포인트
export const AUTH_ENDPOINTS = {
    google: `${API_BASE_URL}/auth/google`,
    kakao: `${API_BASE_URL}/auth/kakao`,
    naver: `${API_BASE_URL}/auth/naver`,
};

// 콜백 URL (앱 스킴 사용)
export const CALLBACK_URL = 'fatetry://auth/callback';

