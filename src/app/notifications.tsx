import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, SafeAreaView, Modal, Image, Alert, ActivityIndicator } from 'react-native';
import { AntDesign, Ionicons, Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '@/styles/NotificationStyles';
import { FRIEND_ENDPOINTS, NOTIFICATION_ENDPOINTS, USER_ENDPOINTS } from '@/constants/api';

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
    userId?: number; // 친구 요청의 경우 요청한 사용자 ID
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
    
    const [friendRequests, setFriendRequests] = useState<NotificationItem[]>([]);
    const [otherNotifications, setOtherNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 시간 포맷 함수
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        
        // 일주일 이상이면 날짜 표시
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const ampm = hour < 12 ? '오전' : '오후';
        const displayHour = hour % 12 || 12;
        
        if (diffDays < 30) {
            return `${ampm} ${displayHour}:${minute.toString().padStart(2, '0')}`;
        }
        
        return `${month}월 ${day}일`;
    };

    // 알림 메시지 생성 함수
    const getNotificationMessage = (type: string, content: any) => {
        switch (type) {
            case 'like':
                return '당신에게 하트를 눌렀습니다';
            case 'message':
                return typeof content === 'string' ? content : content?.message || '새로운 메시지를 보냈습니다';
            case 'system':
                return typeof content === 'string' ? content : content?.message || '시스템 알림';
            case 'friend_request':
                return '친구 요청을 보냈습니다';
            default:
                return '새로운 알림이 있습니다';
        }
    };

    // 백엔드 API로 알림 조회
    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('Access Token이 없습니다.');
                return;
            }

            // 친구 요청 알림 조회 (processed=false)
            const friendRequestsUrl = NOTIFICATION_ENDPOINTS.getNotifications({ type: 'friend_request', processed: false });
            
            const friendRequestsResponse = await fetch(
                friendRequestsUrl,
                {
                    headers: { 
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    }
                }
            );
            
            if (friendRequestsResponse.ok) {
                const responseData = await friendRequestsResponse.json();
                
                // 응답 형식 확인 및 배열 추출
                const friendRequestsData = responseData.resultType === 'SUCCESS' 
                    ? (responseData.success || [])
                    : (Array.isArray(responseData) ? responseData : []);
                
                if (Array.isArray(friendRequestsData) && friendRequestsData.length > 0) {
                    const formatted = friendRequestsData.map((notif: any) => ({
                        id: notif.id,
                        type: 'friend_request' as const,
                        username: notif.fromUser?.username || notif.content?.username || notif.fromUser?.name || '알 수 없음',
                        avatarText: (notif.fromUser?.username || notif.content?.username || notif.fromUser?.name || '알').substring(0, 2),
                        message: '친구 요청을 보냈습니다',
                        time: formatTimeAgo(notif.createdAt),
                        isRead: notif.isRead,
                        userId: notif.fromUser?.id || null,
                    }));
                    setFriendRequests(formatted);
                } else {
                    setFriendRequests([]);
                }
            } else {
                // 에러 발생 시에만 상세 로그
                const errorText = await friendRequestsResponse.text();
                console.error('[알림] 친구 요청 알림 조회 실패:', friendRequestsResponse.status, errorText);
                console.log('[알림] 에러 발생 시점의 URL:', friendRequestsUrl);
            }

            // 일반 알림 조회 (친구 요청 제외, 최신순)
            const otherNotificationsUrl = NOTIFICATION_ENDPOINTS.getNotifications({ take: 50 });
            
            const otherNotificationsResponse = await fetch(
                otherNotificationsUrl,
                {
                    headers: { 
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    }
                }
            );
            
            if (otherNotificationsResponse.ok) {
                const responseData = await otherNotificationsResponse.json();
                
                // 응답 형식 확인 및 배열 추출
                const otherNotificationsData = responseData.resultType === 'SUCCESS' 
                    ? (responseData.success || [])
                    : (Array.isArray(responseData) ? responseData : []);
                
                if (Array.isArray(otherNotificationsData) && otherNotificationsData.length > 0) {
                    // friend_request가 아닌 것만 필터링
                    const filtered = otherNotificationsData.filter((notif: any) => notif.type !== 'friend_request');
                    
                    const formatted = filtered.map((notif: any) => ({
                        id: notif.id,
                        type: notif.type === 'like' ? 'heart' : notif.type,
                        username: notif.fromUser?.username || notif.content?.username || notif.fromUser?.name || '알 수 없음',
                        avatarText: (notif.fromUser?.username || notif.content?.username || notif.fromUser?.name || '알').substring(0, 2),
                        message: getNotificationMessage(notif.type, notif.content),
                        time: formatTimeAgo(notif.createdAt),
                        isRead: notif.isRead,
                        userId: notif.fromUser?.id || null,
                    }));
                    setOtherNotifications(formatted);
                } else {
                    setOtherNotifications([]);
                }
            } else {
                // 에러 발생 시에만 상세 로그
                const errorText = await otherNotificationsResponse.text();
                console.error('[알림] 일반 알림 조회 실패:', otherNotificationsResponse.status, errorText);
                console.log('[알림] 에러 발생 시점의 URL:', otherNotificationsUrl);
            }
        } catch (error) {
            console.error('알림 조회 오류:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 친구 요청 수락/거절 함수
    const handleFriendRequest = async (notificationId: number, action: 'accept' | 'decline', userId?: number) => {
        if (!userId) {
            Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
            return;
        }
        
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                Alert.alert('오류', '로그인이 필요합니다.');
                return;
            }

            // 친구 요청 수락/거절
            const endpoint = action === 'accept' 
                ? FRIEND_ENDPOINTS.accept(userId)
                : FRIEND_ENDPOINTS.decline(userId);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('요청 처리 실패');
            }

            // 알림 처리 완료 표시
            await fetch(NOTIFICATION_ENDPOINTS.processFriendRequest(notificationId), {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            // 로컬 state 업데이트
            setFriendRequests(prev => 
                prev.filter(notif => notif.id !== notificationId)
            );

            if (action === 'accept') {
                Alert.alert('성공', '친구 요청을 수락했습니다.');
            }
        } catch (error) {
            console.error('친구 요청 처리 오류:', error);
            Alert.alert('오류', '요청 처리에 실패했습니다.');
        }
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

    // 화면 진입 시 알림 조회 및 읽음 처리
    useFocusEffect(
        React.useCallback(() => {
            fetchNotifications();
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
    const handleProfileClick = async (notification: NotificationItem) => {
        if (!notification.userId) {
            Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
            return;
        }

        const profileData: ProfileData = {
            id: notification.userId,
            title: notification.username,
            score: Math.floor(Math.random() * 10000) + 1000, // 랜덤 점수
            icon: 'person'
        };
        setSelectedProfile(profileData);
        setIsHeartLiked(false);
        setIsFriendAdded(false);
        setShowProfileModal(true);

        // 프로필 정보 및 좋아요 상태 확인
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (accessToken && notification.userId) {
                const response = await fetch(USER_ENDPOINTS.getProfileById(notification.userId), {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.resultType === 'SUCCESS' && data.success) {
                        setIsHeartLiked(data.success.isLiked || false);
                        // 프로필 데이터 업데이트
                        setSelectedProfile({
                            id: data.success.userId,
                            title: data.success.username || data.success.name,
                            score: data.success.likesCount || 0,
                            icon: 'person'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('프로필 조회 오류:', error);
        }
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
                                onPress={() => handleFriendRequest(notification.id, 'accept', notification.userId)}
                            >
                                <AntDesign name="check" size={16} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.declineButton]}
                                onPress={() => handleFriendRequest(notification.id, 'decline', notification.userId)}
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
                {isLoading ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                    </View>
                ) : (
                    <>
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
                    </>
                )}
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
                                    onPress={async () => {
                                        if (!selectedProfile?.id) {
                                            Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
                                            return;
                                        }

                                        const accessToken = await AsyncStorage.getItem('accessToken');
                                        if (!accessToken) {
                                            Alert.alert('로그인 필요', '좋아요를 누르려면 로그인이 필요합니다.');
                                            return;
                                        }

                                        try {
                                            if (isHeartLiked) {
                                                // 좋아요 취소
                                                const response = await fetch(USER_ENDPOINTS.unlike(selectedProfile.id), {
                                                    method: 'DELETE',
                                                    headers: {
                                                        'Authorization': `Bearer ${accessToken}`,
                                                    },
                                                });
                                                if (!response.ok) {
                                                    throw new Error('좋아요 취소 실패');
                                                }
                                                setIsHeartLiked(false);
                                            } else {
                                                // 좋아요 추가
                                                const response = await fetch(USER_ENDPOINTS.like(selectedProfile.id), {
                                                    method: 'POST',
                                                    headers: {
                                                        'Authorization': `Bearer ${accessToken}`,
                                                        'Content-Type': 'application/json',
                                                    },
                                                });
                                                if (!response.ok) {
                                                    throw new Error('좋아요 추가 실패');
                                                }
                                                setIsHeartLiked(true);
                                            }
                                        } catch (error) {
                                            console.error('좋아요 처리 오류:', error);
                                            Alert.alert('오류', '좋아요 처리 중 문제가 발생했습니다.');
                                        }
                                    }}
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
                                        onPress={async () => {
                                            if (!selectedProfile?.id) {
                                                Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
                                                return;
                                            }
                                            try {
                                                const accessToken = await AsyncStorage.getItem('accessToken');
                                                if (!accessToken) {
                                                    Alert.alert('오류', '로그인이 필요합니다.');
                                                    return;
                                                }
                                                const response = await fetch(FRIEND_ENDPOINTS.request(selectedProfile.id), {
                                                    method: 'POST',
                                                    headers: {
                                                        'Authorization': `Bearer ${accessToken}`,
                                                        'Content-Type': 'application/json',
                                                    },
                                                });
                                                if (!response.ok) {
                                                    throw new Error('친구 요청 실패');
                                                }
                                                Alert.alert('성공', '친구 요청을 보냈습니다.');
                                                setIsFriendAdded(true);
                                            } catch (error: any) {
                                                console.error('친구 요청 오류:', error);
                                                Alert.alert('오류', error.message || '친구 요청에 실패했습니다.');
                                            }
                                        }}
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
                                            onPress={async () => {
                                                if (!selectedProfile?.id) {
                                                    Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
                                                    return;
                                                }
                                                try {
                                                    const accessToken = await AsyncStorage.getItem('accessToken');
                                                    if (!accessToken) {
                                                        Alert.alert('오류', '로그인이 필요합니다.');
                                                        return;
                                                    }
                                                    const response = await fetch(FRIEND_ENDPOINTS.decline(selectedProfile.id), {
                                                        method: 'POST',
                                                        headers: {
                                                            'Authorization': `Bearer ${accessToken}`,
                                                            'Content-Type': 'application/json',
                                                        },
                                                    });
                                                    if (!response.ok) {
                                                        throw new Error('친구 삭제 실패');
                                                    }
                                                    setIsFriendAdded(false);
                                                } catch (error: any) {
                                                    console.error('친구 삭제 오류:', error);
                                                    Alert.alert('오류', error.message || '친구 삭제에 실패했습니다.');
                                                }
                                            }}
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

