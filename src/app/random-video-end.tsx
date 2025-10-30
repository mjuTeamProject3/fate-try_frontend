import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import styles from '@/styles/RandomVideoEndStyles';

const RandomVideoEndScreen = () => {
    const handleReport = () => {
        router.push('/report');
    };

    const handleMatchAgain = () => {
        router.push('/random-video-waiting');
    };

    const handleGoHome = () => {
        router.push('/(tabs)');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>랜덤 영상</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* 메인 콘텐츠 */}
            <View style={styles.mainContent}>
                {/* 비디오 아이콘 */}
                <View style={styles.videoIconContainer}>
                    <View style={styles.videoIcon}>
                        <Ionicons name="videocam" size={60} color="#666" />
                    </View>
                </View>

                {/* 메시지 */}
                <Text style={styles.mainMessage}>영상 통화가 종료되었습니다</Text>
                <Text style={styles.subMessage}>햇살왕자님과의 통화가 끝났어요</Text>

                {/* 버튼들 */}
                <View style={styles.buttonContainer}>
                    {/* 신고하기 버튼 */}
                    <TouchableOpacity 
                        style={styles.reportButton}
                        onPress={handleReport}
                    >
                        <Ionicons name="flag" size={20} color="#FF9800" />
                        <Text style={styles.reportButtonText}>신고하기</Text>
                    </TouchableOpacity>

                    {/* 다시 매칭하기 버튼 */}
                    <TouchableOpacity 
                        style={styles.matchAgainButton}
                        onPress={handleMatchAgain}
                    >
                        <Ionicons name="videocam" size={20} color="#fff" />
                        <Text style={styles.matchAgainButtonText}>다시 매칭하기</Text>
                    </TouchableOpacity>

                    {/* 홈으로 돌아가기 버튼 */}
                    <TouchableOpacity 
                        style={styles.goHomeButton}
                        onPress={handleGoHome}
                    >
                        <Text style={styles.goHomeButtonText}>홈으로 돌아가기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default RandomVideoEndScreen;
