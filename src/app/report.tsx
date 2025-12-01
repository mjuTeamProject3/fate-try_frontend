import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/utils/socket';

export default function ReportScreen() {
    const params = useLocalSearchParams();
    const partnerId = params.partnerId ? Number(params.partnerId) : null;
    const partnerUsername = params.partnerUsername as string || '';
    const roomId = params.roomId as string || null;
    const isRandom = params.isRandom === 'true';
    
    const [userName, setUserName] = useState(partnerUsername);
    const [reason, setReason] = useState('');
    const [isReasonFocused, setIsReasonFocused] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const socketRef = useRef<Socket | null>(null);

    // Socket.io 연결 및 이벤트 리스너 설정
    useEffect(() => {
        if (!isRandom || !roomId) return;

        let mounted = true;

        const initSocketConnection = async () => {
            try {
                const socket = await getSocket();
                if (!socket) {
                    console.error('[신고] Socket 연결 실패');
                    return;
                }

                socketRef.current = socket;

                // 신고 응답 이벤트 리스너
                socket.on('user:reported', (data: { ok: boolean; error?: string }) => {
                    if (!mounted) return;
                    
                    if (data.ok) {
                        // 신고 성공 - 백엔드에서 자동으로 채팅 종료 처리하므로 여기서는 대기
                        // chat:ended 이벤트를 기다림
                        setIsSubmitting(false);
                    } else {
                        setIsSubmitting(false);
                        Alert.alert('신고 실패', data.error || '신고 처리 중 오류가 발생했습니다.');
                    }
                });

                // 채팅 종료 이벤트 리스너
                socket.on('chat:ended', (data: { reason: string }) => {
                    if (!mounted) return;
                    console.log('[신고] 채팅 종료:', data.reason);
                    Alert.alert(
                        '채팅 종료',
                        '상대의 신고로 인해 채팅이 종료되었습니다.',
                        [
                            {
                                text: '확인',
                                onPress: () => {
                                    router.replace('/(tabs)');
                                }
                            }
                        ]
                    );
                });
            } catch (error) {
                console.error('[신고] Socket 초기화 오류:', error);
            }
        };

        initSocketConnection();

        return () => {
            mounted = false;
            if (socketRef.current) {
                socketRef.current.off('user:reported');
                socketRef.current.off('chat:ended');
            }
        };
    }, [isRandom, roomId]);

    const submit = async () => {
        if (!reason.trim()) {
            Alert.alert('알림', '신고 사유를 입력해주세요.');
            return;
        }

        // 랜덤 채팅이고 Socket.io를 사용하는 경우
        if (isRandom && socketRef.current && roomId) {
            setIsSubmitting(true);
            try {
                socketRef.current.emit('user:report', { roomId, reason: reason.trim() });
                // 응답은 user:reported 이벤트로 받음
            } catch (error) {
                console.error('신고 제출 오류:', error);
                setIsSubmitting(false);
                Alert.alert('오류', '신고 제출 중 문제가 발생했습니다.');
            }
        } else {
            // 일반 신고 (현재는 Alert만 표시)
            Alert.alert('접수 완료', '신고가 접수되었습니다.');
            router.back();
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>사용자 신고</Text>
            </View>

            <View style={{ padding: 16 }}>
                <Text style={{ color: '#333', marginBottom: 8, fontWeight: '600' }}>사용자 이름</Text>
                <View style={{ 
                    borderWidth: 1, 
                    borderColor: '#eee', 
                    borderRadius: 10, 
                    padding: 12, 
                    marginBottom: 16,
                    backgroundColor: '#f5f5f5'
                }}>
                    <Text style={{ color: '#333', fontSize: 16 }}>
                        {userName || '사용자 이름 없음'}
                    </Text>
                </View>
                
                <Text style={{ color: '#333', marginBottom: 8, fontWeight: '600' }}>신고 사유</Text>
                <TextInput
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    placeholder={isReasonFocused ? "" : "신고 내용을 입력하세요"}
                    onFocus={() => setIsReasonFocused(true)}
                    onBlur={() => setIsReasonFocused(false)}
                    style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 10, minHeight: 120, padding: 12 }}
                />
                <TouchableOpacity 
                    onPress={submit} 
                    disabled={isSubmitting}
                    style={{ 
                        marginTop: 12, 
                        backgroundColor: isSubmitting ? '#ccc' : '#E53935', 
                        padding: 12, 
                        borderRadius: 12, 
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center'
                    }}
                >
                    {isSubmitting && (
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    )}
                    <Text style={{ color: '#fff', fontWeight: '700' }}>
                        {isSubmitting ? '신고 제출 중...' : '신고 제출'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}


