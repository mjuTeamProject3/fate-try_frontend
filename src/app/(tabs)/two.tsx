import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
// 스타일 임포트
import styles from '@/styles/Profile';
// 네비게이션 임포트
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageModal from '@/components/ImageModal';

export default function ProfileScreen() {
    // 친구 목록 데이터 (저장된 값 기반)
    const [friendsData, setFriendsData] = React.useState<{ id: number; name: string }[]>([]);

    // 친구 목록을 가나다 순으로 정렬하는 함수
    const sortFriendsByName = (friendsList: { id: number; name: string }[]) => {
        return friendsList.sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
    };

    useFocusEffect(
        React.useCallback(() => {
            (async () => {
                try {
                    const stored = await AsyncStorage.getItem('friends_list');
                    if (stored) {
                        const list = JSON.parse(stored) as Array<{ id: number; name: string }>;
                        const sortedList = sortFriendsByName(list);
                        setFriendsData(sortedList.slice(0, 6));
                    }
                } catch {}
            })();
        }, [])
    );

    const [showProfileModal, setShowProfileModal] = React.useState(false);
    const [selectedFriend, setSelectedFriend] = React.useState<{ id: number; name: string } | null>(null);
    const [isHeartLiked, setIsHeartLiked] = React.useState(false);
    const [isFriendAdded, setIsFriendAdded] = React.useState(true); // 친구목록에서는 이미 친구이므로 true
    const [showImageModal, setShowImageModal] = React.useState(false);
    const [showRandomModal, setShowRandomModal] = React.useState(false);
    // 사주 키워드 펼침 상태
    const [keywordsExpanded, setKeywordsExpanded] = React.useState(false);
    // 친구 프로필 모달의 키워드 펼침 상태
    const [friendKeywordsExpanded, setFriendKeywordsExpanded] = React.useState(false);
    
    // 내 사주 키워드 (8개로 설정)
    const myKeywords = [
        '친근함', '신뢰', '유머', '열정', '성실함', '긍정', '창의성', '도전'
    ];
    
    // 친구 키워드 가져오기 (고정된 키워드)
    const getFriendKeywords = (friendName: string) => {
        const allKeywords = ['사랑', '열정', '기쁨', '행복', '희망', '꿈', '자유', '평화', '건강', '부귀', '명예', '성공'];
        
        // 이름을 해시해서 고정된 키워드 가져오기
        let hash = 0;
        for (let i = 0; i < friendName.length; i++) {
            hash = ((hash << 5) - hash) + friendName.charCodeAt(i);
            hash = hash & hash;
        }
        
        const count = 8; // 친구는 8개
        const startIdx = Math.abs(hash) % (allKeywords.length - count + 1);
        return allKeywords.slice(startIdx, startIdx + count);
    };

    const openFriend = (friend: { id: number; name: string }) => {
        setSelectedFriend(friend);
        setIsHeartLiked(false); // 하트 상태 초기화
        setIsFriendAdded(true); // 친구 상태 초기화
        setKeywordsExpanded(false); // 키워드 펼침 상태 초기화 (내 프로필)
        setFriendKeywordsExpanded(false); // 친구 키워드 펼침 상태 초기화
        setShowProfileModal(true);
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
                            <Text style={styles.userName}>홍길동</Text>
                            <Text style={styles.userLocation}>경기도</Text>
                            <View style={styles.userStats}>
                                <View style={styles.statItem}>
                                    <AntDesign name="heart" size={16} color="#E53935" />
                                    <Text style={styles.statText}>1,250</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="person" size={16} color="#4CAF50" />
                                    <Text style={styles.statText}>42</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.editButton} onPress={() => router.push('/profile-edit')}>
                            <Ionicons name="pencil" size={20} color="#4CAF50" />
                            <Text style={styles.editButtonText}>편집</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* 사주 키워드 - 프로필 카드 전체 너비로 확장 */}
                    <View style={{ width: '100%', marginTop: 15 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>사주 키워드</Text>
                            {myKeywords.length > 4 && (
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
                                const displayCount = keywordsExpanded ? myKeywords.length : Math.min(myKeywords.length, 4);
                                const keywordsToShow = myKeywords.slice(0, displayCount);
                                
                                return keywordsToShow.map((keyword, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText} numberOfLines={1}>{keyword}</Text>
                                    </View>
                                ));
                            })()}
                        </View>
                    </View>
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
                            {friendsData.map((friend) => (
                                <TouchableOpacity key={friend.id} style={styles.friendItem} onPress={() => openFriend(friend)}>
                                    <View style={styles.friendAvatar}>
                                        <Ionicons name="person" size={24} color="white" />
                                    </View>
                                    <Text style={styles.friendName}>{friend.name}</Text>
                                </TouchableOpacity>
                            ))}
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
                                    {selectedFriend.name.substring(0, 2)}
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
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <Text style={{
                                        fontSize: 18,
                                        fontWeight: 'bold',
                                        color: '#333',
                                    }}>사주 키워드</Text>
                                    {(() => {
                                        const friendKeywords = selectedFriend ? getFriendKeywords(selectedFriend.name) : [];
                                        return friendKeywords.length > 4 ? (
                                            <TouchableOpacity 
                                                onPress={() => setFriendKeywordsExpanded(!friendKeywordsExpanded)}
                                            >
                                                <Ionicons 
                                                    name={friendKeywordsExpanded ? "chevron-up" : "chevron-down"} 
                                                    size={20} 
                                                    color="#4CAF50" 
                                                />
                                            </TouchableOpacity>
                                        ) : null;
                                    })()}
                                </View>
                                <View style={{ width: '100%' }}>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                        {(() => {
                                            const friendKeywords = selectedFriend ? getFriendKeywords(selectedFriend.name) : [];
                                            const displayCount = friendKeywordsExpanded ? friendKeywords.length : 4;
                                            const keywordsToShow = friendKeywords.slice(0, displayCount);
                                            
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
                                        onPress={() => {
                                            setShowProfileModal(false);
                                            // 친구 삭제 기능 (AsyncStorage에서 제거)
                                            const removeFriend = async (friendId: number) => {
                                                try {
                                                    const stored = await AsyncStorage.getItem('friends_list');
                                                    if (stored) {
                                                        const friends = JSON.parse(stored);
                                                        const updatedFriends = friends.filter((f: any) => f.id !== friendId);
                                                        await AsyncStorage.setItem('friends_list', JSON.stringify(updatedFriends));
                                                        setFriendsData(updatedFriends.slice(0, 6));
                                                    }
                                                } catch (error) {
                                                    console.error('친구 삭제 실패:', error);
                                                }
                                            };
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

            {/* 이미지 확대 모달 */}
            <ImageModal
                visible={showImageModal}
                onClose={() => setShowImageModal(false)}
                imageUri={null}
                userName={selectedFriend?.name || '친구'}
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
                            shadowColor: '#000',
                            shadowOffset: {
                                width: 0,
                                height: 2,
                            },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                            elevation: 5,
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