import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '@/styles/LoginStyles';
import { AUTH_ENDPOINTS, API_BASE_URL } from '@/constants/api';

// WebBrowser 완료 후 동작을 개선하기 위한 설정
WebBrowser.maybeCompleteAuthSession();

type SocialProvider = 'google' | 'kakao' | 'naver';

export default function LoginScreen() {
    const [loading, setLoading] = useState<SocialProvider | null>(null);

    // 소셜 로그인 처리 함수
    const handleSocialLogin = async (provider: SocialProvider) => {
        try {
            setLoading(provider);

            // 백엔드 OAuth 시작 URL
            const authUrl = AUTH_ENDPOINTS[provider];
            
            // 백엔드가 HTML 페이지로 리다이렉트하므로, HTML 페이지 URL을 콜백으로 사용
            // ngrok URL 또는 localhost에 따라 동적으로 설정
            const baseUrl = API_BASE_URL.replace('/v1/api', ''); // API_BASE_URL에서 /v1/api 제거
            const htmlCallbackUrl = `${baseUrl}/auth/callback`;

            // WebBrowser로 OAuth 인증 시작
            // HTML 페이지 URL을 콜백으로 사용 (백엔드가 HTML 페이지로 리다이렉트함)
            const result = await WebBrowser.openAuthSessionAsync(
                authUrl,
                htmlCallbackUrl
            );

            if (result.type === 'success') {
                // 성공 시 URL에서 토큰 추출
                const { url } = result;
                console.log('✅ WebBrowser 콜백 성공:', url);
                await handleAuthCallback(url, provider);
            } else if (result.type === 'cancel') {
                Alert.alert('로그인 취소', '로그인이 취소되었습니다.');
            } else if (result.type === 'dismiss') {
                // dismiss 타입: HTML 페이지가 열려있지만 WebBrowser가 자동으로 감지하지 못한 경우
                // HTML 페이지가 열려있을 수 있으므로, 사용자에게 수동으로 닫도록 안내
                console.log('⚠️ WebBrowser dismiss - HTML 페이지가 열려있을 수 있음');
                Alert.alert(
                    '로그인 완료',
                    '로그인이 완료되었습니다. 브라우저를 닫고 앱으로 돌아가주세요.'
                );
            } else {
                Alert.alert('로그인 실패', '로그인 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error(`${provider} 로그인 오류:`, error);
            Alert.alert('오류', '로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(null);
        }
    };

    // 인증 콜백 처리
    const handleAuthCallback = async (url: string, provider: SocialProvider) => {
        try {
            console.log('🔗 콜백 URL 수신:', url);
            
            // URL에서 토큰 추출
            const parsedUrl = Linking.parse(url);
            
            // HTML 페이지 URL에서 토큰 추출 (백엔드가 HTML 페이지로 리다이렉트함)
            const accessToken = 
                (parsedUrl.queryParams?.accessToken as string) ||
                (parsedUrl.queryParams?.access_token as string) ||
                (parsedUrl.queryParams?.token as string);
            
            const refreshToken = 
                (parsedUrl.queryParams?.refreshToken as string) ||
                (parsedUrl.queryParams?.refresh_token as string);
            
            const profileComplete = parsedUrl.queryParams?.profileComplete as string;
            const missingFields = parsedUrl.queryParams?.missingFields as string;

            if (accessToken) {
                // 토큰 저장
                await AsyncStorage.setItem('accessToken', accessToken);
                if (refreshToken) {
                    await AsyncStorage.setItem('refreshToken', refreshToken);
                }
                await AsyncStorage.setItem('loginProvider', provider);
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
            } else {
                // 토큰이 없는 경우
                console.log('⚠️ 토큰을 받지 못했습니다. 콜백 URL:', url);
                Alert.alert('로그인 실패', '토큰을 받지 못했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('인증 콜백 처리 오류:', error);
            Alert.alert('오류', '인증 처리 중 문제가 발생했습니다.');
        }
    };

    // 임시로 홈 화면으로 이동하는 함수
    const handleTempLogin = async () => {
        try {
            // 임시 로그인 상태 설정 (temp_token이 아닌 다른 값 사용)
            await AsyncStorage.setItem('isLoggedIn', 'true');
            await AsyncStorage.setItem('accessToken', 'temp_login_token_' + Date.now());
            await AsyncStorage.setItem('loginProvider', 'temp');
            
            // 개발 중: 항상 추가정보 페이지로 이동 (기록 저장하지 않음)
            router.replace('/signup-additional');
        } catch (error) {
            console.error('임시 로그인 오류:', error);
        }
    };

    // 소셜 로그인 버튼 렌더링
    const renderSocialButton = (
        provider: SocialProvider,
        label: string,
        logoUrl: string,
        buttonStyle: any,
        textStyle: any
    ) => {
        const isLoading = loading === provider;

        return (
            <TouchableOpacity
                style={[styles.socialButton, buttonStyle]}
                onPress={() => handleSocialLogin(provider)}
                disabled={loading !== null}
                activeOpacity={0.8}
            >
                {isLoading ? (
                    <ActivityIndicator 
                        size="small" 
                        color={provider === 'naver' ? '#fff' : '#333'} 
                    />
                ) : (
                    <>
                        <View style={styles.iconContainer}>
                            <Image 
                                source={{ uri: logoUrl }}
                                style={styles.logoImage}
                                onError={(e) => {
                                    // 이미지 로드 실패 시 조용히 처리
                                }}
                            />
                        </View>
                        <Text style={[styles.buttonText, textStyle]}>{label}</Text>
                    </>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* 로고 영역 */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>fate:try</Text>
                    <Text style={styles.subtitle}>
                        소셜 로그인으로 간편하게 시작하세요
                    </Text>
                </View>

                {/* 소셜 로그인 버튼들 */}
                <View style={styles.buttonContainer}>
                    {/* 구글 로그인 */}
                    {renderSocialButton(
                        'google',
                        'Google로 로그인',
                        'https://www.google.com/favicon.ico',
                        styles.googleButton,
                        styles.googleButtonText
                    )}

                    {/* 카카오 로그인 */}
                    {renderSocialButton(
                        'kakao',
                        '카카오로 로그인',
                        'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png',
                        styles.kakaoButton,
                        styles.kakaoButtonText
                    )}

                    {/* 네이버 로그인 */}
                    {renderSocialButton(
                        'naver',
                        '네이버로 로그인',
                        'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyMTA5MTVfMTkw%2FMDAxNjMxNjk2MzM4NjYy.afH1qY-8zg4NeCiRF7xkXpXwRRRQ3rhpyphINwDIOSwg.H-lX7EaH3gynXGNyccJk6bTkAd_JsDDMziPbEVtJzcgg.PNG.nd1126%2F20210915_175842.png&type=sc960_832',
                        styles.naverButton,
                        styles.naverButtonText
                    )}
                </View>

                {/* 임시 홈 화면 이동 버튼 (최종 제거 예정) */}
                <TouchableOpacity 
                    style={styles.tempButton}
                    onPress={handleTempLogin}
                >
                    <Text style={styles.tempButtonText}>임시로 홈 화면 이동</Text>
                </TouchableOpacity>
            </View>

            {/* 로딩 오버레이 */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>
                        {loading === 'google' && 'Google 로그인 중...'}
                        {loading === 'kakao' && '카카오 로그인 중...'}
                        {loading === 'naver' && '네이버 로그인 중...'}
                    </Text>
                </View>
            )}
        </View>
    );
}

