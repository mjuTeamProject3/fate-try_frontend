import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, SafeAreaView, Modal, Image } from 'react-native';
import { AntDesign, Ionicons, Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '@/styles/NotificationStyles';

// 알림 데이터 타입 정의
interface NotificationItem {
    id: number;
    type: 'friend_request' | 'heart' | 'message' | 'system';
    username: string;
    avatarText: string;
    message: string;
    time: string;
    isRead: boolean;
    isOnline?: boolean;
}

interface NotificationSection {
    title: string;
    notifications: NotificationItem[];
    badgeCount?: number;
}

// 프로필 데이터 타입 정의
interface ProfileData {
    id: number;
    title: string;
    score: number;
    icon: string;
}

const NotificationScreen = () => {
    // 프로필 모달 상태
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
    const [isHeartLiked, setIsHeartLiked] = useState(false);
    const [isFriendAdded, setIsFriendAdded] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    
    const [friendRequests, setFriendRequests] = useState<NotificationItem[]>([
        {
            id: 1,
            type: 'friend_request',
            username: '햇살왕자',
            avatarText: '햇살',
            message: '친구 요청을 보냈습니다',
            time: '5분 전',
            isRead: false,
            isOnline: true,
        },
        {
            id: 2,
            type: 'friend_request',
            username: '별빛나래',
            avatarText: '별빛',
            message: '친구 요청을 보냈습니다',
            time: '1시간 전',
            isRead: false,
            isOnline: true,
        },
    ]);

    const [otherNotifications, setOtherNotifications] = useState<NotificationItem[]>([
        {
            id: 3,
            type: 'heart',
            username: '달빛소녀',
            avatarText: '달빛',
            message: '당신에게 하트를 눌렀습니다',
            time: '2분 전',
            isRead: false,
            isOnline: true,
        },
        {
            id: 4,
            type: 'message',
            username: '바람처럼',
            avatarText: '바람',
            message: '새로운 메시지를 보냈습니다',
            time: '10분 전',
            isRead: false,
            isOnline: true,
        },
        {
            id: 5,
            type: 'heart',
            username: '구름속에',
            avatarText: '구름',
            message: '당신에게 하트를 눌렀습니다',
            time: '오후 11:30',
            isRead: true,
        },
        {
            id: 6,
            type: 'message',
            username: '파도소리',
            avatarText: '파도',
            message: '안녕하세요! 반가워요',
            time: '오전 9:15',
            isRead: true,
        },
        {
            id: 7,
            type: 'heart',
            username: '꽃피는봄',
            avatarText: '꽃피',
            message: '당신에게 하트를 눌렀습니다',
            time: '10월 25일',
            isRead: true,
        },
        {
            id: 8,
            type: 'system',
            username: 'fate:try',
            avatarText: '',
            message: '매주 월요일 이벤트가 시작되었습니다!',
            time: '10월 23일',
            isRead: true,
        },
    ]);

    // 친구 요청 수락/거절 함수
    const handleFriendRequest = (notificationId: number, action: 'accept' | 'decline') => {
        setFriendRequests(prev => 
            prev.filter(notif => notif.id !== notificationId)
        );
    };

    // 모든 알림 읽음 처리 (화면 진입 시 자동 실행)
    const markAllAsRead = () => {
        setFriendRequests(prev => 
            prev.map(notif => ({ ...notif, isRead: true }))
        );
        setOtherNotifications(prev => 
            prev.map(notif => ({ ...notif, isRead: true }))
        );
    };

    // 화면 진입 시 모든 알림 읽음 처리
    useFocusEffect(
        React.useCallback(() => {
            markAllAsRead();
            // 홈 화면의 알림 개수도 0으로 업데이트
            resetHomeNotificationCount();
        }, [])
    );

    // 홈 화면의 알림 개수를 0으로 리셋
    const resetHomeNotificationCount = async () => {
        try {
            await AsyncStorage.setItem('notificationCount', '0');
        } catch (error) {
            console.error('알림 개수 리셋 실패:', error);
        }
    };

    // 프로필 클릭 핸들러
    const handleProfileClick = (notification: NotificationItem) => {
        const profileData: ProfileData = {
            id: notification.id,
            title: notification.username,
            score: Math.floor(Math.random() * 10000) + 1000, // 랜덤 점수
            icon: 'person'
        };
        setSelectedProfile(profileData);
        setIsHeartLiked(false);
        setIsFriendAdded(false);
        setShowProfileModal(true);
    };

    // 알림 아이콘 렌더링
    const renderNotificationIcon = (type: string) => {
        switch (type) {
            case 'friend_request':
                return <Ionicons name="person-add-outline" size={16} color="#4CAF50" />;
            case 'heart':
                return <AntDesign name="heart" size={16} color="#E53935" />;
            case 'message':
                return <Ionicons name="chatbubble-outline" size={16} color="#2196F3" />;
            case 'system':
                return <Ionicons name="notifications-outline" size={16} color="#2196F3" />;
            default:
                return <Ionicons name="notifications-outline" size={16} color="#999" />;
        }
    };

    // 개별 알림 카드 렌더링
    const renderNotificationCard = (notification: NotificationItem) => {
        if (notification.type === 'system') {
            return (
                <View key={notification.id} style={styles.systemNotification}>
                    <View style={styles.systemNotificationContent}>
                        <View style={styles.systemIcon}>
                            <Ionicons name="notifications" size={24} color="#fff" />
                        </View>
                        <View style={styles.systemInfo}>
                            <Text style={styles.systemTitle}>{notification.username}</Text>
                            <Text style={styles.systemMessage}>{notification.message}</Text>
                            <Text style={styles.systemTime}>{notification.time}</Text>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View key={notification.id} style={styles.notificationCard}>
                <View style={styles.notificationContent}>
                    <TouchableOpacity 
                        style={styles.avatar}
                        onPress={() => handleProfileClick(notification)}
                    >
                        <Text style={styles.avatarText}>{notification.avatarText}</Text>
                    </TouchableOpacity>
                    <View style={styles.notificationInfo}>
                        <View style={styles.notificationHeader}>
                            <View style={styles.notificationIcon}>
                                {renderNotificationIcon(notification.type)}
                            </View>
                            <Text style={styles.username}>{notification.username}</Text>
                            {notification.isOnline && <View style={styles.onlineDot} />}
                        </View>
                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                        <Text style={styles.notificationTime}>{notification.time}</Text>
                    </View>
                    {notification.type === 'friend_request' && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.acceptButton]}
                                onPress={() => handleFriendRequest(notification.id, 'accept')}
                            >
                                <AntDesign name="check" size={16} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.declineButton]}
                                onPress={() => handleFriendRequest(notification.id, 'decline')}
                            >
                                <AntDesign name="close" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
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
                <Text style={styles.headerTitle}>알림</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* 알림 목록 */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 친구 요청 섹션 */}
                <View style={styles.notificationSection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-add-outline" size={20} color="#333" />
                        <Text style={styles.sectionTitle}>친구 요청</Text>
                        {friendRequests.length > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.badgeText}>{friendRequests.length}</Text>
                            </View>
                        )}
                    </View>
                    {friendRequests.length > 0 ? (
                        friendRequests.map(renderNotificationCard)
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>친구 요청이 없습니다</Text>
                        </View>
                    )}
                </View>

                {/* 기타 알림들 */}
                <View style={styles.notificationSection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="notifications-outline" size={20} color="#333" />
                        <Text style={styles.sectionTitle}>알림</Text>
                    </View>
                    {otherNotifications.length > 0 ? (
                        otherNotifications.map(renderNotificationCard)
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>알림이 없습니다</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

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
                                onPress={() => setShowImageModal(true)}
                            >
                                <Ionicons name="person" size={60} color="#fff" />
                            </TouchableOpacity>
                            
                            {/* 사용자 정보 */}
                            <Text style={styles.profileName}>
                                {selectedProfile?.title || '사용자'}
                            </Text>
                            <Text style={styles.profileLocation}>서울시 · 24세</Text>
                            
                            {/* 하트 수 */}
                            <View style={styles.profileStats}>
                                <View style={styles.statItem}>
                                    <AntDesign name="heart" size={16} color="#E53935" />
                                    <Text style={styles.statText}>{selectedProfile?.score.toLocaleString() || '0'}</Text>
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
                                    안녕하세요! {selectedProfile?.title || '사용자'} 입니다 ✨ 랭킹에 올라서 정말 기뻐요! 여러분과 즐거운 대화 나누고 싶습니다. 많이 친해져요!
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
                                
                                {!isFriendAdded ? (
                                    // 친구 추가 버튼
                                    <TouchableOpacity 
                                        style={styles.addFriendButton}
                                        onPress={() => setIsFriendAdded(true)}
                                    >
                                        <Ionicons name="person-add" size={20} color="#4CAF50" />
                                        <Text style={styles.addFriendText}>친구 추가</Text>
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

            {/* 이미지 확대 모달 */}
            <Modal
                visible={showImageModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowImageModal(false)}
            >
                <View style={styles.imageModalOverlay}>
                    <TouchableOpacity 
                        style={styles.imageModalCloseArea}
                        onPress={() => setShowImageModal(false)}
                    >
                        <View style={styles.imageModalContent}>
                            <TouchableOpacity 
                                style={styles.imageModalCloseButton}
                                onPress={() => setShowImageModal(false)}
                            >
                                <Ionicons name="close" size={30} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.expandedAvatar}>
                                <Ionicons name="person" size={120} color="#fff" />
                            </View>
                            <Text style={styles.expandedAvatarText}>
                                {selectedProfile?.title || '사용자'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default NotificationScreen;

