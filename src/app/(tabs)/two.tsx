import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
// 스타일 임포트
import styles from '@/styles/Profile';
// 네비게이션 임포트
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageModal from '@/components/ImageModal';
import { API_BASE_URL, USER_ENDPOINTS, FRIEND_ENDPOINTS } from '@/constants/api';

// 프로필 데이터 타입
interface UserProfile {
    userId: number;
    username: string;
    location: string | null;
    avatar: string | null;
    likesCount: number;
    friendsCount: number;
    sajuKeywords: string[] | null;
}

// 친구 데이터 타입
interface Friend {
    id: number;
    username: string;
    name: string;
    avatar: string | null;
    location: string | null;
}

export default function ProfileScreen() {
    // 프로필 데이터 상태
    const [profileData, setProfileData] = React.useState<UserProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
    
    // 친구 목록 데이터
    const [friendsData, setFriendsData] = React.useState<Friend[]>([]);
    const [isLoadingFriends, setIsLoadingFriends] = React.useState(false);

    // 친구 목록을 가나다 순으로 정렬하는 함수
    const sortFriendsByName = (friendsList: Friend[]) => {
        return friendsList.sort((a, b) => (a.username || a.name).localeCompare((b.username || b.name), 'ko-KR'));
    };

    // 본인 프로필 조회
    const fetchMyProfile = async () => {
        try {
            setIsLoadingProfile(true);
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('Access Token이 없습니다.');
                return;
            }

            const response = await fetch(USER_ENDPOINTS.getProfile, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('프로필 조회 실패');
            }

            const data = await response.json();
            if (data.resultType === 'SUCCESS' && data.success) {
                setProfileData(data.success);
            }
        } catch (error) {
            console.error('프로필 조회 오류:', error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    // 친구 목록 조회
    const fetchFriendsList = async () => {
        try {
            setIsLoadingFriends(true);
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('Access Token이 없습니다.');
                return;
            }

            const response = await fetch(FRIEND_ENDPOINTS.getFriends, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('친구 목록 조회 실패');
            }

            const data = await response.json();
            if (data.resultType === 'SUCCESS' && data.success?.friends) {
                const sortedFriends = sortFriendsByName(data.success.friends);
                setFriendsData(sortedFriends.slice(0, 6));
            }
        } catch (error) {
            console.error('친구 목록 조회 오류:', error);
            // 에러 발생 시 빈 배열로 설정
            setFriendsData([]);
        } finally {
            setIsLoadingFriends(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchMyProfile();
            fetchFriendsList();
        }, [])
    );

    const [showProfileModal, setShowProfileModal] = React.useState(false);
    const [selectedFriend, setSelectedFriend] = React.useState<Friend | null>(null);
    const [selectedFriendProfile, setSelectedFriendProfile] = React.useState<UserProfile | null>(null);
    const [isLoadingFriendProfile, setIsLoadingFriendProfile] = React.useState(false);
    const [isHeartLiked, setIsHeartLiked] = React.useState(false);
    const [isFriendAdded, setIsFriendAdded] = React.useState(true); // 친구목록에서는 이미 친구이므로 true
    const [showImageModal, setShowImageModal] = React.useState(false);
    const [showRandomModal, setShowRandomModal] = React.useState(false);
    // 사주 키워드 펼침 상태
    const [keywordsExpanded, setKeywordsExpanded] = React.useState(false);
    // 친구 프로필 모달의 키워드 펼침 상태
    const [friendKeywordsExpanded, setFriendKeywordsExpanded] = React.useState(false);
    
    // 타인 프로필 조회
    const fetchFriendProfile = async (friendId: number) => {
        try {
            setIsLoadingFriendProfile(true);
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('Access Token이 없습니다.');
                return;
            }

            const response = await fetch(USER_ENDPOINTS.getProfileById(friendId), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('프로필 조회 실패');
            }

            const data = await response.json();
            if (data.resultType === 'SUCCESS' && data.success) {
                setSelectedFriendProfile(data.success);
            }
        } catch (error) {
            console.error('친구 프로필 조회 오류:', error);
        } finally {
            setIsLoadingFriendProfile(false);
        }
    };

    const openFriend = async (friend: Friend) => {
        setSelectedFriend(friend);
        setSelectedFriendProfile(null);
        setIsHeartLiked(false); // 하트 상태 초기화
        setIsFriendAdded(true); // 친구 상태 초기화
        setKeywordsExpanded(false); // 키워드 펼침 상태 초기화 (내 프로필)
        setFriendKeywordsExpanded(false); // 친구 키워드 펼침 상태 초기화
        setShowProfileModal(true);
        // 친구 프로필 조회
        await fetchFriendProfile(friend.id);
    };

    const startChatWithSelected = () => {
        if (!selectedFriend) return;
        setShowProfileModal(false);
        router.push(`/chat/${selectedFriend.id}?name=${encodeURIComponent(selectedFriend.name)}`);
    };

    return (
        <View style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>프로필</Text>
                <TouchableOpacity onPress={() => router.push('/profile-menu')}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 사용자 프로필 카드 */}
                <View style={styles.profileCard}>
                    <View style={styles.profileLeft}>
                        <View style={styles.profileImage}>
                            <Ionicons name="person" size={40} color="white" />
                        </View>
                        <View style={styles.profileInfo}>
                            {isLoadingProfile ? (
                                <ActivityIndicator size="small" color="#4CAF50" />
                            ) : (
                                <>
                                    <Text style={styles.userName}>
                                        {profileData?.username || '사용자'}
                                    </Text>
                                    <Text style={styles.userLocation}>
                                        {profileData?.location || '지역 미설정'}
                                    </Text>
                                    <View style={styles.userStats}>
                                        <View style={styles.statItem}>
                                            <AntDesign name="heart" size={16} color="#E53935" />
                                            <Text style={styles.statText}>
                                                {profileData?.likesCount?.toLocaleString() || '0'}
                                            </Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Ionicons name="person" size={16} color="#4CAF50" />
                                            <Text style={styles.statText}>
                                                {profileData?.friendsCount || '0'}
                                            </Text>
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => router.push('/profile-edit')}>
                            <Ionicons name="create-outline" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    
                    {/* 사주 키워드 - 프로필 카드 전체 너비로 확장 */}
                    {profileData?.sajuKeywords && profileData.sajuKeywords.length > 0 && (
                        <View style={{ width: '100%', marginTop: 15 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>사주 키워드</Text>
                                {profileData.sajuKeywords.length > 4 && (
                                    <TouchableOpacity 
                                        onPress={() => setKeywordsExpanded(!keywordsExpanded)}
                                        style={{ marginLeft: 'auto', paddingLeft: 8 }}
                                    >
                                        <Ionicons 
                                            name={keywordsExpanded ? "chevron-up" : "chevron-down"} 
                                            size={20} 
                                            color="#4CAF50" 
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.tagsContainer}>
                                {(() => {
                                    const displayCount = keywordsExpanded ? profileData.sajuKeywords.length : Math.min(profileData.sajuKeywords.length, 4);
                                    const keywordsToShow = profileData.sajuKeywords.slice(0, displayCount);
                                    
                                    return keywordsToShow.map((keyword, index) => (
                                        <View key={index} style={styles.tag}>
                                            <Text style={styles.tagText} numberOfLines={1}>{keyword}</Text>
                                        </View>
                                    ));
                                })()}
                            </View>
                        </View>
                    )}
                </View>

                {/* 친구 목록 섹션 */}
                <View style={styles.friendsSection}>
                    <View style={styles.friendsHeader}>
                        <View style={styles.friendsTitleContainer}>
                            <Ionicons name="people" size={20} color="#333" />
                            <Text style={styles.friendsTitle}>친구 목록</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/friends')}>
                            <Text style={styles.viewAllText}>전체보기</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView 
                        style={{ maxHeight: 200 }}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                    >
                        <View style={styles.friendsGrid}>
                            {isLoadingFriends ? (
                                <ActivityIndicator size="small" color="#4CAF50" style={{ marginTop: 20 }} />
                            ) : friendsData.length > 0 ? (
                                friendsData.map((friend) => (
                                    <TouchableOpacity key={friend.id} style={styles.friendItem} onPress={() => openFriend(friend)}>
                                        <View style={styles.friendAvatar}>
                                            <Ionicons name="person" size={24} color="white" />
                                        </View>
                                        <Text style={styles.friendName}>{friend.username || friend.name}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>
                                    친구가 없습니다
                                </Text>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </ScrollView>

            {/* 하단 내비게이션 바 */}
            <View style={styles.bottomNav}>
                <TouchableOpacity 
                    style={styles.navButton}
                    onPress={() => setShowRandomModal(true)}
                >
                    <View style={styles.videoChatIcon}>
                        <Ionicons name="videocam-outline" size={24} color="#4CAF50" />
                        <Ionicons name="chatbubble-outline" size={16} color="#4CAF50" style={styles.chatOverlay} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.navButton}
                    onPress={() => router.push('/(tabs)')}
                >
                    <Ionicons name="home-outline" size={30} color="#999" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton}>
                    <Ionicons name="person-circle" size={30} color="#4CAF50" />
                </TouchableOpacity>
            </View>

            {/* 친구 프로필 모달 */}
            {showProfileModal && selectedFriend && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                }}>
                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 20,
                        maxHeight: '80%',
                        width: '90%',
                        maxWidth: 400,
                        paddingTop: 20,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingBottom: 20,
                            borderBottomWidth: 1,
                            borderBottomColor: '#eee',
                        }}>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: 'bold',
                                color: '#333',
                            }}>프로필</Text>
                            <TouchableOpacity 
                                onPress={() => setShowProfileModal(false)}
                                style={{ padding: 5 }}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            {isLoadingFriendProfile ? (
                                <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 50 }} />
                            ) : selectedFriendProfile ? (
                                <>
                                    {/* 프로필 아바타 */}
                                    <TouchableOpacity 
                                        style={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: 50,
                                            backgroundColor: '#4CAF50',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginBottom: 15,
                                        }}
                                        onPress={() => setShowImageModal(true)}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                                            {(selectedFriendProfile.username || selectedFriend?.name || '친구').substring(0, 2)}
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    {/* 사용자 정보 */}
                                    <Text style={{
                                        fontSize: 24,
                                        fontWeight: 'bold',
                                        color: '#333',
                                        marginBottom: 5,
                                    }}>
                                        {selectedFriendProfile.username || selectedFriend?.name || '친구'}
                                    </Text>
                                    <Text style={{
                                        fontSize: 16,
                                        color: '#666',
                                        marginBottom: 15,
                                    }}>
                                        {selectedFriendProfile.location || '지역 미설정'}
                                    </Text>
                                    
                                    {/* 하트 수 */}
                                    <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 }}>
                                            <AntDesign name="heart" size={16} color="#E53935" />
                                            <Text style={{
                                                fontSize: 16,
                                                fontWeight: 'bold',
                                                color: '#333',
                                                marginLeft: 5,
                                            }}>
                                                {selectedFriendProfile.likesCount?.toLocaleString() || '0'}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 }}>
                                            <Ionicons name="person" size={16} color="#4CAF50" />
                                            <Text style={{
                                                fontSize: 16,
                                                fontWeight: 'bold',
                                                color: '#333',
                                                marginLeft: 5,
                                            }}>
                                                {selectedFriendProfile.friendsCount || '0'}
                                            </Text>
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <Text style={{ color: '#999', marginTop: 50 }}>프로필 정보를 불러올 수 없습니다</Text>
                            )}
                            
                            {/* 자기소개 */}
                            {selectedFriendProfile && (
                                <View style={{ width: '100%', marginBottom: 20 }}>
                                    <Text style={{
                                        fontSize: 18,
                                        fontWeight: 'bold',
                                        color: '#333',
                                        marginBottom: 10,
                                    }}>자기소개</Text>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#666',
                                        lineHeight: 20,
                                    }}>
                                        안녕하세요! {selectedFriendProfile.username || selectedFriend?.name || '친구'}입니다 ✨ 좋은 사람들과 함께 즐거운 대화 나누고 싶습니다. 많이 친해져요!
                                    </Text>
                                </View>
                            )}
                            
                            {/* 사주 키워드 */}
                            {selectedFriendProfile?.sajuKeywords && selectedFriendProfile.sajuKeywords.length > 0 && (
                                <View style={{ width: '100%', marginBottom: 20 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <Text style={{
                                            fontSize: 18,
                                            fontWeight: 'bold',
                                            color: '#333',
                                        }}>사주 키워드</Text>
                                        {selectedFriendProfile.sajuKeywords.length > 4 && (
                                            <TouchableOpacity 
                                                onPress={() => setFriendKeywordsExpanded(!friendKeywordsExpanded)}
                                            >
                                                <Ionicons 
                                                    name={friendKeywordsExpanded ? "chevron-up" : "chevron-down"} 
                                                    size={20} 
                                                    color="#4CAF50" 
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <View style={{ width: '100%' }}>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            {(() => {
                                                const displayCount = friendKeywordsExpanded ? selectedFriendProfile.sajuKeywords.length : 4;
                                                const keywordsToShow = selectedFriendProfile.sajuKeywords.slice(0, displayCount);
                                                
                                                return keywordsToShow.map((keyword, index) => (
                                                    <View key={index} style={{
                                                        backgroundColor: '#fff',
                                                        borderWidth: 1,
                                                        borderColor: '#4CAF50',
                                                        borderRadius: 15,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 6,
                                                        marginRight: 8,
                                                        marginBottom: 8,
                                                        alignSelf: 'flex-start', // 내용에 맞게 자동 너비 조정
                                                    }}>
                                                        <Text style={{
                                                            fontSize: 14,
                                                            color: '#4CAF50',
                                                            fontWeight: '500',
                                                        }}>{keyword}</Text>
                                                    </View>
                                                ));
                                            })()}
                                        </View>
                                    </View>
                                </View>
                            )}
                            
                            {/* 좋아요 및 친구 관련 버튼 */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                width: '100%',
                                justifyContent: 'space-between',
                            }}>
                                <TouchableOpacity 
                                    style={{
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: 25,
                                        paddingHorizontal: 20,
                                        paddingVertical: 12,
                                        flex: 1,
                                        marginRight: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    onPress={() => setIsHeartLiked(!isHeartLiked)}
                                >
                                    <Ionicons 
                                        name={isHeartLiked ? "heart" : "heart-outline"} 
                                        size={20} 
                                        color={isHeartLiked ? "#E53935" : "#4CAF50"} 
                                    />
                                </TouchableOpacity>
                                
                                {/* 친구 추가된 상태 - 채팅과 친구 삭제 버튼 */}
                                <>
                                    <TouchableOpacity 
                                        style={{
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: 25,
                                            paddingHorizontal: 20,
                                            paddingVertical: 12,
                                            flex: 1,
                                            marginRight: 10,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                        onPress={startChatWithSelected}
                                    >
                                        <Ionicons name="chatbubble-outline" size={20} color="#4CAF50" />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={{
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: 25,
                                            paddingHorizontal: 20,
                                            paddingVertical: 12,
                                            flex: 1,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                        onPress={async () => {
                                            if (!selectedFriend) return;
                                            setShowProfileModal(false);
                                            // 친구 목록 새로고침
                                            await fetchFriendsList();
                                        }}
                                    >
                                        <Ionicons name="person-remove" size={20} color="#E53935" />
                                    </TouchableOpacity>
                                </>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* 이미지 확대 모달 */}
            <ImageModal
                visible={showImageModal}
                onClose={() => setShowImageModal(false)}
                imageUri={selectedFriendProfile?.avatar || null}
                userName={selectedFriendProfile?.username || selectedFriend?.name || '친구'}
            />

            {/* 랜덤 채팅/영상 선택 드롭다운 */}
            {showRandomModal && (
                <TouchableOpacity 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'transparent',
                        zIndex: 1000,
                        justifyContent: 'flex-end',
                        alignItems: 'flex-start',
                        paddingBottom: 70, // 하단 네비게이션 바로 위
                        paddingLeft: 20, // 좌측 하단 아이콘 위치에 맞춤
                    }}
                    activeOpacity={1}
                    onPress={() => setShowRandomModal(false)}
                >
                    <TouchableOpacity 
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 12,
                            paddingVertical: 8,
                            paddingHorizontal: 4,
                            borderWidth: 1,
                            borderColor: '#eee',
                            minWidth: 160,
                        }}
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <TouchableOpacity 
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                                backgroundColor: '#f8f9fa',
                                marginVertical: 2,
                            }}
                            onPress={() => {
                                setShowRandomModal(false);
                                // 랜덤 채팅 대기 화면으로 이동
                                router.push('/random-chat-waiting');
                            }}
                        >
                            <Ionicons name="chatbubble-outline" size={20} color="#333" />
                            <Text style={{
                                fontSize: 16,
                                color: '#333',
                                fontWeight: '500',
                                marginLeft: 12,
                            }}>랜덤 채팅</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                                backgroundColor: '#f8f9fa',
                                marginVertical: 2,
                            }}
                            onPress={() => {
                                setShowRandomModal(false);
                                router.push('/random-video-waiting');
                            }}
                        >
                            <Ionicons name="videocam-outline" size={20} color="#333" />
                            <Text style={{
                                fontSize: 16,
                                color: '#333',
                                fontWeight: '500',
                                marginLeft: 12,
                            }}>랜덤 영상</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            )}
        </View>
    );
}