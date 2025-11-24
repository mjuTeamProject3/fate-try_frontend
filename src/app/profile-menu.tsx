import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileMenuScreen() {
    const [isRealLogin, setIsRealLogin] = useState<boolean | null>(null);

    const getStatusBarHeight = () => {
        if (Platform.OS === 'android') {
            return StatusBar.currentHeight || 0;
        }
        return 0;
    };

    // 로그인 상태 확인 (실제 소셜 로그인인지 개발자 진입인지)
    useEffect(() => {
        const checkLoginType = async () => {
            try {
                const loginStatus = await AsyncStorage.getItem('isLoggedIn');
                const accessToken = await AsyncStorage.getItem('accessToken');
                
                // 실제 유효한 토큰인지 확인 (임시 토큰 제외)
                const isValidRealToken = accessToken !== null && 
                                       accessToken !== '' &&
                                       accessToken !== 'temp_token' && 
                                       !accessToken.startsWith('temp_login_token_') &&
                                       !accessToken.startsWith('dev_temp_token_') &&
                                       !accessToken.startsWith('temp_');
                
                const isReal = loginStatus === 'true' && isValidRealToken;
                setIsRealLogin(isReal);
            } catch (error) {
                console.error('로그인 상태 확인 오류:', error);
                setIsRealLogin(false);
            }
        };
        
        checkLoginType();
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
            <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingHorizontal: 16, 
                paddingTop: Platform.OS === 'ios' ? 0 : getStatusBarHeight() + 12,
                paddingBottom: 12, 
                borderBottomWidth: 1, 
                borderBottomColor: '#eee' 
            }}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>메뉴</Text>
            </View>

            <View style={{ padding: 16, gap: 12 }}>
                <TouchableOpacity onPress={() => router.push('/settings')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f7f7f7', borderRadius: 10 }}>
                    <Ionicons name="settings-outline" size={22} color="#333" />
                    <Text style={{ marginLeft: 10, fontSize: 16, color: '#333' }}>설정</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/help')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f7f7f7', borderRadius: 10 }}>
                    <Ionicons name="help-circle-outline" size={22} color="#333" />
                    <Text style={{ marginLeft: 10, fontSize: 16, color: '#333' }}>고객센터</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/account')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f7f7f7', borderRadius: 10 }}>
                    <Ionicons name="person-outline" size={22} color="#333" />
                    <Text style={{ marginLeft: 10, fontSize: 16, color: '#333' }}>계정관리</Text>
                </TouchableOpacity>

                {/* 실제 소셜 로그인이면 로그아웃, 개발자 진입이면 로그인 버튼 */}
                {isRealLogin === null ? null : isRealLogin ? (
                    // 실제 소셜 로그인 → 로그아웃 버튼 (빨간색)
                    <TouchableOpacity 
                        onPress={() => router.push('/logout')} 
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff1f1', borderRadius: 10 }}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#E53935" />
                        <Text style={{ marginLeft: 10, fontSize: 16, color: '#E53935' }}>로그아웃</Text>
                    </TouchableOpacity>
                ) : (
                    // 개발자 진입 → 로그인 버튼 (초록색)
                    <TouchableOpacity 
                        onPress={() => router.replace('/login')} 
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#e8f5e9', borderRadius: 10 }}
                    >
                        <Ionicons name="log-in-outline" size={22} color="#4CAF50" />
                        <Text style={{ marginLeft: 10, fontSize: 16, color: '#4CAF50', fontWeight: '600' }}>로그인</Text>
                    </TouchableOpacity>
                )}

                {/* 개발용: 토큰 초기화 버튼 (개발 모드에서만 표시) */}
                {__DEV__ && (
                <TouchableOpacity 
                    onPress={async () => {
                        try {
                            // 모든 로그인 및 사용자 관련 데이터 삭제
                            await AsyncStorage.multiRemove([
                                'accessToken',
                                'refreshToken',
                                'loginProvider',
                                'isLoggedIn',
                                'hasCheckedSignup',
                                'tempSkipSignup',
                                'userNickname',
                                'userBirthDate',
                                'userRegion',
                                'userGender'
                            ]);
                            console.log('✅ 토큰 초기화 완료, 로그인 화면으로 이동');
                            // 즉시 로그인 화면으로 이동
                            router.replace('/login');
                        } catch (error) {
                            console.error('토큰 초기화 오류:', error);
                            Alert.alert('오류', '토큰 초기화 중 문제가 발생했습니다.');
                        }
                    }} 
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff8e1', borderRadius: 10, borderWidth: 1, borderColor: '#ffc107' }}
                >
                    <Ionicons name="refresh-outline" size={22} color="#ff9800" />
                    <Text style={{ marginLeft: 10, fontSize: 16, color: '#ff9800', fontWeight: '600' }}>토큰 초기화 (개발용)</Text>
                </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}


