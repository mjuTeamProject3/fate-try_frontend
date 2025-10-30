import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import styles from '@/styles/RandomChatStyles';

// 랜덤 채팅 대기 화면 컴포넌트
const RandomChatWaitingScreen = () => {
    // 경과 시간 상태
    const [elapsedTime, setElapsedTime] = useState(0);
    // 대기 중인 사용자 수
    const [queueCount, setQueueCount] = useState(142);
    // 로딩 애니메이션을 위한 애니메이션 값
    const [rotationValue] = useState(new Animated.Value(0));

    // 경과 시간 업데이트 (1초마다)
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
            // 큐 카운트를 랜덤하게 변경 (실제로는 서버에서 받아와야 함)
            setQueueCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
        }, 1000);

        return () => clearInterval(timer);
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

    // 매칭 시뮬레이션 (3-8초 후 매칭)
    useEffect(() => {
        const matchTimer = setTimeout(() => {
            // 랜덤 상대방 정보 생성
            const randomNames = ['별빛소녀', '햇살왕자', '달빛요정', '바람처럼', '구름위를'];
            const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
            
            // 채팅방으로 이동하면서 상대방 정보 전달
            router.push({
                pathname: '/chat-room',
                params: {
                    name: randomName,
                    avatar: randomName.substring(0, 2),
                    isRandom: 'true' // 랜덤 채팅임을 표시
                }
            });
        }, Math.random() * 5000 + 3000); // 3-8초 랜덤

        return () => clearTimeout(matchTimer);
    }, []);

    // 취소 버튼 핸들러
    const handleCancel = () => {
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

                {/* 큐 정보 */}
                <View style={styles.queueInfo}>
                    <Ionicons name="people" size={20} color="#4CAF50" />
                    <Text style={styles.queueText}>채팅 대기 중: {queueCount}명</Text>
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



