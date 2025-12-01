import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Socket } from 'socket.io-client';
import styles from '@/styles/RandomChatStyles';
import { getSocket, disconnectSocket } from '@/utils/socket';

// 랜덤 채팅 대기 화면 컴포넌트
const RandomChatWaitingScreen = () => {
    // 경과 시간 상태
    const [elapsedTime, setElapsedTime] = useState(0);
    // 로딩 애니메이션을 위한 애니메이션 값
    const [rotationValue] = useState(new Animated.Value(0));
    const socketRef = useRef<Socket | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 경과 시간 업데이트 (1초마다)
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // 로딩 애니메이션 (회전)
    useEffect(() => {
        const rotateAnimation = Animated.loop(
            Animated.timing(rotationValue, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        );
        rotateAnimation.start();

        return () => rotateAnimation.stop();
    }, []);

    // 회전 각도 설정
    const rotateInterpolate = rotationValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Socket.io 연결 및 매칭 큐 참여
    useEffect(() => {
        let mounted = true;

        const initSocketConnection = async () => {
            try {
                const socket = await getSocket();
                if (!socket) {
                    console.error('[랜덤 채팅] Socket 연결 실패');
                    if (mounted) {
                        router.back();
                    }
                    return;
                }

                socketRef.current = socket;

                // 매칭 큐에 참여
                socket.emit('queue:join', { type: 'text' });
                console.log('[랜덤 채팅] 매칭 큐에 참여');

                // 매칭 성공 이벤트 리스너
                socket.on('match:found', (data: {
                    roomId: string;
                    userId: number;
                    partnerId: number;
                    partnerUsername: string | null;
                    compatibility: {
                        score: number | null;
                        finalScore: number | null;
                        verdict: string | null;
                    };
                    type: string;
                    compatibilityVisible: boolean;
                    isInitiator: boolean;
                }) => {
                    console.log('[랜덤 채팅] 매칭 성공:', data);
                    if (mounted) {
                        // 채팅방으로 이동
                        router.push({
                            pathname: '/chat-room',
                            params: {
                                roomId: data.roomId,
                                partnerId: String(data.partnerId),
                                partnerUsername: data.partnerUsername || '사용자',
                                compatibilityScore: data.compatibility.finalScore 
                                    ? String(data.compatibility.finalScore) 
                                    : data.compatibility.score 
                                    ? String(data.compatibility.score) 
                                    : '0',
                                verdict: data.compatibility.verdict || '',
                                isRandom: 'true',
                            }
                        });
                    }
                });

                // 대기 중 이벤트 리스너 (선택적)
                socket.on('queue:waiting', (data: { position: number; type: string }) => {
                    console.log('[랜덤 채팅] 대기 중:', data);
                });

                // 연결 에러 처리
                socket.on('connect_error', (error) => {
                    console.error('[랜덤 채팅] 연결 에러:', error);
                });
            } catch (error) {
                console.error('[랜덤 채팅] 초기화 오류:', error);
                if (mounted) {
                    router.back();
                }
            }
        };

        initSocketConnection();

        return () => {
            mounted = false;
            if (socketRef.current) {
                // 큐에서 나가기 (선택적 - 백엔드에서 disconnect 시 자동 처리)
                socketRef.current.off('match:found');
                socketRef.current.off('queue:waiting');
                socketRef.current.off('connect_error');
            }
        };
    }, []);

    // 취소 버튼 핸들러
    const handleCancel = () => {
        if (socketRef.current) {
            // 큐에서 나가기
            socketRef.current.emit('queue:leave', { type: 'text' });
        }
        router.back();
    };

    // 시간 포맷 함수 (초를 "N초 경과" 또는 "N분 N초 경과" 형식으로 변환)
    const formatTime = (seconds: number) => {
        if (seconds < 60) {
            return `${seconds}초 경과`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}분 ${remainingSeconds}초 경과`;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <View style={styles.headerSpacer} />
                <Text style={styles.headerTitle}>랜덤 채팅</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* 메인 콘텐츠 */}
            <View style={styles.mainContent}>
                {/* 로딩 애니메이션 */}
                <View style={styles.loadingContainer}>
                    <Animated.View 
                        style={[
                            styles.loadingCircle,
                            { transform: [{ rotate: rotateInterpolate }] }
                        ]}
                    >
                        <View style={styles.innerCircle}>
                            <Ionicons name="chatbubble-ellipses" size={40} color="#fff" />
                        </View>
                    </Animated.View>
                </View>

                {/* 상태 메시지 */}
                <Text style={styles.mainMessage}>채팅 상대방을 찾고 있어요</Text>
                <Text style={styles.subMessage}>곧 멋진 인연을 만나실 거예요 ✨</Text>
                
                {/* 경과 시간 */}
                <Text style={styles.elapsedTime}>{formatTime(elapsedTime)}</Text>

                {/* 버튼들 */}
                <View style={{ alignItems: 'center', width: '100%', paddingHorizontal: 20 }}>
                    {/* 취소 버튼 */}
                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={handleCancel}
                    >
                        <Ionicons name="close" size={20} color="#fff" />
                        <Text style={styles.cancelButtonText}>검색 취소</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default RandomChatWaitingScreen;
