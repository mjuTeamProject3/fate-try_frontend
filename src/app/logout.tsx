import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_ENDPOINTS } from '@/constants/api';

export default function LogoutScreen() {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const confirmLogout = () => {
        Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
                text: '로그아웃', style: 'destructive', onPress: async () => {
                    await handleLogout();
                }
            }
        ]);
    };

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            const accessToken = await AsyncStorage.getItem('accessToken');

            // 백엔드 로그아웃 API 호출
            if (accessToken) {
                try {
                    const response = await fetch(AUTH_ENDPOINTS.signout, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        // 백엔드 호출 실패해도 클라이언트 측 로그아웃은 진행
                        console.warn('[로그아웃] 백엔드 API 호출 실패:', response.status);
                    } else {
                        const data = await response.json();
                        console.log('[로그아웃] 백엔드 로그아웃 성공:', data);
                    }
                } catch (apiError) {
                    // 네트워크 오류 등으로 백엔드 호출 실패해도 클라이언트 측 로그아웃은 진행
                    console.warn('[로그아웃] 백엔드 API 호출 중 오류:', apiError);
                }
            }

            // 로그인 정보 제거
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('loginProvider');
            await AsyncStorage.removeItem('isLoggedIn');
            await AsyncStorage.removeItem('hasCheckedSignup'); // 회원가입 체크 정보도 제거

            // 로그인 상태 업데이트를 위한 이벤트 발생 (선택적)
            try {
                // @ts-ignore
                const eventBus = (global as any).__APP_EVENT_BUS__;
                if (eventBus && eventBus.listeners) {
                    eventBus.listeners.forEach((listener: any) => {
                        if (typeof listener === 'function') {
                            listener({ type: 'logout' });
                        }
                    });
                }
            } catch (e) {
                // 이벤트 버스가 없어도 무시
            }

            // 성공 메시지 표시 후 로그인 화면으로 이동
            Alert.alert('완료', '로그아웃 되었습니다.', [
                {
                    text: '확인',
                    onPress: () => {
                        // 로그인 화면으로 완전히 이동 (모든 히스토리 제거)
                        router.replace('/login');
                    }
                }
            ]);
        } catch (error) {
            console.error('[로그아웃] 오류:', error);
            Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>로그아웃</Text>
            </View>

            <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, color: '#333', marginBottom: 16 }}>계정에서 로그아웃합니다.</Text>
                <TouchableOpacity 
                    onPress={confirmLogout} 
                    style={{ 
                        backgroundColor: isLoggingOut ? '#ccc' : '#E53935', 
                        padding: 14, 
                        borderRadius: 12, 
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                    }}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut && (
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    )}
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                        {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}


