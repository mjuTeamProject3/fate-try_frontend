import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '@/styles/RandomVideoRoomStyles';
import ImageModal from '@/components/ImageModal';

// 프로필 데이터 타입 정의
interface ProfileData {
    id: number;
    title: string;
    score: number;
    icon: string;
}

const RandomVideoRoomScreen = () => {
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isHeartLiked, setIsHeartLiked] = useState(false);
    const [isFriendAdded, setIsFriendAdded] = useState(false);
    const [isFriendRequestSent, setIsFriendRequestSent] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

    // 상대방 프로필 데이터
    const partnerProfile: ProfileData = {
        id: 1,
        title: '상대방',
        score: Math.floor(Math.random() * 10000) + 1000,
        icon: 'person'
    };

    const handleEndCall = () => {
        setShowExitConfirmModal(true);
    };

    const confirmExit = () => {
        setShowExitConfirmModal(false);
        router.push('/random-video-end');
    };

    const cancelExit = () => {
        setShowExitConfirmModal(false);
    };

    const toggleCamera = () => {
        setIsCameraOn(prev => !prev);
    };

    const toggleMicrophone = () => {
        setIsMicrophoneOn(prev => !prev);
    };

    const handleProfileClick = async () => {
        setShowProfileModal(true);
        setIsHeartLiked(false);
        setIsFriendAdded(false);
        
        // 친구 요청 상태 확인
        const pendingRequests = await AsyncStorage.getItem('friend_requests');
        const requests = pendingRequests ? JSON.parse(pendingRequests) : [];
        const hasRequestSent = requests.some((req: any) => req.userName === partnerProfile.title);
        setIsFriendRequestSent(hasRequestSent);
    };

    const handleReport = () => {
        setShowReportModal(true);
    };

    return (
        <View style={styles.container}>
            {/* 상대방 비디오 영역 */}
            <View style={styles.mainVideoContainer}>
                <View style={styles.partnerVideo}>
                    <View style={styles.partnerAvatar}>
                        <Ionicons name="person" size={80} color="#fff" />
                    </View>
                    <Text style={styles.partnerName}>상대방</Text>
                </View>

                {/* 상대방 프로필 사진 (좌측 상단) */}
                <TouchableOpacity 
                    style={styles.partnerProfileButton}
                    onPress={handleProfileClick}
                >
                    <View style={styles.partnerProfileAvatar}>
                        <Ionicons name="person" size={20} color="#fff" />
                    </View>
                </TouchableOpacity>

                {/* 사주 궁합도 점수 (우측 상단) */}
                <View style={styles.compatibilityCard}>
                    <View style={styles.compatibilityHeader}>
                        <Text style={styles.compatibilityTitle}>사주 궁합도</Text>
                    </View>
                    <Text style={styles.compatibilityScore}>92점</Text>
                    <View style={styles.compatibilityFooter}>
                        <Text style={styles.compatibilityRating}>매우 좋음</Text>
                        <Ionicons name="star" size={12} color="#FFD700" />
                    </View>
                </View>

                {/* 내 비디오 (우측 하단) */}
                <View style={styles.myVideoContainer}>
                    <View style={styles.myVideo}>
                        <View style={styles.myAvatar}>
                            <Ionicons name="person" size={30} color="#fff" />
                        </View>
                    </View>
                </View>

            </View>

            {/* 프로필 모달 */}
            {showProfileModal && (
                <View style={styles.profileModalOverlay}>
                    <View style={styles.profileModal}>
                        <View style={styles.profileModalHeader}>
                            <Text style={styles.profileModalTitle}>프로필</Text>
                            <TouchableOpacity 
                                onPress={() => setShowProfileModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.profileModalContent}>
                            {/* 프로필 아바타 */}
                            <TouchableOpacity 
                                style={styles.profileAvatar}
                                onPress={() => {
                                    setShowProfileModal(false);
                                    setShowImageModal(true);
                                }}
                            >
                                <Ionicons name="person" size={60} color="#fff" />
                            </TouchableOpacity>
                            
                            {/* 사용자 정보 */}
                            <Text style={styles.profileName}>
                                {partnerProfile.title}
                            </Text>
                            <Text style={styles.profileLocation}>서울시 · 24세</Text>
                            
                            {/* 하트 수 */}
                            <View style={styles.profileStats}>
                                <View style={styles.statItem}>
                                    <Ionicons name="heart" size={16} color="#E53935" />
                                    <Text style={styles.statText}>{partnerProfile.score.toLocaleString()}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="person" size={16} color="#4CAF50" />
                                    <Text style={styles.statText}>89</Text>
                                </View>
                            </View>
                            
                            {/* 자기소개 */}
                            <View style={styles.aboutSection}>
                                <Text style={styles.sectionTitle}>자기소개</Text>
                                <Text style={styles.aboutText}>
                                    안녕하세요! {partnerProfile.title} 입니다 ✨ 랜덤 영상으로 만나서 정말 기뻐요! 즐거운 대화 나누고 싶습니다.
                                </Text>
                            </View>
                            
                            {/* 사주 키워드 */}
                            <View style={styles.keywordsSection}>
                                <Text style={styles.sectionTitle}>사주 키워드</Text>
                                <View style={styles.keywordsContainer}>
                                    <View style={styles.keywordTag}>
                                        <Text style={styles.keywordText}>사랑</Text>
                                    </View>
                                    <View style={styles.keywordTag}>
                                        <Text style={styles.keywordText}>열정</Text>
                                    </View>
                                    <View style={styles.keywordTag}>
                                        <Text style={styles.keywordText}>기쁨</Text>
                                    </View>
                                </View>
                            </View>
                            
                            {/* 좋아요 및 친구 관련 버튼 */}
                            <View style={styles.actionButtonsContainer}>
                                <TouchableOpacity 
                                    style={styles.heartButton}
                                    onPress={() => setIsHeartLiked(!isHeartLiked)}
                                >
                                    <Ionicons 
                                        name={isHeartLiked ? "heart" : "heart-outline"} 
                                        size={20} 
                                        color={isHeartLiked ? "#E53935" : "#4CAF50"} 
                                    />
                                </TouchableOpacity>
                                
                                {!isFriendAdded && !isFriendRequestSent ? (
                                    // 친구 추가 버튼
                                    <TouchableOpacity 
                                        style={styles.addFriendButton}
                                        onPress={async () => {
                                            // 친구 요청 저장
                                            const pendingRequests = await AsyncStorage.getItem('friend_requests');
                                            const requests = pendingRequests ? JSON.parse(pendingRequests) : [];
                                            const newRequest = {
                                                userName: partnerProfile.title,
                                                avatarText: partnerProfile.title.substring(0, 2),
                                                id: Date.now(),
                                                status: 'pending'
                                            };
                                            requests.push(newRequest);
                                            await AsyncStorage.setItem('friend_requests', JSON.stringify(requests));
                                            setIsFriendRequestSent(true);
                                            Alert.alert('요청 전송', '친구 요청이 전송되었습니다.');
                                        }}
                                    >
                                        <Ionicons name="person-add" size={20} color="#4CAF50" />
                                        <Text style={styles.addFriendText}>친구 추가</Text>
                                    </TouchableOpacity>
                                ) : !isFriendAdded && isFriendRequestSent ? (
                                    // 친구 요청 전송됨 상태
                                    <TouchableOpacity 
                                        style={[styles.addFriendButton, { opacity: 0.6 }]}
                                        disabled={true}
                                    >
                                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                        <Text style={styles.addFriendText}>친구 요청 전송됨</Text>
                                    </TouchableOpacity>
                                ) : (
                                    // 친구 추가된 상태 - 채팅과 친구 삭제 버튼
                                    <>
                                        <TouchableOpacity style={styles.chatButton}>
                                            <Ionicons name="chatbubble-outline" size={20} color="#4CAF50" />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={styles.removeFriendButton}
                                            onPress={() => setIsFriendAdded(false)}
                                        >
                                            <Ionicons name="person-remove" size={20} color="#E53935" />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* 하단 컨트롤 바 */}
            <View style={styles.controlsBar}>
                {/* 마이크 버튼 */}
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

                {/* 카메라 버튼 */}
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

                {/* 나가기 버튼 */}
                <TouchableOpacity 
                    style={styles.endCallButton}
                    onPress={handleEndCall}
                >
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>

                {/* 신고 버튼 */}
                <TouchableOpacity 
                    style={styles.reportButton}
                    onPress={handleReport}
                >
                    <Ionicons name="flag" size={24} color="#FF9800" />
                </TouchableOpacity>
            </View>

            {/* 이미지 확대 모달 */}
            <ImageModal
                visible={showImageModal}
                onClose={() => setShowImageModal(false)}
                imageUri={null}
                userName={partnerProfile.title}
            />

            {/* 신고 모달 */}
            <Modal
                visible={showReportModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowReportModal(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 20
                }}>
                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 16,
                        padding: 20,
                        width: '100%',
                        maxWidth: 300
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: '#333',
                            textAlign: 'center',
                            marginBottom: 20
                        }}>
                            사용자 신고
                        </Text>
                        
                        <Text style={{
                            fontSize: 14,
                            color: '#666',
                            textAlign: 'center',
                            marginBottom: 20,
                            lineHeight: 20
                        }}>
                            이 사용자를 신고하시겠습니까?
                        </Text>
                        
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            gap: 10
                        }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: '#f5f5f5',
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                    alignItems: 'center'
                                }}
                                onPress={() => setShowReportModal(false)}
                            >
                                <Text style={{
                                    color: '#666',
                                    fontWeight: '600'
                                }}>
                                    취소
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: '#E53935',
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    setShowReportModal(false);
                                    router.push('/report');
                                }}
                            >
                                <Text style={{
                                    color: '#fff',
                                    fontWeight: '600'
                                }}>
                                    신고하기
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* 나가기 확인 모달 */}
            <Modal
                visible={showExitConfirmModal}
                transparent={true}
                animationType="fade"
                onRequestClose={cancelExit}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 20
                }}>
                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 16,
                        padding: 20,
                        width: '100%',
                        maxWidth: 300
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: '#333',
                            textAlign: 'center',
                            marginBottom: 20
                        }}>
                            통화 종료
                        </Text>
                        
                        <Text style={{
                            fontSize: 14,
                            color: '#666',
                            textAlign: 'center',
                            marginBottom: 20,
                            lineHeight: 20
                        }}>
                            정말로 통화를 종료하시겠습니까?
                        </Text>
                        
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            gap: 10
                        }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: '#f5f5f5',
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                    alignItems: 'center'
                                }}
                                onPress={cancelExit}
                            >
                                <Text style={{
                                    color: '#666',
                                    fontWeight: '600'
                                }}>
                                    아니오
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: '#E53935',
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                    alignItems: 'center'
                                }}
                                onPress={confirmExit}
                            >
                                <Text style={{
                                    color: '#fff',
                                    fontWeight: '600'
                                }}>
                                    예
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default RandomVideoRoomScreen;
