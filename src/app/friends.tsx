import React, { useEffect, useState } from 'react';
import { 
    ScrollView, 
    Text, 
    View, 
    TouchableOpacity, 
    SafeAreaView, 
    TextInput, 
    Modal,
    Alert,
    FlatList 
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import styles from '@/styles/FriendsListStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageModal from '@/components/ImageModal';

// 친구 데이터 타입 정의
interface Friend {
    id: number;
    name: string;
    avatarText: string;
    isOnline: boolean;
}

const FriendsListScreen = () => {
    const [friends, setFriends] = useState<Friend[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [newFriendName, setNewFriendName] = useState('');

    // 친구 목록을 가나다 순으로 정렬하는 함수
    const sortFriendsByName = (friendsList: Friend[]) => {
        return friendsList.sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
    };

    // 검색 필터링된 친구 목록 (가나다 순으로 정렬)
    const filteredFriends = sortFriendsByName(
        friends.filter(friend =>
            friend.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    // 친구 추가 함수
    const addFriend = async () => {
        if (newFriendName.trim()) {
            const newFriend: Friend = {
                id: friends.length + 1,
                name: newFriendName.trim(),
                avatarText: newFriendName.trim().substring(0, 2),
                isOnline: Math.random() > 0.5, // 랜덤으로 온라인 상태 설정
            };
            const next = sortFriendsByName([...friends, newFriend]);
            setFriends(next);
            await AsyncStorage.setItem('friends_list', JSON.stringify(next));
            setNewFriendName('');
            setShowAddFriendModal(false);
            Alert.alert('성공', '친구가 추가되었습니다!');
        }
    };

    // 친구 삭제 함수
    const removeFriend = (friendId: number) => {
        Alert.alert(
            '친구 삭제',
            '이 친구를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        const next = sortFriendsByName(friends.filter(friend => friend.id !== friendId));
                        setFriends(next);
                        await AsyncStorage.setItem('friends_list', JSON.stringify(next));
                    }
                }
            ]
        );
    };

    // 친구와 채팅 시작
    const startChat = (friend: Friend) => {
        router.push(`/chat/${friend.id}?name=${encodeURIComponent(friend.name)}`);
    };

    // 개별 친구 아이템 렌더링
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [isHeartLiked, setIsHeartLiked] = useState(false);
    const [isFriendAdded, setIsFriendAdded] = useState(true); // 친구목록에서는 이미 친구이므로 true
    const [showImageModal, setShowImageModal] = useState(false);

    const openFriend = (friend: Friend) => {
        setSelectedFriend(friend);
        setIsHeartLiked(false); // 하트 상태 초기화
        setIsFriendAdded(true); // 친구 상태 초기화
        setShowProfileModal(true);
    };

    const renderFriendItem = (friend: Friend) => (
        <TouchableOpacity 
            key={friend.id} 
            style={styles.friendItem}
            onLongPress={() => removeFriend(friend.id)}
            onPress={() => openFriend(friend)}
        >
            <View style={styles.friendAvatar}>
                <Text style={styles.friendAvatarText}>{friend.avatarText}</Text>
            </View>
            <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.name}</Text>
            </View>
            <TouchableOpacity 
                style={styles.messageButton}
                onPress={() => startChat(friend)}
            >
                <Ionicons name="chatbubble-outline" size={24} color="#4CAF50" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    // 초기 로드 (저장된 친구 목록)
    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem('friends_list');
                if (stored) {
                    const parsedFriends = JSON.parse(stored);
                    setFriends(sortFriendsByName(parsedFriends));
                } else {
                    // 기본 샘플 데이터
                    const seed: Friend[] = [
                        { id: 1, name: '김민수', avatarText: '김민', isOnline: true },
                        { id: 2, name: '박지영', avatarText: '박지', isOnline: false },
                        { id: 3, name: '이동현', avatarText: '이동', isOnline: true },
                    ];
                    const sortedSeed = sortFriendsByName(seed);
                    setFriends(sortedSeed);
                    await AsyncStorage.setItem('friends_list', JSON.stringify(sortedSeed));
                }
            } catch {}
        })();
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
                {filteredFriends.length > 0 ? (
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
                                    {selectedFriend.avatarText}
                                </Text>
                            </TouchableOpacity>
                            
                            {/* 사용자 정보 */}
                            <Text style={{
                                fontSize: 24,
                                fontWeight: 'bold',
                                color: '#333',
                                marginBottom: 5,
                            }}>
                                {selectedFriend.name}
                            </Text>
                            <Text style={{
                                fontSize: 16,
                                color: '#666',
                                marginBottom: 15,
                            }}>서울시 · 24세</Text>
                            
                            {/* 하트 수 */}
                            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 }}>
                                    <AntDesign name="heart" size={16} color="#E53935" />
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: 'bold',
                                        color: '#333',
                                        marginLeft: 5,
                                    }}>1,245</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 }}>
                                    <Ionicons name="person" size={16} color="#4CAF50" />
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: 'bold',
                                        color: '#333',
                                        marginLeft: 5,
                                    }}>89</Text>
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
                                    안녕하세요! {selectedFriend.name}입니다 ✨ 좋은 사람들과 함께 즐거운 대화 나누고 싶습니다. 많이 친해져요!
                                </Text>
                            </View>
                            
                            {/* 사주 키워드 */}
                            <View style={{ width: '100%', marginBottom: 20 }}>
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    color: '#333',
                                    marginBottom: 10,
                                }}>사주 키워드</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                    <View style={{
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
                                        }}>친근함</Text>
                                    </View>
                                    <View style={{
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
                                        }}>신뢰</Text>
                                    </View>
                                    <View style={{
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
                                        }}>유머</Text>
                                    </View>
                                </View>
                            </View>
                            
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
                onRequestClose={() => setShowAddFriendModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>친구 추가</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="친구 이름을 입력하세요"
                            value={newFriendName}
                            onChangeText={setNewFriendName}
                            autoFocus={true}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowAddFriendModal(false);
                                    setNewFriendName('');
                                }}
                            >
                                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                                    취소
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={addFriend}
                            >
                                <Text style={[styles.modalButtonText, styles.confirmButtonText]}>
                                    추가
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* 이미지 확대 모달 */}
            <ImageModal
                visible={showImageModal}
                onClose={() => setShowImageModal(false)}
                imageUri={null}
                userName={selectedFriend?.name || '친구'}
            />
        </SafeAreaView>
    );
};

export default FriendsListScreen;
