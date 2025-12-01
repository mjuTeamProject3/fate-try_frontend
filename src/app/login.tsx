import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '@/styles/LoginStyles';
import { AUTH_ENDPOINTS, API_BASE_URL, USER_ENDPOINTS } from '@/constants/api';

// WebBrowser 완료 후 동작을 개선하기 위한 설정
WebBrowser.maybeCompleteAuthSession();

type SocialProvider = 'google' | 'kakao' | 'naver';

// 한국 지역 목록
const REGIONS = [
    '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
    '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원도',
    '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
];

// 성별 옵션
const GENDERS = [
    { label: '남성', value: 'male' },
    { label: '여성', value: 'female' },
    { label: '기타', value: 'other' }
];

export default function LoginScreen() {
    const [nickname, setNickname] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [region, setRegion] = useState('');
    const [gender, setGender] = useState('');
    const [showRegionPicker, setShowRegionPicker] = useState(false);
    const [showAdditionalInfo, setShowAdditionalInfo] = useState(true); // 기본값: true (신규 사용자)
    const [isCheckingUser, setIsCheckingUser] = useState(true); // 사용자 상태 확인 중
    const [loading, setLoading] = useState<SocialProvider | null>(null);

    // 사용자 상태 확인 (기존 사용자/신규 사용자 구분)
    useEffect(() => {
        const checkUserStatus = async () => {
            setIsCheckingUser(true);
            
            try {
                const accessToken = await AsyncStorage.getItem('accessToken');
                
                // 토큰이 없거나 임시 토큰이면 신규 사용자로 간주
                if (!accessToken || accessToken.startsWith('temp_')) {
                    setShowAdditionalInfo(true);
                    setIsCheckingUser(false);
                    return;
                }
                
                // 서버에 사용자 프로필 조회
                try {
                    const response = await fetch(USER_ENDPOINTS.getProfile, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        const user = data.success;
                        
                        // 프로필이 완성되어 있는지 확인
                        if (user.birthdate && user.location && user.username) {
                            // 기존 사용자 → 추가 정보 입력 숨김
                            setShowAdditionalInfo(false);
                            console.log('✅ 기존 사용자 확인, 추가 정보 입력 숨김');
                        } else {
                            // 프로필 미완성 → 추가 정보 입력 표시
                            setShowAdditionalInfo(true);
                            console.log('📝 프로필 미완성, 추가 정보 입력 표시');
                        }
                    } else {
                        // 토큰 무효 → 추가 정보 입력 표시
                        setShowAdditionalInfo(true);
                    }
                } catch (error) {
                    console.error('프로필 조회 실패:', error);
                    setShowAdditionalInfo(true);
                }
            } catch (error) {
                console.error('사용자 상태 확인 오류:', error);
                setShowAdditionalInfo(true);
            } finally {
                setIsCheckingUser(false);
            }
        };
        
        checkUserStatus();
    }, []);

    // 생년월일 유효성 검사
    const validateBirthDate = (date: string) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return false;
        }
        
        const [year, month, day] = date.split('-').map(Number);
        const inputDate = new Date(year, month - 1, day);
        
        if (inputDate.getFullYear() !== year || 
            inputDate.getMonth() !== month - 1 || 
            inputDate.getDate() !== day) {
            return false;
        }

        const today = new Date();
        const age = today.getFullYear() - year - (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day) ? 1 : 0);
        
        if (age < 14 || age > 100) {
            return false;
        }

        return true;
    };

    // 소셜 로그인 처리 함수
    const handleSocialLogin = async (provider: SocialProvider) => {
        // 기존 사용자는 추가 정보 입력 없이 바로 소셜 로그인
        if (!showAdditionalInfo) {
            try {
                setLoading(provider);
                
                // state에 platform만 포함 (추가 정보 없음)
                const stateInfo = {
                    platform: 'mobile',
                };
                const stateBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(stateInfo))));
                const authUrl = `${AUTH_ENDPOINTS[provider]}?state=${encodeURIComponent(stateBase64)}`;
                
                const deepLinkCallback = 'fatetry://auth/callback';
                
                console.log('🔐 기존 사용자 소셜 로그인 시작:', provider);
                console.log('📤 전송할 State:', stateInfo);
                console.log('📤 전송할 State (Base64):', stateBase64);
                console.log('📤 최종 Auth URL:', authUrl);
                
                const result = await WebBrowser.openAuthSessionAsync(
                    authUrl,
                    deepLinkCallback
                );
                
                if (result.type === 'success') {
                    const { url } = result;
                    console.log('✅ WebBrowser 콜백 성공:', url);
                    await handleAuthCallback(url, provider);
                } else if (result.type === 'cancel') {
                    Alert.alert('로그인 취소', '로그인이 취소되었습니다.');
                } else {
                    Alert.alert('로그인 실패', '로그인 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error(`${provider} 로그인 오류:`, error);
                Alert.alert('오류', '로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
            } finally {
                setLoading(null);
            }
            return;
        }
        
        // 신규 사용자: 추가 정보 유효성 검사
        if (!nickname.trim()) {
            Alert.alert('입력 오류', '닉네임을 입력해주세요.');
            return;
        }

        if (!birthDate.trim()) {
            Alert.alert('입력 오류', '생년월일을 입력해주세요.');
            return;
        }

        if (!validateBirthDate(birthDate)) {
            Alert.alert('입력 오류', '올바른 생년월일을 입력해주세요. (YYYY-MM-DD 형식, 만 14세 이상)');
            return;
        }

        if (!region) {
            Alert.alert('입력 오류', '지역을 선택해주세요.');
            return;
        }

        if (!gender) {
            Alert.alert('입력 오류', '성별을 선택해주세요.');
            return;
        }

        try {
            setLoading(provider);

            // 추가 정보를 state에 포함
            const additionalInfo = {
                platform: 'mobile',
                nickname: nickname.trim(),
                birthdate: birthDate.trim(),
                location: region,
                gender: gender === 'male' ? '남성' : gender === 'female' ? '여성' : '기타'
            };

            // base64 인코딩 (React Native용)
            const stateJson = JSON.stringify(additionalInfo);
            const stateBase64 = btoa(unescape(encodeURIComponent(stateJson)));

            // 백엔드 OAuth 시작 URL (state 파라미터 포함)
            const authUrl = `${AUTH_ENDPOINTS[provider]}?state=${encodeURIComponent(stateBase64)}`;
            
            // 딥링크 스킴을 콜백으로 사용
            const deepLinkCallback = 'fatetry://auth/callback';

            console.log('🔐 신규 사용자 소셜 로그인 시작:', provider);
            console.log('📝 추가 정보 포함:', additionalInfo);
            console.log('📤 전송할 State (Base64):', stateBase64);
            console.log('📤 최종 Auth URL:', authUrl);

            // WebBrowser로 OAuth 인증 시작
            const result = await WebBrowser.openAuthSessionAsync(
                authUrl,
                deepLinkCallback
            );

            if (result.type === 'success') {
                // 성공 시 URL에서 토큰 추출
                const { url } = result;
                console.log('✅ WebBrowser 콜백 성공:', url);
                await handleAuthCallback(url, provider);
            } else if (result.type === 'cancel') {
                Alert.alert('로그인 취소', '로그인이 취소되었습니다.');
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
            
            // 딥링크 URL에서 토큰 추출
            const accessToken = 
                (parsedUrl.queryParams?.accessToken as string) ||
                (parsedUrl.queryParams?.access_token as string) ||
                (parsedUrl.queryParams?.token as string);
            
            const refreshToken = 
                (parsedUrl.queryParams?.refreshToken as string) ||
                (parsedUrl.queryParams?.refresh_token as string);
            
            const profileComplete = parsedUrl.queryParams?.profileComplete as string;

            if (accessToken) {
                // 토큰 저장
                await AsyncStorage.setItem('accessToken', accessToken);
                if (refreshToken) {
                    await AsyncStorage.setItem('refreshToken', refreshToken);
                }
                await AsyncStorage.setItem('loginProvider', provider);
                await AsyncStorage.setItem('isLoggedIn', 'true');
                
                // 추가 정보는 이미 입력했으므로 항상 홈 화면으로
                console.log('✅ 로그인 성공, 홈 화면으로 이동');
                router.replace('/(tabs)');
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

    // 소셜 로그인 버튼 활성화 여부
    const isFormValid = !showAdditionalInfo || (nickname.trim() && birthDate.trim() && region && gender);

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
                style={[
                    styles.socialButton, 
                    buttonStyle,
                    !isFormValid && styles.socialButtonDisabled
                ]}
                onPress={() => handleSocialLogin(provider)}
                disabled={loading !== null || !isFormValid}
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
        <SafeAreaView style={styles.container}>
            {isCheckingUser ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>사용자 정보 확인 중...</Text>
                </View>
            ) : (
                <>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            {showAdditionalInfo ? '회원가입' : '로그인'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {showAdditionalInfo 
                                ? '서비스를 이용하기 위해 정보를 입력해주세요'
                                : '소셜 로그인으로 간편하게 로그인하세요'}
                        </Text>
                    </View>

                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* 추가 정보 입력 필드들 - showAdditionalInfo가 true일 때만 표시 */}
                        {showAdditionalInfo && (
                            <>
                                {/* 닉네임 입력 */}
                                <View style={styles.section}>
                    <Text style={styles.label}>
                        닉네임 <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={nickname}
                        onChangeText={setNickname}
                        placeholder="닉네임을 입력하세요 (2-20자)"
                        placeholderTextColor="#999"
                        maxLength={20}
                    />
                </View>

                {/* 생년월일 입력 */}
                <View style={styles.section}>
                    <Text style={styles.label}>
                        생년월일 <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={birthDate}
                        onChangeText={(text) => {
                            // YYYY-MM-DD 형식으로 자동 포맷팅
                            let formatted = text.replace(/[^\d]/g, '');
                            if (formatted.length >= 5) {
                                formatted = formatted.slice(0, 4) + '-' + formatted.slice(4);
                            }
                            if (formatted.length >= 8) {
                                formatted = formatted.slice(0, 7) + '-' + formatted.slice(7, 9);
                            }
                            setBirthDate(formatted);
                        }}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        maxLength={10}
                    />
                    <Text style={styles.hintText}>만 14세 이상만 가입 가능합니다</Text>
                </View>

                {/* 지역 선택 */}
                <View style={styles.section}>
                    <Text style={styles.label}>
                        지역 <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowRegionPicker(!showRegionPicker)}
                    >
                        <Text style={[styles.pickerButtonText, !region && styles.pickerButtonTextPlaceholder]}>
                            {region || '지역을 선택하세요'}
                        </Text>
                        <Ionicons 
                            name={showRegionPicker ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#666" 
                        />
                    </TouchableOpacity>
                    {showRegionPicker && (
                        <View style={styles.pickerOptions}>
                            <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                                {REGIONS.map((reg) => (
                                    <TouchableOpacity
                                        key={reg}
                                        style={[
                                            styles.pickerOption,
                                            region === reg && styles.pickerOptionSelected
                                        ]}
                                        onPress={() => {
                                            setRegion(reg);
                                            setShowRegionPicker(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.pickerOptionText,
                                            region === reg && styles.pickerOptionTextSelected
                                        ]}>
                                            {reg}
                                        </Text>
                                        {region === reg && (
                                            <Ionicons name="checkmark" size={20} color="#4CAF50" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                                {/* 성별 선택 */}
                                <View style={styles.section}>
                                    <Text style={styles.label}>
                                        성별 <Text style={styles.required}>*</Text>
                                    </Text>
                                    <View style={styles.genderContainer}>
                                        {GENDERS.map((g) => (
                                            <TouchableOpacity
                                                key={g.value}
                                                style={[
                                                    styles.genderButton,
                                                    gender === g.value && styles.genderButtonSelected
                                                ]}
                                                onPress={() => setGender(g.value)}
                                            >
                                                <Text style={[
                                                    styles.genderButtonText,
                                                    gender === g.value && styles.genderButtonTextSelected
                                                ]}>
                                                    {g.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </>
                        )}
                    </ScrollView>

                    {/* 소셜 로그인 버튼들 */}
                    <View style={styles.footer}>
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
                </>
            )}
        </SafeAreaView>
    );
}

