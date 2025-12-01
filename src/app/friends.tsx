import React, { useEffect, useState, useCallback } from 'react';
import { 
    ScrollView, 
    Text, 
    View, 
    TouchableOpacity, 
    SafeAreaView, 
    TextInput, 
    Modal,
    Alert,
    FlatList,
    ActivityIndicator
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import styles from '@/styles/FriendsListStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageModal from '@/components/ImageModal';
import { FRIEND_ENDPOINTS, USER_ENDPOINTS } from '@/constants/api';

// 친구 데이터 타입 정의
interface Friend {
    id: number;
    username: string;
    name: string;
    avatar: string | null;
    location: string | null;
}

// 검색된 사용자 타입
interface SearchedUser {
    id: number;
    username: string;
    name: string;
    avatar: string | null;
    location: string | null;
}

const FriendsListScreen = () => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [isLoadingFriends, setIsLoadingFriends] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchUserProfileModal, setShowSearchUserProfileModal] = useState(false);
    const [selectedSearchUser, setSelectedSearchUser] = useState<SearchedUser | null>(null);
    const [selectedSearchUserProfile, setSelectedSearchUserProfile] = useState<any>(null);
    const [isLoadingSearchUserProfile, setIsLoadingSearchUserProfile] = useState(false);

    // 친구 목록을 가나다 순으로 정렬하는 함수
    const sortFriendsByName = (friendsList: Friend[]) => {
        return friendsList.sort((a, b) => (a.username || a.name).localeCompare((b.username || b.name), 'ko-KR'));
    };

    // 검색 필터링된 친구 목록 (가나다 순으로 정렬)
    const filteredFriends = sortFriendsByName(
        friends.filter(friend =>
            (friend.username || friend.name).toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

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
                setFriends(sortedFriends);
            }
        } catch (error) {
            console.error('친구 목록 조회 오류:', error);
            setFriends([]);
        } finally {
            setIsLoadingFriends(false);
        }
    };

    // 사용자 검색 (디바운싱)
    const searchUsers = useCallback(
        async (query: string) => {
            if (!query || query.trim().length === 0) {
                setSearchResults([]);
                return;
            }

            try {
                setIsSearching(true);
                const accessToken = await AsyncStorage.getItem('accessToken');
                if (!accessToken) {
                    console.error('Access Token이 없습니다.');
                    return;
                }

                const response = await fetch(USER_ENDPOINTS.searchUsers(query.trim(), 20), {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('사용자 검색 실패');
                }

                const data = await response.json();
                if (data.resultType === 'SUCCESS' && data.success?.users) {
                    setSearchResults(data.success.users);
                } else {
                    setSearchResults([]);
                }
            } catch (error) {
                console.error('사용자 검색 오류:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        },
        []
    );

    // 디바운싱된 검색 함수
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput.trim()) {
                searchUsers(searchInput);
            } else {
                setSearchResults([]);
            }
        }, 300); // 300ms 디바운스

        return () => clearTimeout(timer);
    }, [searchInput, searchUsers]);

    // 검색된 사용자 프로필 조회
    const fetchSearchUserProfile = async (userId: number) => {
        try {
            setIsLoadingSearchUserProfile(true);
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('Access Token이 없습니다.');
                return;
            }

            const response = await fetch(USER_ENDPOINTS.getProfileById(userId), {
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
                setSelectedSearchUserProfile(data.success);
                // 좋아요 상태 설정
                setIsHeartLiked(data.success.isLiked || false);
            }
        } catch (error) {
            console.error('검색된 사용자 프로필 조회 오류:', error);
        } finally {
            setIsLoadingSearchUserProfile(false);
        }
    };

    // 친구 요청 보내기
    const sendFriendRequest = async (userId: number) => {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                Alert.alert('오류', '로그인이 필요합니다.');
                return;
            }

            const response = await fetch(FRIEND_ENDPOINTS.request(userId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.reason || '친구 요청 실패');
            }

            Alert.alert('성공', '친구 요청을 보냈습니다.');
            setShowSearchUserProfileModal(false);
            setSearchInput('');
            setSearchResults([]);
        } catch (error: any) {
            console.error('친구 요청 오류:', error);
            Alert.alert('오류', error.message || '친구 요청에 실패했습니다.');
        }
    };

    // 친구 삭제 함수 (친구 거절)
    const removeFriend = async (friendId: number) => {
        Alert.alert(
            '친구 삭제',
            '이 친구를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const accessToken = await AsyncStorage.getItem('accessToken');
                            if (!accessToken) {
                                Alert.alert('오류', '로그인이 필요합니다.');
                                return;
                            }

                            const response = await fetch(FRIEND_ENDPOINTS.decline(friendId), {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Content-Type': 'application/json',
                                },
                            });

                            if (!response.ok) {
                                throw new Error('친구 삭제 실패');
                            }

                            // 친구 목록 새로고침
                            await fetchFriendsList();
                        } catch (error) {
                            console.error('친구 삭제 오류:', error);
                            Alert.alert('오류', '친구 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 친구와 채팅 시작
    const startChat = (friend: Friend) => {
        router.push(`/chat/${friend.id}?name=${encodeURIComponent(friend.username || friend.name)}`);
    };

    // 개별 친구 아이템 렌더링
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [selectedFriendProfile, setSelectedFriendProfile] = useState<any>(null);
    const [isLoadingFriendProfile, setIsLoadingFriendProfile] = useState(false);
    const [isHeartLiked, setIsHeartLiked] = useState(false);
    const [isFriendAdded, setIsFriendAdded] = useState(true); // 친구목록에서는 이미 친구이므로 true
    const [showImageModal, setShowImageModal] = useState(false);

    // 친구 프로필 조회
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
                // 좋아요 상태 설정
                setIsHeartLiked(data.success.isLiked || false);
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
        setShowProfileModal(true);
        // 친구 프로필 조회
        await fetchFriendProfile(friend.id);
    };

    const renderFriendItem = (friend: Friend) => (
        <TouchableOpacity 
            key={friend.id} 
            style={styles.friendItem}
            onLongPress={() => removeFriend(friend.id)}
            onPress={() => openFriend(friend)}
        >
            <View style={styles.friendAvatar}>
                <Text style={styles.friendAvatarText}>
                    {(friend.username || friend.name || '친구').substring(0, 2)}
                </Text>
            </View>
            <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.username || friend.name}</Text>
            </View>
            <TouchableOpacity 
                style={styles.messageButton}
                onPress={() => startChat(friend)}
            >
                <Ionicons name="chatbubble-outline" size={24} color="#4CAF50" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    // 초기 로드
    useEffect(() => {
        fetchFriendsList();
    }, []);

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
                <Text style={styles.headerTitle}>친구</Text>
            </View>

            {/* 메인 카드 */}
            <View style={styles.mainCard}>
                {/* 카드 헤더 */}
                <View style={styles.cardHeader}>
                    <View style={styles.friendsInfo}>
                        <Ionicons 
                            name="people-outline" 
                            size={20} 
                            color="#333" 
                            style={styles.friendsIcon}
                        />
                        <Text style={styles.friendsText}>친구</Text>
                        <View style={styles.friendsCount}>
                            <Text style={styles.friendsCountText}>{friends.length}</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={styles.addFriendButton}
                        onPress={() => setShowAddFriendModal(true)}
                    >
                        <Ionicons name="person-add" size={16} color="#fff" />
                        <Text style={styles.addFriendText}>친구 추가</Text>
                    </TouchableOpacity>
                </View>

                {/* 검색 바 */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInput}>
                        <Ionicons 
                            name="search" 
                            size={20} 
                            color="#fff" 
                            style={styles.searchIcon}
                        />
                        <TextInput
                            style={styles.searchText}
                            placeholder="친구 검색..."
                            placeholderTextColor="rgba(255, 255, 255, 0.7)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* 친구 목록 */}
                {isLoadingFriends ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                    </View>
                ) : filteredFriends.length > 0 ? (
                    <FlatList
                        data={filteredFriends}
                        keyExtractor={(f) => String(f.id)}
                        renderItem={({ item }) => renderFriendItem(item)}
                        style={styles.friendsList as any}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyStateText}>
                            {searchQuery ? '검색 결과가 없습니다' : '친구가 없습니다'}
                        </Text>
                    </View>
                )}
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

                                    {/* 자기소개 */}
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

                                    {/* 사주 키워드 */}
                                    {selectedFriendProfile.sajuKeywords && selectedFriendProfile.sajuKeywords.length > 0 && (
                                        <View style={{ width: '100%', marginBottom: 20 }}>
                                            <Text style={{
                                                fontSize: 18,
                                                fontWeight: 'bold',
                                                color: '#333',
                                                marginBottom: 10,
                                            }}>사주 키워드</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                                {selectedFriendProfile.sajuKeywords.slice(0, 4).map((keyword: string, index: number) => (
                                                    <View key={index} style={{
                                                        backgroundColor: '#fff',
                                                        borderWidth: 1,
                                                        borderColor: '#4CAF50',
                                                        borderRadius: 15,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 6,
                                                        marginRight: 8,
                                                        marginBottom: 8,
                                                    }}>
                                                        <Text style={{
                                                            fontSize: 14,
                                                            color: '#4CAF50',
                                                            fontWeight: '500',
                                                        }}>{keyword}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <Text style={{ color: '#999', marginTop: 50 }}>프로필 정보를 불러올 수 없습니다</Text>
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
                                    onPress={async () => {
                                        if (!selectedFriend?.id) {
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
                                                const response = await fetch(USER_ENDPOINTS.unlike(selectedFriend.id), {
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
                                                const response = await fetch(USER_ENDPOINTS.like(selectedFriend.id), {
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
                                            // 프로필 새로고침
                                            await fetchFriendProfile(selectedFriend.id);
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
                                        onPress={() => {
                                            setShowProfileModal(false);
                                            startChat(selectedFriend);
                                        }}
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
                                        onPress={() => {
                                            setShowProfileModal(false);
                                            removeFriend(selectedFriend.id);
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

            {/* 친구 추가 모달 */}
            <Modal
                visible={showAddFriendModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setShowAddFriendModal(false);
                    setSearchInput('');
                    setSearchResults([]);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20,
                        }}>
                            <Text style={styles.modalTitle}>친구 추가</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowAddFriendModal(false);
                                    setSearchInput('');
                                    setSearchResults([]);
                                }}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="닉네임을 입력하세요"
                            value={searchInput}
                            onChangeText={setSearchInput}
                            autoFocus={true}
                        />
                        {isSearching && (
                            <View style={{ padding: 10, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color="#4CAF50" />
                            </View>
                        )}
                        {searchResults.length > 0 && (
                            <View style={{ maxHeight: 300, marginTop: 10 }}>
                                <FlatList
                                    data={searchResults}
                                    keyExtractor={(item) => String(item.id)}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                padding: 15,
                                                borderBottomWidth: 1,
                                                borderBottomColor: '#eee',
                                            }}
                                            onPress={async () => {
                                                setSelectedSearchUser(item);
                                                setShowSearchUserProfileModal(true);
                                                await fetchSearchUserProfile(item.id);
                                            }}
                                        >
                                            <View style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 20,
                                                backgroundColor: '#4CAF50',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 12,
                                            }}>
                                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                                    {(item.username || item.name || '사용자').substring(0, 2)}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontWeight: '500', color: '#333' }}>
                                                    {item.username || item.name}
                                                </Text>
                                                {item.location && (
                                                    <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                                                        {item.location}
                                                    </Text>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        )}
                        {searchInput.trim().length > 0 && !isSearching && searchResults.length === 0 && (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#999' }}>검색 결과가 없습니다</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* 검색된 사용자 프로필 모달 */}
            {showSearchUserProfileModal && selectedSearchUser && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 2000,
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
                                onPress={() => {
                                    setShowSearchUserProfileModal(false);
                                    setSelectedSearchUser(null);
                                    setSelectedSearchUserProfile(null);
                                }}
                                style={{ padding: 5 }}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            {isLoadingSearchUserProfile ? (
                                <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 50 }} />
                            ) : selectedSearchUserProfile ? (
                                <>
                                    {/* 프로필 아바타 */}
                                    <View style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: 50,
                                        backgroundColor: '#4CAF50',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: 15,
                                    }}>
                                        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                                            {(selectedSearchUserProfile.username || selectedSearchUser?.name || '사용자').substring(0, 2)}
                                        </Text>
                                    </View>
                                    
                                    {/* 사용자 정보 */}
                                    <Text style={{
                                        fontSize: 24,
                                        fontWeight: 'bold',
                                        color: '#333',
                                        marginBottom: 5,
                                    }}>
                                        {selectedSearchUserProfile.username || selectedSearchUser?.name || '사용자'}
                                    </Text>
                                    <Text style={{
                                        fontSize: 16,
                                        color: '#666',
                                        marginBottom: 15,
                                    }}>
                                        {selectedSearchUserProfile.location || '지역 미설정'}
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
                                                {selectedSearchUserProfile.likesCount?.toLocaleString() || '0'}
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
                                                {selectedSearchUserProfile.friendsCount || '0'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* 사주 키워드 */}
                                    {selectedSearchUserProfile.sajuKeywords && selectedSearchUserProfile.sajuKeywords.length > 0 && (
                                        <View style={{ width: '100%', marginBottom: 20 }}>
                                            <Text style={{
                                                fontSize: 18,
                                                fontWeight: 'bold',
                                                color: '#333',
                                                marginBottom: 10,
                                            }}>사주 키워드</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                                {selectedSearchUserProfile.sajuKeywords.slice(0, 4).map((keyword: string, index: number) => (
                                                    <View key={index} style={{
                                                        backgroundColor: '#fff',
                                                        borderWidth: 1,
                                                        borderColor: '#4CAF50',
                                                        borderRadius: 15,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 6,
                                                        marginRight: 8,
                                                        marginBottom: 8,
                                                    }}>
                                                        <Text style={{
                                                            fontSize: 14,
                                                            color: '#4CAF50',
                                                            fontWeight: '500',
                                                        }}>{keyword}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                    
                                    {/* 좋아요 및 친구 관련 버튼 */}
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        width: '100%',
                                        justifyContent: 'space-between',
                                        marginTop: 10,
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
                                            onPress={async () => {
                                                if (!selectedSearchUser?.id) {
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
                                                        const response = await fetch(USER_ENDPOINTS.unlike(selectedSearchUser.id), {
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
                                                        const response = await fetch(USER_ENDPOINTS.like(selectedSearchUser.id), {
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
                                                    // 프로필 새로고침
                                                    await fetchSearchUserProfile(selectedSearchUser.id);
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
                                        
                                        {/* 친구 요청 버튼 */}
                                        <TouchableOpacity 
                                            style={{
                                                backgroundColor: '#4CAF50',
                                                borderRadius: 25,
                                                paddingHorizontal: 20,
                                                paddingVertical: 12,
                                                flex: 1,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            onPress={() => sendFriendRequest(selectedSearchUser.id)}
                                        >
                                            <Text style={{
                                                color: '#fff',
                                                fontSize: 16,
                                                fontWeight: 'bold',
                                            }}>친구 요청</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            ) : (
                                <Text style={{ color: '#999', marginTop: 50 }}>프로필 정보를 불러올 수 없습니다</Text>
                            )}
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
        </SafeAreaView>
    );
};

export default FriendsListScreen;
