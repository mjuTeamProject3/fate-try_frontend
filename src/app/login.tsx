import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '@/styles/LoginStyles';
import { AUTH_ENDPOINTS, CALLBACK_URL } from '@/constants/api';

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
            
            // 리다이렉트 URL 생성 (백엔드에서 처리할 콜백 URL)
            // 백엔드 API 형식에 맞게 수정이 필요할 수 있습니다
            const redirectUrl = `${authUrl}?redirect_uri=${encodeURIComponent(CALLBACK_URL)}`;

            // WebBrowser로 OAuth 인증 시작
            const result = await WebBrowser.openAuthSessionAsync(
                redirectUrl,
                CALLBACK_URL
            );

            if (result.type === 'success') {
                // 성공 시 URL에서 토큰 추출
                const { url } = result;
                await handleAuthCallback(url, provider);
            } else if (result.type === 'cancel') {
                Alert.alert('로그인 취소', '로그인이 취소되었습니다.');
            } else {
                // dismiss 타입인 경우도 처리
                if (result.type !== 'dismiss') {
                    Alert.alert('로그인 실패', '로그인 중 오류가 발생했습니다.');
                }
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
            // URL에서 토큰 추출 (백엔드에서 전달하는 형식에 맞게 수정 필요)
            const parsedUrl = Linking.parse(url);
            
            // 다양한 가능한 토큰 파라미터 이름 처리
            const token = 
                (parsedUrl.queryParams?.token as string) ||
                (parsedUrl.queryParams?.access_token as string) ||
                (parsedUrl.queryParams?.accessToken as string);
            
            const refreshToken = 
                (parsedUrl.queryParams?.refresh_token as string) ||
                (parsedUrl.queryParams?.refreshToken as string);

            if (token) {
                // 토큰 저장
                await AsyncStorage.setItem('accessToken', token);
                if (refreshToken) {
                    await AsyncStorage.setItem('refreshToken', refreshToken);
                }
                await AsyncStorage.setItem('loginProvider', provider);
                await AsyncStorage.setItem('isLoggedIn', 'true');

                // 홈 화면으로 이동
                router.replace('/(tabs)');
            } else {
                // 토큰이 없는 경우, 백엔드에서 추가 정보를 요구할 수 있음
                // 또는 백엔드에서 직접 처리하는 경우를 위해 URL 전체를 백엔드로 전달
                // 실제 백엔드 구현에 따라 이 부분을 수정해야 할 수 있습니다
                console.log('콜백 URL:', url);
                Alert.alert('로그인 성공', '로그인에 성공했습니다.');
                await AsyncStorage.setItem('loginProvider', provider);
                await AsyncStorage.setItem('isLoggedIn', 'true');
                router.replace('/(tabs)');
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
            
            // 바로 홈 화면으로 이동
            router.replace('/(tabs)');
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

