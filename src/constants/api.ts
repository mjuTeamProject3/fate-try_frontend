import { Platform } from 'react-native';

// 백엔드 API 기본 URL 설정
// 웹(PC): localhost 사용
// 모바일(iOS/Android): 환경 변수 또는 ngrok 사용
const LOCAL_API = 'http://localhost:3000/v1/api';

// 환경 변수가 있으면 우선 사용, 없으면 플랫폼에 따라 자동 선택
export const API_BASE_URL = (() => {
  // 1. 환경 변수가 있으면 우선 사용 (가장 우선순위 높음)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // 2. 웹이면 localhost
  if (Platform.OS === 'web') {
    return LOCAL_API;
  }
  
  // 3. 모바일: 기본값은 ngrok URL
  // ⚠️ ngrok 734 오류 발생 시:
  // - ngrok을 다시 실행하고 새로운 URL을 환경 변수로 설정
  // - 또는 PC의 로컬 IP 사용 (같은 Wi-Fi에 연결된 경우)
  // - 예: EXPO_PUBLIC_API_URL=http://192.168.0.100:3000/v1/api
  const defaultNgrokUrl = 'https://fatetry.ngrok.app/v1/api';
  
  // 개발 중 정보 (경고 제거 - ngrok이 정상 작동 중이면 불필요)
  if (__DEV__) {
    console.log('[API] 📡 API Base URL:', defaultNgrokUrl);
  }
  
  return defaultNgrokUrl;
})();

// 소셜 로그인 엔드포인트
export const AUTH_ENDPOINTS = {
    google: `${API_BASE_URL}/auth/google`,
    kakao: `${API_BASE_URL}/auth/kakao`,
    naver: `${API_BASE_URL}/auth/naver`,
    signout: `${API_BASE_URL}/auth/signout`, // 로그아웃
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

// 사용자 프로필 엔드포인트
export const USER_ENDPOINTS = {
    getProfile: `${API_BASE_URL}/user`,  // 본인 프로필 조회
    getProfileById: (userId: number) => `${API_BASE_URL}/user/${userId}`,  // 타인 프로필 조회
    updateProfile: `${API_BASE_URL}/user/profile`,  // 프로필 업데이트
    searchUsers: (query: string, limit?: number, offset?: number) => {
        const params = new URLSearchParams();
        params.append('q', query);
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());
        return `${API_BASE_URL}/user/search?${params.toString()}`;
    },
    like: (userId: number) => `${API_BASE_URL}/user/${userId}/like`,
    unlike: (userId: number) => `${API_BASE_URL}/user/${userId}/like`,
};

// 친구 목록 엔드포인트
export const FRIEND_ENDPOINTS = {
    getFriends: `${API_BASE_URL}/friend`,
    request: (userId: number) => `${API_BASE_URL}/friend/request/${userId}`,
    accept: (userId: number) => `${API_BASE_URL}/friend/accept/${userId}`,
    decline: (userId: number) => `${API_BASE_URL}/friend/decline/${userId}`,
};

// 채팅 엔드포인트
export const CHAT_ENDPOINTS = {
    getFriendChats: `${API_BASE_URL}/chat/friends`, // 친구 채팅방 목록 조회
    getMessages: (partnerId: number) => `${API_BASE_URL}/message/${partnerId}`, // 친구와의 메시지 조회
    sendMessage: `${API_BASE_URL}/message`, // 메시지 전송
};

// 알림 엔드포인트
export const NOTIFICATION_ENDPOINTS = {
    getNotifications: (params?: { type?: string; processed?: boolean; isRead?: boolean; take?: number }) => {
        const url = new URL(`${API_BASE_URL}/notification`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    // take 파라미터는 숫자로 변환하여 전달
                    if (key === 'take' && typeof value === 'number') {
                        url.searchParams.append(key, value.toString());
                    } else {
                        url.searchParams.append(key, String(value));
                    }
                }
            });
        }
        return url.toString();
    },
    readNotification: (notifId: number) => `${API_BASE_URL}/notification/${notifId}/read`,
    processFriendRequest: (notifId: number) => `${API_BASE_URL}/notification/${notifId}/friend-request/process`,
};

// 이미지 업로드 엔드포인트
export const UPLOAD_ENDPOINTS = {
    image: `${API_BASE_URL}/upload/image`,
};

// 사주/운세 엔드포인트
export const FORTUNE_ENDPOINTS = {
    calculate: `${API_BASE_URL}/fortune/calculate`, // 사주 계산
    compatibility: `${API_BASE_URL}/fortune/compatibility`, // 궁합 분석
};

// 안전한 JSON 파싱 헬퍼 함수
export const safeJsonParse = async (response: Response): Promise<any> => {
    const contentType = response.headers.get('content-type');
    
    // Content-Type이 JSON이 아니면 텍스트로 반환
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but got ${contentType}: ${text.substring(0, 100)}`);
    }
    
    try {
        const text = await response.text();
        if (!text) {
            return null;
        }
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
};

