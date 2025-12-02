/**
 * Agora App ID 설정
 * 
 * 사용 방법:
 * 1. Agora 콘솔(https://console.agora.io)에서 프로젝트 생성
 * 2. App ID 발급
 * 3. 아래 YOUR_AGORA_APP_ID_HERE를 발급받은 App ID로 변경
 */
export const AGORA_APP_ID = '7ed1d2c051f14624a4b23b9a78a49ce2';

/**
 * Agora 설정
 */
export const AGORA_CONFIG = {
  appId: AGORA_APP_ID,
  // 개발 환경에서는 App ID만 사용
  // 프로덕션 환경에서는 Token 서버 필요
};

