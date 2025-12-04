import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '@/styles/ChatStyles';
import ImageModal from '@/components/ImageModal';
import { FRIEND_ENDPOINTS, CHAT_ENDPOINTS, USER_ENDPOINTS, API_BASE_URL } from '@/constants/api';

// 채팅방 데이터 타입
interface ChatRoom {
    friendId: number;
    friendName: string;
    friendUsername: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    avatar: string;
    avatarUrl?: string | null;
}

export default function ChatScreen() {
    // 채팅방 목록 상태
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // 읽은 채팅방 ID 목록 상태
    const [readChats, setReadChats] = useState<number[]>([]);
    
    // 프로필 모달 상태
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
    const [isHeartLiked, setIsHeartLiked] = useState(false);
    const [isFriendAdded, setIsFriendAdded] = useState(true); // 채팅 목록에서는 이미 친구이므로 true
    const [showImageModal, setShowImageModal] = useState(false);
    
    // 컴포넌트가 마운트될 때 채팅방 목록 불러오기
    useEffect(() => {
        loadChatRooms();
        loadReadChats();
    }, []);
    
    // 화면이 포커스될 때마다 채팅방 목록 새로고침
    useFocusEffect(
        React.useCallback(() => {
            loadChatRooms();
            loadReadChats();
        }, [])
    );
    
    // 읽은 채팅방 목록 불러오기 함수
    const loadReadChats = async () => {
        try {
            const stored = await AsyncStorage.getItem('readChats');
            if (stored) {
                setReadChats(JSON.parse(stored));
            }
        } catch (error) {
            console.error('채팅 목록 로드 실패:', error);
        }
    };
    
    // 친구 채팅방 목록 불러오기
    const loadChatRooms = async () => {
        try {
            setIsLoading(true);
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('Access Token이 없습니다.');
                setChatRooms([]);
                return;
            }

            // 친구 목록 가져오기
            const friendsResponse = await fetch(FRIEND_ENDPOINTS.getFriends, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!friendsResponse.ok) {
                throw new Error('친구 목록 조회 실패');
            }

            const friendsData = await friendsResponse.json();
            if (friendsData.resultType !== 'SUCCESS' || !friendsData.success?.friends) {
                setChatRooms([]);
                return;
            }

            const friends = friendsData.success.friends;
            
            // 각 친구와의 최근 메시지 가져오기
            const chatRoomsPromises = friends.map(async (friend: any) => {
                try {
                    // 최근 메시지 조회
                    const messagesResponse = await fetch(CHAT_ENDPOINTS.getMessages(friend.id), {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    let lastMessage = '';
                    let lastMessageTime = '';
                    let unreadCount = 0;

                    if (messagesResponse.ok) {
                        const messagesData = await messagesResponse.json();
                        if (messagesData.resultType === 'SUCCESS' && messagesData.success?.messages) {
                            const messages = messagesData.success.messages;
                            if (messages.length > 0) {
                                const lastMsg = messages[messages.length - 1];
                                lastMessage = lastMsg.imageUrl ? '[이미지]' : (lastMsg.text || '');
                                
                                // 시간 포맷팅
                                if (lastMsg.createdAt) {
                                    const msgDate = new Date(lastMsg.createdAt);
                                    const now = new Date();
                                    const diffMs = now.getTime() - msgDate.getTime();
                                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                    
                                    if (diffDays === 0) {
                                        // 오늘
                                        const hours = msgDate.getHours();
                                        const minutes = msgDate.getMinutes();
                                        const ampm = hours >= 12 ? '오후' : '오전';
                                        const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
                                        lastMessageTime = `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
                                    } else if (diffDays === 1) {
                                        lastMessageTime = '어제';
                                    } else if (diffDays < 7) {
                                        lastMessageTime = `${diffDays}일 전`;
                                    } else {
                                        const month = msgDate.getMonth() + 1;
                                        const day = msgDate.getDate();
                                        lastMessageTime = `${month}/${day}`;
                                    }
                                }

                                // 읽지 않은 메시지 수 계산 (상대방이 보낸 메시지 중 isRead가 false인 것)
                                unreadCount = messages.filter((msg: any) => 
                                    msg.fromUserId === friend.id && !msg.isRead
                                ).length;
                            }
                        }
                    }

                    // 아바타 텍스트 생성
                    const avatarText = friend.username ? friend.username.substring(0, 2) : (friend.name ? friend.name.substring(0, 2) : '친구');
                    
                    // 아바타 URL 처리
                    let avatarUrl = null;
                    if (friend.avatar) {
                        avatarUrl = friend.avatar.startsWith('http') 
                            ? friend.avatar 
                            : `${API_BASE_URL.replace('/v1/api', '')}${friend.avatar}`;
                    }

                    return {
                        friendId: friend.id,
                        friendName: friend.name || friend.username || '친구',
                        friendUsername: friend.username || friend.name || '친구',
                        lastMessage,
                        lastMessageTime,
                        unreadCount,
                        avatar: avatarText,
                        avatarUrl,
                    };
                } catch (error) {
                    console.error(`친구 ${friend.id}의 메시지 조회 실패:`, error);
                    // 에러 발생 시 기본값 반환
                    const avatarText = friend.username ? friend.username.substring(0, 2) : (friend.name ? friend.name.substring(0, 2) : '친구');
                    return {
                        friendId: friend.id,
                        friendName: friend.name || friend.username || '친구',
                        friendUsername: friend.username || friend.name || '친구',
                        lastMessage: '',
                        lastMessageTime: '',
                        unreadCount: 0,
                        avatar: avatarText,
                        avatarUrl: friend.avatar ? (friend.avatar.startsWith('http') ? friend.avatar : `${API_BASE_URL.replace('/v1/api', '')}${friend.avatar}`) : null,
                    };
                }
            });

            const chatRoomsData = await Promise.all(chatRoomsPromises);
            
            // 최근 메시지가 있는 순서로 정렬 (최근 메시지가 있는 것부터)
            const sortedChatRooms = chatRoomsData.sort((a, b) => {
                if (a.lastMessageTime && !b.lastMessageTime) return -1;
                if (!a.lastMessageTime && b.lastMessageTime) return 1;
                if (!a.lastMessageTime && !b.lastMessageTime) return 0;
                // 시간 순 정렬은 복잡하므로 일단 메시지가 있는 것부터
                return 0;
            });

            setChatRooms(sortedChatRooms);
        } catch (error) {
            console.error('채팅방 목록 로드 실패:', error);
            setChatRooms([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>채팅</Text>
                <View style={styles.headerRight} />
            </View>

            {/* 검색 바 */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="채팅방 검색"
                    placeholderTextColor="#999"
                />
            </View>

            {/* 채팅 목록 */}
            <ScrollView style={styles.chatList}>
                {isLoading ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={{ marginTop: 10, color: '#666' }}>채팅방 목록을 불러오는 중...</Text>
                    </View>
                ) : chatRooms.length === 0 ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: '#999', fontSize: 16 }}>채팅방이 없습니다.</Text>
                        <Text style={{ color: '#999', fontSize: 14, marginTop: 5 }}>친구와 대화를 시작해보세요!</Text>
                    </View>
                ) : (
                    chatRooms.map((chat) => {
                        // 읽은 채팅방인지 확인하여 unreadCount 조정
                        const actualUnreadCount = readChats.includes(chat.friendId) ? 0 : chat.unreadCount;
                        
                        return (
                            <TouchableOpacity 
                                key={chat.friendId} 
                                style={styles.chatItem}
                                onPress={() => {
                                    // 채팅방으로 이동 (친구 채팅 모드로)
                                    router.push({
                                        pathname: '/chat-room',
                                        params: {
                                            isFriendChat: 'true',
                                            partnerId: chat.friendId.toString(),
                                            name: chat.friendName,
                                            avatar: chat.avatar,
                                            partnerUsername: chat.friendUsername
                                        }
                                    });
                                }}
                            >
                                <View style={styles.chatLeft}>
                                    <TouchableOpacity 
                                        style={styles.avatarContainer}
                                        onPress={() => {
                                            setSelectedChat(chat);
                                            setIsHeartLiked(false);
                                            setIsFriendAdded(true);
                                            setShowProfileModal(true);
                                        }}
                                    >
                                        {chat.avatarUrl ? (
                                            <Image 
                                                source={{ uri: chat.avatarUrl }} 
                                                style={{ width: 50, height: 50, borderRadius: 25 }}
                                            />
                                        ) : (
                                            <Text style={styles.avatarText}>{chat.avatar}</Text>
                                        )}
                                        <View style={styles.onlineIndicator} />
                                    </TouchableOpacity>
                                </View>
                                
                                <View style={styles.chatCenter}>
                                    <Text style={styles.chatName}>{chat.friendName}</Text>
                                    <Text style={styles.lastMessage} numberOfLines={1}>
                                        {chat.lastMessage || '메시지가 없습니다'}
                                    </Text>
                                </View>
                                
                                <View style={styles.chatRight}>
                                    {chat.lastMessageTime ? (
                                        <Text style={styles.messageTime}>{chat.lastMessageTime}</Text>
                                    ) : null}
                                    {actualUnreadCount > 0 && (
                                        <View style={styles.unreadBadge}>
                                            <Text style={styles.unreadText}>{actualUnreadCount}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* 친구 프로필 모달 */}
            {showProfileModal && selectedChat && (
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
                                {selectedChat?.avatarUrl ? (
                                    <Image 
                                        source={{ uri: selectedChat.avatarUrl }} 
                                        style={{ width: 100, height: 100, borderRadius: 50 }}
                                    />
                                ) : (
                                    <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                                        {selectedChat?.avatar || '친구'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                            
                            {/* 사용자 정보 */}
                            <Text style={{
                                fontSize: 24,
                                fontWeight: 'bold',
                                color: '#333',
                                marginBottom: 5,
                            }}>
                                {selectedChat?.friendName || '친구'}
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
                                    안녕하세요! {selectedChat?.friendName || '친구'}입니다 ✨ 좋은 사람들과 함께 즐거운 대화 나누고 싶습니다. 많이 친해져요!
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
                                            router.push({
                                                pathname: '/chat-room',
                                                params: {
                                                    isFriendChat: 'true',
                                                    partnerId: selectedChat?.friendId.toString() || '',
                                                    name: selectedChat?.friendName || '',
                                                    avatar: selectedChat?.avatar || '',
                                                    partnerUsername: selectedChat?.friendUsername || ''
                                                }
                                            });
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
                                            // 친구 삭제 기능 (실제 구현 시 AsyncStorage에서 제거)
                                            Alert.alert(
                                                '친구 삭제',
                                                `${selectedChat?.friendName || '친구'}님을 친구 목록에서 삭제하시겠습니까?`,
                                                [
                                                    { text: '취소', style: 'cancel' },
                                                    { 
                                                        text: '삭제', 
                                                        style: 'destructive',
                                                        onPress: () => {
                                                            // 실제 친구 삭제 로직 구현 필요
                                                            Alert.alert('삭제됨', '친구가 삭제되었습니다.');
                                                        }
                                                    }
                                                ]
                                            );
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
                userName={selectedChat?.friendName || '친구'}
            />
        </SafeAreaView>
    );
}
