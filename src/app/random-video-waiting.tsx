import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import styles from '@/styles/RandomVideoStyles';

const RandomVideoWaitingScreen = () => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [queueCount, setQueueCount] = useState(89);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
    const [rotationValue] = useState(new Animated.Value(0));

    // 경과 시간 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
            // 큐 카운트 랜덤하게 변경
            setQueueCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
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
    
    // 매칭 시뮬레이션 (5-10초 후 매칭)
    useEffect(() => {
        const matchTimer = setTimeout(() => {
            router.push('/random-video-room');
        }, Math.random() * 5000 + 5000); // 5-10초 랜덤

        return () => clearTimeout(matchTimer);
    }, []);

    const handleCancel = () => {
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
