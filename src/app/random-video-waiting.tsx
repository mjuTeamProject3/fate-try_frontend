import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/utils/socket';
import styles from '@/styles/RandomVideoStyles';

const RandomVideoWaitingScreen = () => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [queueCount, setQueueCount] = useState(0);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
    const [rotationValue] = useState(new Animated.Value(0));
    const socketRef = useRef<Socket | null>(null);

    // 경과 시간 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // 로딩 애니메이션
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
                    console.error('[랜덤 영상] Socket 연결 실패');
                    if (mounted) {
                        router.back();
                    }
                    return;
                }

                socketRef.current = socket;

                // 매칭 큐에 참여
                socket.emit('queue:join', { type: 'video' });
                console.log('[랜덤 영상] 매칭 큐에 참여');

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
                    console.log('[랜덤 영상] 매칭 성공:', data);
                    if (mounted) {
                        // 영상통화방으로 이동
                        router.push({
                            pathname: '/random-video-room',
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
                                isInitiator: data.isInitiator ? 'true' : 'false',
                            }
                        });
                    }
                });

                // 대기 중 이벤트 리스너
                socket.on('queue:waiting', (data: { position: number; type: string }) => {
                    console.log('[랜덤 영상] 대기 중:', data);
                    if (mounted && data.position !== undefined) {
                        setQueueCount(data.position);
                    }
                });

                // 연결 에러 처리
                socket.on('connect_error', (error) => {
                    console.error('[랜덤 영상] 연결 에러:', error);
                });
            } catch (error) {
                console.error('[랜덤 영상] 초기화 오류:', error);
                if (mounted) {
                    router.back();
                }
            }
        };

        initSocketConnection();

        return () => {
            mounted = false;
            if (socketRef.current) {
                socketRef.current.off('match:found');
                socketRef.current.off('queue:waiting');
                socketRef.current.off('connect_error');
                // 큐에서 나가기
                socketRef.current.emit('queue:leave', { type: 'video' });
            }
        };
    }, []);

    const handleCancel = async () => {
        // 큐에서 나가기
        if (socketRef.current) {
            socketRef.current.emit('queue:leave', { type: 'video' });
        }
        router.back();
    };

    const toggleCamera = () => {
        setIsCameraOn(prev => !prev);
    };

    const toggleMicrophone = () => {
        setIsMicrophoneOn(prev => !prev);
    };

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
                <Text style={styles.headerTitle}>랜덤 영상</Text>
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
                            <Ionicons name="videocam" size={40} color="#fff" />
                        </View>
                    </Animated.View>
                </View>

                {/* 상태 메시지 */}
                <Text style={styles.mainMessage}>영상 상대방을 찾고 있어요</Text>
                <Text style={styles.subMessage}>카메라와 마이크를 준비해주세요</Text>
                
                {/* 경과 시간 */}
                <Text style={styles.elapsedTime}>{formatTime(elapsedTime)}</Text>

                {/* 큐 정보 */}
                <View style={styles.queueInfo}>
                    <Ionicons name="people" size={20} color="#4CAF50" />
                    <Text style={styles.queueText}>영상 대기 중: {queueCount}명</Text>
                </View>

                {/* 진행률 바 */}
                <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                        <View 
                            style={[
                                styles.progressFill, 
                                { width: `${Math.min((elapsedTime / 10) * 100, 100)}%` }
                            ]} 
                        />
                    </View>
                </View>

                {/* 마이크/카메라 컨트롤 */}
                <View style={styles.controlsContainer}>
                    <TouchableOpacity 
                        style={[styles.controlButton, !isMicrophoneOn && styles.controlButtonOff]}
                        onPress={toggleMicrophone}
                    >
                        <Ionicons 
                            name={isMicrophoneOn ? "mic" : "mic-off"} 
                            size={24} 
                            color={isMicrophoneOn ? "#4CAF50" : "#999"} 
                        />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.controlButton, !isCameraOn && styles.controlButtonOff]}
                        onPress={toggleCamera}
                    >
                        <Ionicons 
                            name={isCameraOn ? "videocam" : "videocam-off"} 
                            size={24} 
                            color={isCameraOn ? "#4CAF50" : "#999"} 
                        />
                    </TouchableOpacity>
                </View>

                {/* 취소 버튼 */}
                <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCancel}
                >
                    <Ionicons name="close" size={20} color="#fff" />
                    <Text style={styles.cancelButtonText}>검색 취소</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default RandomVideoWaitingScreen;
