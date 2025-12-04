import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, TextInput, ScrollView, KeyboardAvoidingView, Platform, Image, Modal, Alert, Keyboard, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Socket } from 'socket.io-client';
import styles from '@/styles/ChatRoomStyles';
import ImageModal from '@/components/ImageModal';
import { getSocket, disconnectSocket } from '@/utils/socket';
import { USER_ENDPOINTS, UPLOAD_ENDPOINTS, CHAT_ENDPOINTS, API_BASE_URL } from '@/constants/api';

// 채팅 메시지 인터페이스
interface Message {
    id: number;
    text: string;
    time: string;
    isMine: boolean;
    image?: string; // 이미지 URI (선택적)
    isSystem?: boolean; // 시스템 메시지 여부
}

export default function ChatRoomScreen() {
    // URL 파라미터에서 사용자 정보 가져오기
    const params = useLocalSearchParams();
    const chatId = params.chatId ? Number(params.chatId) : null;
    const roomId = params.roomId as string || null; // 랜덤 채팅 roomId
    const partnerId = params.partnerId ? Number(params.partnerId) : null;
    const userName = params.name as string || params.partnerUsername as string || '사용자';
    const userAvatar = params.avatar as string || (userName ? userName.substring(0, 2) : '사용자');
    const isRandom = params.isRandom === 'true'; // 랜덤 채팅인지 확인
    const isFriendChat = params.isFriendChat === 'true'; // 친구 채팅인지 확인
    
    // 사주 궁합도 점수 (랜덤 채팅이면 params에서 받기, 아니면 랜덤 생성)
    const [compatibilityScore, setCompatibilityScore] = useState<number>(
        isRandom && params.compatibilityScore 
            ? Number(params.compatibilityScore) 
            : Math.floor(Math.random() * 21) + 80
    );
    const [verdict, setVerdict] = useState<string>(params.verdict as string || '');
    
    // Socket.io 연결
    const socketRef = useRef<Socket | null>(null);
    const messageIdCounter = useRef<number>(1);
    const currentUserIdRef = useRef<number | null>(null);
    // 최근 전송한 메시지 추적 (중복 방지용)
    const recentSentMessagesRef = useRef<Array<{ text: string; timestamp: number }>>([]);
    // 버튼 클릭으로 요청한 경우 자동 전송 플래그
    const shouldAutoSendTopicRef = useRef<boolean>(false);
    // 페이지 이동 중인지 추적 (소켓 에러 무시용)
    const isNavigatingAwayRef = useRef<boolean>(false);
    
    // 채팅방에 들어왔을 때 읽음 처리
    useEffect(() => {
        const markAsRead = async () => {
            if (isFriendChat && partnerId !== null) {
                try {
                    const stored = await AsyncStorage.getItem('readChats');
                    const readChats: number[] = stored ? JSON.parse(stored) : [];
                    
                    // 현재 채팅방이 목록에 없으면 추가
                    if (!readChats.includes(partnerId)) {
                        readChats.push(partnerId);
                        await AsyncStorage.setItem('readChats', JSON.stringify(readChats));
                    }
                } catch (error) {
                    console.error('읽음 처리 실패:', error);
                }
            } else if (chatId !== null) {
                try {
                    const stored = await AsyncStorage.getItem('readChats');
                    const readChats: number[] = stored ? JSON.parse(stored) : [];
                    
                    // 현재 채팅방이 목록에 없으면 추가
                    if (!readChats.includes(chatId)) {
                        readChats.push(chatId);
                        await AsyncStorage.setItem('readChats', JSON.stringify(readChats));
                    }
                } catch (error) {
                    console.error('읽음 처리 실패:', error);
                }
            }
        };
        markAsRead();
    }, [chatId, isFriendChat, partnerId]);
    
    // 메시지 입력 상태
    const [messageText, setMessageText] = useState('');
    
    // ScrollView 참조 (키보드가 올라올 때 스크롤하기 위해)
    const scrollViewRef = useRef<ScrollView>(null);
    
    // TextInput 참조 (키보드 이벤트 처리)
    const textInputRef = useRef<TextInput>(null);
    
    // 사진 선택 모달 상태
    const [showImageModal, setShowImageModal] = useState(false);
    
    // 프로필 모달 상태
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isHeartLiked, setIsHeartLiked] = useState(false);
    const [isFriendAdded, setIsFriendAdded] = useState(true); // 채팅방에서는 이미 친구이므로 true
    const [showImageExpandModal, setShowImageExpandModal] = useState(false);
    const [selectedMessageImage, setSelectedMessageImage] = useState<string | null>(null);
    const [isMessageImageModalVisible, setMessageImageModalVisible] = useState(false);
    // 상대방 프로필 데이터
    const [partnerProfile, setPartnerProfile] = useState<any>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    
    // 대화주제 추천 모달 상태
    const [showTopicModal, setShowTopicModal] = useState(false);
    
    // 나가기 확인 모달 상태
    const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
    
    // 대화주제 데이터 (저장된 주제 배열)
    const [savedTopics, setSavedTopics] = useState<string[]>([]);
    // 대화주제 요청 중인지 여부
    const [isRequestingTopics, setIsRequestingTopics] = useState(false);
    // 방 전체에서 최대 요청 횟수 도달 여부 (서버에서 관리)
    const [isMaxTopicsReached, setIsMaxTopicsReached] = useState<boolean>(false);
    
    // 대화주제 선택 함수 (주제를 바로 화면에 표시)
    const selectTopic = (topic: string) => {
        const now = Date.now();
        
        // 최근 전송한 메시지 목록에 추가 (중복 방지용)
        recentSentMessagesRef.current.push({ text: topic, timestamp: now });
        if (recentSentMessagesRef.current.length > 10) {
            recentSentMessagesRef.current.shift();
        }
        
        // 선택한 주제를 시스템 메시지로 전송 (양쪽 모두에게 표시)
        if (socketRef.current && roomId) {
            socketRef.current.emit('message:send', {
                roomId,
                text: topic,
                isSystem: true, // 시스템 메시지 플래그
            });
        }
        
        // 로컬 추가는 하지 않음 (Socket.io로 받아서 표시)
        setMessageText('');
        
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };
    
    // 전구 버튼 클릭 핸들러
    const handleTopicButtonClick = async () => {
        if (isRandom && socketRef.current && roomId) {
            // 최대 요청 횟수 도달 체크
            if (isMaxTopicsReached) {
                Alert.alert('알림', '이 채팅방에서는 더 이상 대화 주제를 추천받을 수 없습니다.');
                return;
            }
            
            // 이미 요청 중이면 무시 (중복 요청 방지)
            if (isRequestingTopics) {
                return;
            }
            
            // 서버에서 주제를 하나씩 관리하므로 바로 요청
            setIsRequestingTopics(true);
            shouldAutoSendTopicRef.current = true;
            socketRef.current.emit('topics:suggest', { roomId, context: '' });
        } else {
            // 일반 채팅이면 기존 방식 (랜덤 선택)
            const randomTopic = savedTopics[Math.floor(Math.random() * savedTopics.length)];
            if (randomTopic) {
                selectTopic(randomTopic);
            }
        }
    };

    // 나이 계산 함수
    const calculateAge = (birthdate: string | null): number | null => {
        if (!birthdate) return null;
        try {
            const date = new Date(birthdate);
            if (isNaN(date.getTime())) return null;
            const today = new Date();
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            const age = today.getFullYear() - year - (today.getMonth() < month || (today.getMonth() === month && today.getDate() < day) ? 1 : 0);
            return age;
        } catch (error) {
            return null;
        }
    };

    // 상대방 프로필 조회 함수
    const fetchPartnerProfile = async () => {
        if (!partnerId) return;
        
        try {
            setIsLoadingProfile(true);
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('Access Token이 없습니다.');
                return;
            }

            const response = await fetch(USER_ENDPOINTS.getProfileById(partnerId), {
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
                setPartnerProfile(data.success);
                // 좋아요 상태 설정
                setIsHeartLiked(data.success.isLiked || false);
            }
        } catch (error) {
            console.error('상대방 프로필 조회 오류:', error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    // 프로필 모달 열기 핸들러 (키보드도 함께 닫음)
    const handleOpenProfile = async () => {
        // 키보드 닫기
        Keyboard.dismiss();
        // 프로필 모달 열기
        setIsHeartLiked(false);
        setIsFriendAdded(true);
        setShowProfileModal(true);
        
        // partnerId가 있으면 프로필 조회 (랜덤 채팅 또는 친구 채팅)
        if (partnerId) {
            await fetchPartnerProfile();
        }
    };
    
    // 나가기 확인 모달 핸들러들
    const handleExitChat = () => {
        if (isRandom) {
            setShowExitConfirmModal(true);
        } else {
            router.back();
        }
    };

    const confirmExit = async () => {
        // 랜덤 채팅이면 Socket.io로 채팅 종료 이벤트 전송
        if (isRandom && socketRef.current && roomId) {
            socketRef.current.emit('chat:end', { roomId, reason: 'user_left' });
        }
        setShowExitConfirmModal(false);
        router.push('/(tabs)');
    };

    const cancelExit = () => {
        setShowExitConfirmModal(false);
    };
    
    // 채팅 메시지 목록
    const [messages, setMessages] = useState<Message[]>([]);
    
    // 친구 채팅 메시지 히스토리 로드
    useEffect(() => {
        if (!isFriendChat || !partnerId) return;

        const loadFriendChatHistory = async () => {
            try {
                const accessToken = await AsyncStorage.getItem('accessToken');
                if (!accessToken) {
                    console.error('Access Token이 없습니다.');
                    return;
                }

                // 현재 사용자 ID 가져오기
                try {
                    const parts = accessToken.split('.');
                    if (parts.length === 3) {
                        const decoded = JSON.parse(atob(parts[1]));
                        const payload = decoded.payload || decoded;
                        const userIdValue = payload.userId;
                        const userId = typeof userIdValue === 'number' 
                            ? userIdValue 
                            : parseInt(String(userIdValue), 10);
                        currentUserIdRef.current = userId;
                    }
                } catch (e) {
                    console.error('사용자 ID 가져오기 실패:', e);
                }

                console.log('[친구 채팅] 히스토리 로드 시작, partnerId:', partnerId, 'currentUserId:', currentUserIdRef.current);
                
                const response = await fetch(CHAT_ENDPOINTS.getMessages(partnerId), {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('[친구 채팅] 히스토리 조회 실패:', response.status, errorText);
                    throw new Error('메시지 히스토리 조회 실패');
                }

                const data = await response.json();
                console.log('[친구 채팅] 히스토리 응답:', {
                    resultType: data.resultType,
                    hasSuccess: !!data.success,
                    hasMessages: !!data.success?.messages,
                    messageCount: data.success?.messages?.length || 0
                });

                if (data.resultType === 'SUCCESS' && data.success?.messages) {
                    const loadedMessages: Message[] = data.success.messages.map((msg: any) => ({
                        id: msg.id,
                        text: msg.text || (msg.imageUrl ? '[이미지]' : ''),
                        time: new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                        isMine: msg.fromUserId === currentUserIdRef.current,
                        image: msg.imageUrl || undefined,
                    }));
                    console.log('[친구 채팅] 메시지 로드 완료:', loadedMessages.length, '개');
                    setMessages(loadedMessages);
                    
                    // 스크롤을 맨 아래로
                    setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: false });
                    }, 100);
                } else {
                    console.warn('[친구 채팅] 메시지가 없거나 형식이 잘못됨:', data);
                }
            } catch (error) {
                console.error('친구 채팅 히스토리 로드 실패:', error);
            }
        };

        loadFriendChatHistory();
    }, [isFriendChat, partnerId]);

    // 친구 채팅 메시지 전송 함수
    const sendFriendMessage = async (text: string, imageUrl: string | null) => {
        if (!partnerId) return;

        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('Access Token이 없습니다.');
                Alert.alert('오류', '로그인이 필요합니다.');
                return;
            }

            const response = await fetch(CHAT_ENDPOINTS.sendMessage, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    toUserId: partnerId,
                    text: text || '',
                    imageUrl: imageUrl || null,
                }),
            });

            if (!response.ok) {
                let errorMessage = '메시지 전송에 실패했습니다.';
                try {
                    const errorData = await response.json();
                    // 백엔드 에러 응답 형식: { resultType: "FAIL", error: { errorCode, reason, data }, success: null }
                    if (errorData.error) {
                        if (typeof errorData.error === 'string') {
                            errorMessage = errorData.error;
                        } else if (errorData.error.reason) {
                            errorMessage = errorData.error.reason;
                        } else if (errorData.error.errorCode) {
                            errorMessage = errorData.error.errorCode;
                        }
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (parseError) {
                    // JSON 파싱 실패 시 상태 코드로 메시지 생성
                    errorMessage = `서버 오류 (${response.status})`;
                }
                throw new Error(errorMessage);
            }

            // 백엔드에서 Socket.io로 상대방에게 전달하므로
            // 여기서는 추가 작업 불필요 (이미 로컬에 메시지 추가됨)
            console.log('[친구 채팅] 메시지 전송 완료');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[친구 채팅] 메시지 전송 실패:', errorMessage);
            Alert.alert('오류', errorMessage || '메시지 전송에 실패했습니다.');
        }
    };

    // Socket.io 연결 및 메시지 수신 설정
    useEffect(() => {
        // 랜덤 채팅이면 roomId 필요, 친구 채팅이면 partnerId 필요
        if ((isRandom && !roomId) || (isFriendChat && !partnerId)) return;

        let mounted = true;

        const initSocketConnection = async () => {
            try {
                // 현재 사용자 ID 가져오기 (JWT 토큰에서)
                try {
                    const accessToken = await AsyncStorage.getItem('accessToken');
                    if (accessToken) {
                        try {
                            // JWT 토큰 디코딩 (간단한 방법)
                            const parts = accessToken.split('.');
                            if (parts.length !== 3) {
                                throw new Error('Invalid JWT token format');
                            }
                            const decoded = JSON.parse(atob(parts[1]));
                            // 백엔드 JWT 구조: { payload: { userId, type, issuer }, iat, exp }
                            // 따라서 payload.payload.userId로 접근해야 함
                            const payload = decoded.payload || decoded;
                            const userIdValue = payload.userId;
                            
                            // userId를 숫자로 변환
                            const userId = typeof userIdValue === 'number' 
                                ? userIdValue 
                                : parseInt(String(userIdValue), 10);
                            
                            if (isNaN(userId)) {
                                throw new Error(`userId is not a valid number: ${userIdValue}`);
                            }
                            
                            currentUserIdRef.current = userId;
                            console.log('[채팅방] 현재 사용자 ID:', currentUserIdRef.current, '(타입:', typeof currentUserIdRef.current, ')');
                        } catch (decodeError) {
                            console.error('[채팅방] JWT 디코딩 실패:', decodeError);
                            // 디코딩 실패 시에도 계속 진행 (최근 메시지 비교로 대체)
                            currentUserIdRef.current = null;
                        }
                    } else {
                        console.error('[채팅방] accessToken이 없습니다');
                        currentUserIdRef.current = null;
                    }
                } catch (e) {
                    console.error('[채팅방] 사용자 ID 가져오기 실패:', e);
                    currentUserIdRef.current = null;
                }

                const socket = await getSocket();
                if (!socket) {
                    console.error('[채팅방] Socket 연결 실패');
                    return;
                }

                socketRef.current = socket;

                // 서버에서 이미 join 처리되었으므로 클라이언트에서는 추가 작업 불필요
                // 단, roomId를 확인하여 연결 상태 확인
                console.log('[채팅방] Socket 연결 완료, roomId:', roomId, 'partnerId:', partnerId, 'isFriendChat:', isFriendChat, 'currentUserId:', currentUserIdRef.current);

                // 입장 시 자동 요청 제거 (서버에서 첫 요청 시 주제 생성)

                // 소켓 에러 핸들러 (페이지 이동 중인 경우 에러 무시)
                socket.on('connect_error', (error) => {
                    if (isNavigatingAwayRef.current) {
                        // 페이지 이동 중이면 에러 무시
                        console.log('[채팅방] 페이지 이동 중이므로 소켓 에러 무시');
                        return;
                    }
                    console.error('[채팅방] Socket 연결 에러:', error);
                });

                socket.on('error', (error) => {
                    if (isNavigatingAwayRef.current) {
                        // 페이지 이동 중이면 에러 무시
                        console.log('[채팅방] 페이지 이동 중이므로 소켓 에러 무시');
                        return;
                    }
                    console.error('[채팅방] Socket 에러:', error);
                });

                // 메시지 수신 이벤트 리스너
                socket.on('message:new', (data: {
                    userId: number;
                    text: string;
                    imageUrl: string | null;
                    ts: number;
                    isSystem?: boolean;
                }) => {
                    if (!mounted) return;

                    console.log('[채팅방] 메시지 수신:', {
                        userId: data.userId,
                        currentUserId: currentUserIdRef.current,
                        text: data.text.substring(0, 20),
                        isSystem: data.isSystem
                    });

                    // 시스템 메시지(대화 주제 추천)인 경우 양쪽 모두에게 표시
                    if (data.isSystem) {
                        // 시스템 메시지는 양쪽 모두에게 보여야 하므로 항상 표시
                        // 중복 체크는 서버에서 이미 처리되므로 클라이언트에서는 하지 않음
                        const newMessage: Message = {
                            id: messageIdCounter.current++,
                            text: data.text,
                            time: new Date(data.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                            isMine: false,
                            isSystem: true,
                            image: data.imageUrl || undefined,
                        };
                        setMessages(prev => [...prev, newMessage]);
                        
                        // 최근 전송한 메시지 목록에서 제거 (이미 표시되었으므로)
                        const messageTime = new Date(data.ts).getTime();
                        recentSentMessagesRef.current = recentSentMessagesRef.current.filter(msg => {
                            const timeDiff = Math.abs(messageTime - msg.timestamp);
                            return !(msg.text === data.text && timeDiff < 5000);
                        });
                        return;
                    }

                    // 내가 보낸 일반 메시지는 무시 (이미 로컬에서 추가했으므로)
                    // 방법 1: userId 비교 (타입 변환 포함)
                    const receivedUserId = typeof data.userId === 'number' ? data.userId : parseInt(String(data.userId), 10);
                    const currentUserId = currentUserIdRef.current !== null 
                        ? (typeof currentUserIdRef.current === 'number' ? currentUserIdRef.current : parseInt(String(currentUserIdRef.current), 10))
                        : null;
                    
                    if (currentUserId !== null && !isNaN(receivedUserId) && !isNaN(currentUserId) && receivedUserId === currentUserId) {
                        console.log('[채팅방] 내가 보낸 메시지 무시 (userId 비교):', data.text ? data.text.substring(0, 20) : '이미지', 'userId:', receivedUserId);
                        return;
                    }
                    
                    // 방법 2: 최근 전송한 메시지와 비교 (userId가 제대로 설정되지 않은 경우 대비)
                    const messageTime = new Date(data.ts).getTime();
                    const isRecentSentMessage = recentSentMessagesRef.current.some(msg => {
                        const timeDiff = Math.abs(messageTime - msg.timestamp);
                        // 텍스트 메시지 비교 (2초 이내)
                        if (data.text && msg.text === data.text && timeDiff < 3000) {
                            return true;
                        }
                        // 이미지 메시지 비교 (2초 이내)
                        if (data.imageUrl && msg.text.startsWith('IMAGE:') && msg.text === `IMAGE:${data.imageUrl}` && timeDiff < 3000) {
                            return true;
                        }
                        return false;
                    });
                    
                    if (isRecentSentMessage) {
                        console.log('[채팅방] 내가 보낸 메시지 무시 (최근 메시지 비교):', data.text ? data.text.substring(0, 20) : '이미지');
                        // 최근 메시지 목록에서 제거 (메모리 절약)
                        recentSentMessagesRef.current = recentSentMessagesRef.current.filter(msg => {
                            const timeDiff = Math.abs(messageTime - msg.timestamp);
                            if (data.text && msg.text === data.text && timeDiff < 3000) return false;
                            if (data.imageUrl && msg.text.startsWith('IMAGE:') && msg.text === `IMAGE:${data.imageUrl}` && timeDiff < 3000) return false;
                            return true;
                        });
                        return;
                    }
                    
                    // userId가 설정되지 않았고 최근 메시지도 아닌 경우, 경고 로그 출력
                    if (currentUserIdRef.current === null) {
                        console.warn('[채팅방] currentUserIdRef가 설정되지 않음. 메시지를 상대방 메시지로 처리합니다:', {
                            receivedUserId,
                            text: data.text ? data.text.substring(0, 20) : '이미지'
                        });
                    }

                    // 상대방이 보낸 일반 메시지만 추가
                    const newMessage: Message = {
                        id: messageIdCounter.current++,
                        text: data.text,
                        time: new Date(data.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                        isMine: false,
                        image: data.imageUrl || undefined,
                    };

                    console.log('[채팅방] 상대방 메시지 추가:', data.text.substring(0, 20));
                    setMessages(prev => [...prev, newMessage]);
                });

                // 신고 성공 이벤트 (신고한 사람에게만 전송)
                socket.on('user:reported', (data: { ok: boolean, error?: string }) => {
                    if (!mounted) return;
                    if (data.ok) {
                        Alert.alert('신고 접수', '신고가 접수되었습니다.', [
                            { 
                                text: '확인', 
                                onPress: () => {
                                    // 페이지 이동 중 플래그 설정
                                    isNavigatingAwayRef.current = true;
                                    // 소켓 명시적 disconnect
                                    if (socketRef.current) {
                                        socketRef.current.disconnect();
                                        socketRef.current = null;
                                    }
                                    disconnectSocket();
                                    // 페이지 이동
                                    router.replace('/(tabs)');
                                }
                            }
                        ]);
                    } else {
                        Alert.alert('오류', data.error || '신고 처리 중 오류가 발생했습니다.');
                    }
                });

                // 채팅 종료 이벤트 (신고당한 사람에게만 전송)
                socket.on('chat:ended', (data: { reason: string, reporterId?: number }) => {
                    console.log('[채팅방] 채팅 종료:', data.reason, 'reporterId:', data.reporterId);
                    if (mounted) {
                        let message = '';
                        if (data.reason === 'reported') {
                            message = '상대의 신고로 인해 채팅이 종료되었습니다.';
                        } else {
                            message = '상대방이 채팅방을 나갔습니다.';
                        }
                        Alert.alert('채팅 종료', message, [
                            { 
                                text: '확인', 
                                onPress: () => {
                                    // 페이지 이동 중 플래그 설정
                                    isNavigatingAwayRef.current = true;
                                    // 소켓 명시적 disconnect
                                    if (socketRef.current) {
                                        socketRef.current.disconnect();
                                        socketRef.current = null;
                                    }
                                    disconnectSocket();
                                    // 페이지 이동
                                    router.replace('/(tabs)');
                                }
                            }
                        ]);
                    }
                });

                // 친구 채팅이 아닐 때만 대화 주제 추천 이벤트 등록
                if (!isFriendChat) {
                    // 대화 주제 수신 이벤트 (방 전체에 브로드캐스트됨)
                    socket.on('topics:list', (data: { topics: Array<{ topic: string }> | string[], maxReached?: boolean }) => {
                        if (!mounted) return;
                        setIsRequestingTopics(false);
                        
                        // 최대 요청 횟수 도달 체크
                        if (data.maxReached) {
                            setIsMaxTopicsReached(true);
                            Alert.alert('알림', '이 채팅방에서는 더 이상 대화 주제를 추천받을 수 없습니다.');
                            return;
                        }
                        
                        // topics가 객체 배열인지 문자열 배열인지 확인
                        const topics = Array.isArray(data.topics) && data.topics.length > 0
                            ? (typeof data.topics[0] === 'string' 
                                ? data.topics as string[]
                                : (data.topics as Array<{ topic: string }>).map((t: { topic: string }) => t.topic))
                            : [];
                        
                        if (topics.length > 0) {
                            // 서버에서 주제를 하나씩 전송하므로 첫 번째 주제를 바로 사용
                            const topic = topics[0];
                            // 버튼 클릭으로 요청한 경우에만 자동 전송
                            if (shouldAutoSendTopicRef.current) {
                                selectTopic(topic);
                                shouldAutoSendTopicRef.current = false; // 플래그 리셋
                            } else {
                                // 상대방이 요청한 경우에도 주제를 받지만 자동 전송하지 않음
                                // (이미 상대방이 전송했을 수 있으므로)
                                // 필요시 모달에 표시할 수 있도록 저장
                                setSavedTopics([topic]);
                            }
                        } else {
                            Alert.alert('알림', '대화 주제를 가져올 수 없습니다.');
                        }
                    });

                    // 이미 추천된 경우 (이제 사용하지 않지만 호환성을 위해 유지)
                    socket.on('topics:already', (data: { message: string }) => {
                        setIsRequestingTopics(false);
                        Alert.alert('알림', data.message);
                    });
                }

                // 친구 채팅일 때 friend:message 이벤트 등록
                if (isFriendChat && partnerId) {
                    console.log('[친구 채팅] friend:message 이벤트 리스너 등록, partnerId:', partnerId);
                    socket.on('friend:message', (data: {
                        fromUserId: number;
                        toUserId: number;
                        text: string;
                        imageUrl: string | null;
                        createdAt: string;
                    }) => {
                        if (!mounted) return;

                        console.log('[친구 채팅] friend:message 이벤트 수신:', {
                            fromUserId: data.fromUserId,
                            toUserId: data.toUserId,
                            partnerId: partnerId,
                            text: data.text?.substring(0, 20),
                            matches: data.fromUserId === partnerId || Number(data.fromUserId) === Number(partnerId)
                        });

                        // 상대방이 보낸 메시지만 표시 (타입 변환 포함)
                        const fromUserIdNum = typeof data.fromUserId === 'number' ? data.fromUserId : Number(data.fromUserId);
                        const partnerIdNum = typeof partnerId === 'number' ? partnerId : Number(partnerId);
                        
                        if (fromUserIdNum === partnerIdNum) {
                            const newMessage: Message = {
                                id: messageIdCounter.current++,
                                text: data.text || (data.imageUrl ? '[이미지]' : ''),
                                time: new Date(data.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                                isMine: false,
                                image: data.imageUrl || undefined,
                            };
                            console.log('[친구 채팅] 메시지 추가:', newMessage.text?.substring(0, 20) || '이미지');
                            setMessages(prev => [...prev, newMessage]);
                        } else {
                            console.log('[친구 채팅] 메시지 무시: fromUserId 불일치', {
                                fromUserId: fromUserIdNum,
                                partnerId: partnerIdNum
                            });
                        }
                    });
                }
            } catch (error) {
                console.error('[채팅방] Socket 초기화 오류:', error);
            }
        };

        initSocketConnection();

        return () => {
            mounted = false;
            isNavigatingAwayRef.current = true; // cleanup 시 페이지 이동 중으로 표시
            if (socketRef.current) {
                socketRef.current.off('message:new');
                socketRef.current.off('user:reported');
                socketRef.current.off('chat:ended');
                if (!isFriendChat) {
                    socketRef.current.off('topics:list');
                    socketRef.current.off('topics:already');
                }
                if (isFriendChat) {
                    socketRef.current.off('friend:message');
                }
                socketRef.current.off('connect_error');
                socketRef.current.off('error');
                // 소켓 disconnect
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isRandom, roomId, partnerId, isFriendChat]);

    // 메시지 전송 핸들러
    const handleSendMessage = () => {
        if (messageText.trim() === '') return;
        
        const text = messageText.trim();
        setMessageText('');

        // 로컬 메시지 추가 (즉시 표시) - 먼저 추가하여 즉시 피드백 제공
        const now = Date.now();
        const newMessage: Message = {
            id: messageIdCounter.current++,
            text,
            time: new Date(now).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            isMine: true
        };
        
        // 최근 전송한 메시지 목록에 추가 (중복 방지용)
        recentSentMessagesRef.current.push({ text, timestamp: now });
        // 오래된 메시지 제거 (최근 10개만 유지)
        if (recentSentMessagesRef.current.length > 10) {
            recentSentMessagesRef.current.shift();
        }
        
        console.log('[채팅방] 메시지 전송:', text.substring(0, 20), 'currentUserId:', currentUserIdRef.current);
        setMessages(prev => [...prev, newMessage]);

        // 랜덤 채팅이면 Socket.io로 전송
        if (isRandom && socketRef.current && roomId) {
            socketRef.current.emit('message:send', {
                roomId,
                text,
            });
        }
        
        // 친구 채팅이면 REST API로 전송
        if (isFriendChat && partnerId) {
            sendFriendMessage(text, null);
        }
        
        // 전송 후 스크롤을 맨 아래로 이동 (키보드는 유지)
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };
    
    // 키보드가 올라올 때 스크롤 처리
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                // 키보드가 올라올 때 ScrollView를 맨 아래로 스크롤
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        );
        
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                // 키보드가 내려갈 때는 처리하지 않음
            }
        );
        
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);
    
    // 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);
    
    // 궁합도 등급 계산
    const getCompatibilityRating = (score: number) => {
        if (score >= 95) return '최고의 인연';
        if (score >= 90) return '매우 좋음';
        if (score >= 85) return '좋음';
        return '괜찮음';
    };
    
    // 궁합도 설명 생성
    const getCompatibilityDescription = (score: number) => {
        if (score >= 95) return '운명적인 만남입니다! 서로에게 큰 행운을 가져다줄 최고의 궁합이에요. ✨';
        if (score >= 90) return '매우 좋은 궁합이에요! 서로를 잘 이해하고 좋은 관계를 만들어갈 수 있어요. 💫';
        if (score >= 85) return '좋은 인연이에요! 노력한다면 좋은 관계를 만들어갈 수 있어요. 🌟';
        return '나쁘지 않은 궁합이에요. 서로 배려하고 이해한다면 좋은 관계가 될 거예요. ⭐';
    };
    
    // 이미지 업로드 함수
    const uploadImage = async (imageUri: string): Promise<string | null> => {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                Alert.alert('오류', '로그인이 필요합니다.');
                return null;
            }

            // FormData 생성
            const formData = new FormData();
            const filename = imageUri.split('/').pop() || 'image.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            
            formData.append('file', {
                uri: imageUri,
                name: filename,
                type: type,
            } as any);

            // 서버에 업로드
            const response = await fetch(UPLOAD_ENDPOINTS.image, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('이미지 업로드 실패');
            }

            const data = await response.json();
            // 백엔드에서 반환하는 url이 상대 경로이므로 절대 경로로 변환
            const imageUrl = data.url.startsWith('http') 
                ? data.url 
                : `${API_BASE_URL.replace('/v1/api', '')}${data.url}`;
            
            return imageUrl;
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            Alert.alert('오류', '이미지 업로드 중 문제가 발생했습니다.');
            return null;
        }
    };
    
    // 갤러리에서 사진 선택
    const pickImageFromGallery = async () => {
        try {
            // 권한 요청
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (permissionResult.granted === false) {
                Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
                return;
            }
            
            // 이미지 선택
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            
            if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                const now = Date.now();
                
                // 로컬 메시지 추가 (먼저 추가 - 로컬 URI 사용)
                const newMessage: Message = {
                    id: messageIdCounter.current++,
                    text: '',
                    time: new Date(now).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                    isMine: true,
                    image: imageUri
                };
                
                setMessages(prev => [...prev, newMessage]);
                setShowImageModal(false);
                
                // 이미지 업로드
                const uploadedImageUrl = await uploadImage(imageUri);
                
                if (uploadedImageUrl) {
                    // 업로드된 URL로 메시지 업데이트 (로컬 URI를 서버 URL로 교체)
                    setMessages(prev => prev.map(msg => 
                        msg.id === newMessage.id 
                            ? { ...msg, image: uploadedImageUrl }
                            : msg
                    ));
                    
                    // 최근 전송한 메시지 목록에 추가 (중복 방지용)
                    recentSentMessagesRef.current.push({ text: `IMAGE:${uploadedImageUrl}`, timestamp: now });
                    if (recentSentMessagesRef.current.length > 10) {
                        recentSentMessagesRef.current.shift();
                    }
                    
                    // 랜덤 채팅이면 Socket.io로 전송
                    if (isRandom && socketRef.current && roomId) {
                        socketRef.current.emit('message:send', {
                            roomId,
                            text: '',
                            imageUrl: uploadedImageUrl,
                        });
                    }
                    // 친구 채팅이면 REST API로 전송
                    else if (isFriendChat && partnerId) {
                        await sendFriendMessage('', uploadedImageUrl);
                    }
                } else {
                    // 업로드 실패 시 로컬 메시지 제거
                    setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
                }
            }
        } catch (error) {
            console.error('이미지 선택 오류:', error);
            Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
        }
    };
    
    // 카메라로 사진 촬영
    const takePhotoWithCamera = async () => {
        try {
            // 권한 요청
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            
            if (permissionResult.granted === false) {
                Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
                return;
            }
            
            // 카메라 실행
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            
            if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                const now = Date.now();
                
                // 로컬 메시지 추가 (먼저 추가 - 로컬 URI 사용)
                const newMessage: Message = {
                    id: messageIdCounter.current++,
                    text: '',
                    time: new Date(now).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                    isMine: true,
                    image: imageUri
                };
                
                setMessages(prev => [...prev, newMessage]);
                setShowImageModal(false);
                
                // 이미지 업로드
                const uploadedImageUrl = await uploadImage(imageUri);
                
                if (uploadedImageUrl) {
                    // 업로드된 URL로 메시지 업데이트 (로컬 URI를 서버 URL로 교체)
                    setMessages(prev => prev.map(msg => 
                        msg.id === newMessage.id 
                            ? { ...msg, image: uploadedImageUrl }
                            : msg
                    ));
                    
                    // 최근 전송한 메시지 목록에 추가 (중복 방지용)
                    recentSentMessagesRef.current.push({ text: `IMAGE:${uploadedImageUrl}`, timestamp: now });
                    if (recentSentMessagesRef.current.length > 10) {
                        recentSentMessagesRef.current.shift();
                    }
                    
                    // 랜덤 채팅이면 Socket.io로 전송
                    if (isRandom && socketRef.current && roomId) {
                        socketRef.current.emit('message:send', {
                            roomId,
                            text: '',
                            imageUrl: uploadedImageUrl,
                        });
                    }
                    // 친구 채팅이면 REST API로 전송
                    else if (isFriendChat && partnerId) {
                        await sendFriendMessage('', uploadedImageUrl);
                    }
                } else {
                    // 업로드 실패 시 로컬 메시지 제거
                    setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
                }
            }
        } catch (error) {
            console.error('카메라 촬영 오류:', error);
            Alert.alert('오류', '사진을 촬영하는 중 오류가 발생했습니다.');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* 상단 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={handleExitChat}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.headerCenter}
                    onPress={handleOpenProfile}
                >
                    <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarText}>{userAvatar}</Text>
                    </View>
                    <Text style={styles.headerTitle}>{userName}</Text>
                </TouchableOpacity>
                
                <View style={styles.headerRight}>
                    {isRandom && (
                        <TouchableOpacity 
                            onPress={() => {
                                router.push({
                                    pathname: '/report',
                                    params: {
                                        partnerId: partnerId ? String(partnerId) : '',
                                        partnerUsername: userName,
                                        roomId: roomId || '',
                                        isRandom: 'true'
                                    }
                                });
                            }}
                        >
                            <Ionicons name="flag-outline" size={24} color="#333" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* 채팅 메시지 영역 */}
            <ScrollView 
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
            >
                {/* 랜덤 채팅일 때만 사주 궁합도 카드 표시 */}
                {isRandom && (
                    <View style={styles.compatibilityCard}>
                        <View style={styles.compatibilityHeader}>
                            <Ionicons name="sparkles" size={20} color="#FFD700" style={styles.compatibilityIcon} />
                            <Text style={styles.compatibilityTitle}>사주 궁합도</Text>
                        </View>
                        
                        <View style={styles.compatibilityScoreContainer}>
                            <Text style={styles.compatibilityScore}>{Math.round(compatibilityScore)}점</Text>
                            <Text style={styles.compatibilityScoreLabel}>100점 만점</Text>
                        </View>
                        
                        <View style={styles.compatibilityRating}>
                            <Text style={styles.compatibilityRatingText}>{getCompatibilityRating(compatibilityScore)}</Text>
                            <Ionicons name="star" size={16} color="#4CAF50" />
                        </View>
                        
                        <View style={styles.compatibilityDescription}>
                            <Text style={styles.compatibilityDescriptionText}>
                                {verdict || getCompatibilityDescription(compatibilityScore)}
                            </Text>
                        </View>
                    </View>
                )}
                
                {messages.map((message, index) => {
                    // 고유한 key 생성 (ID와 인덱스, 타임스탬프 조합)
                    const uniqueKey = `msg-${message.id}-${index}-${message.time}`;
                    
                    // 시스템 메시지인 경우 중앙에 표시
                    if (message.isSystem) {
                        return (
                            <View key={uniqueKey} style={{ alignItems: 'center', marginVertical: 15 }}>
                                <View style={{
                                    backgroundColor: '#E8F5E9',
                                    borderRadius: 12,
                                    paddingVertical: 8,
                                    paddingHorizontal: 16,
                                    maxWidth: '80%',
                                }}>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#2E7D32',
                                        textAlign: 'center',
                                        lineHeight: 20
                                    }}>
                                        {message.text}
                                    </Text>
                                </View>
                            </View>
                        );
                    }

                    return (
                    <View 
                        key={uniqueKey} 
                        style={[
                            styles.messageWrapper,
                            message.isMine ? styles.myMessageWrapper : styles.otherMessageWrapper
                        ]}
                    >
                        {!message.isMine && (
                            <TouchableOpacity 
                                style={styles.messageAvatar}
                                onPress={handleOpenProfile}
                            >
                                <Text style={styles.messageAvatarText}>{userAvatar}</Text>
                            </TouchableOpacity>
                        )}
                        
                        <View style={styles.messageContent}>
                            {/* 이미지가 있는 경우 */}
                            {message.image ? (
                                <View>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            setSelectedMessageImage(message.image || null);
                                            setMessageImageModalVisible(true);
                                        }}
                                        accessible
                                        accessibilityRole="imagebutton"
                                        accessibilityLabel="보낸 사진 크게 보기"
                                    >
                                        <Image 
                                            source={{ uri: message.image }}
                                            style={styles.messageImage}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                    {message.text && (
                                        <View 
                                            style={[
                                                styles.messageBubble,
                                                message.isMine ? styles.myMessageBubble : styles.otherMessageBubble,
                                                styles.messageBubbleWithImage
                                            ]}
                                        >
                                            <Text 
                                                style={[
                                                    styles.messageText,
                                                    message.isMine ? styles.myMessageText : styles.otherMessageText
                                                ]}
                                            >
                                                {message.text}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View 
                                    style={[
                                        styles.messageBubble,
                                        message.isMine ? styles.myMessageBubble : styles.otherMessageBubble
                                    ]}
                                >
                                    <Text 
                                        style={[
                                            styles.messageText,
                                            message.isMine ? styles.myMessageText : styles.otherMessageText
                                        ]}
                                    >
                                        {message.text}
                                    </Text>
                                </View>
                            )}
                            <Text 
                                style={[
                                    styles.messageTime,
                                    message.isMine ? styles.myMessageTime : styles.otherMessageTime
                                ]}
                            >
                                {message.time}
                            </Text>
                        </View>
                    </View>
                    );
                })}
            </ScrollView>

            {/* 하단 입력 영역 */}
            <View style={styles.inputContainer}>
                {/* 친구 채팅일 때는 전구 버튼 숨김 */}
                {!isFriendChat && (
                    <TouchableOpacity 
                        style={styles.topicButton}
                        onPress={handleTopicButtonClick}
                        disabled={isRequestingTopics}
                    >
                        <Text style={{ fontSize: 20 }}>💡</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => setShowImageModal(true)}
                >
                    <Ionicons name="add-circle-outline" size={28} color="#4CAF50" />
                </TouchableOpacity>
                
                <View style={styles.textInputWrapper}>
                    <TextInput
                        ref={textInputRef}
                        style={styles.textInput}
                        placeholder="메시지를 입력하세요..."
                        placeholderTextColor="#999"
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        onFocus={() => {
                            // TextInput에 포커스가 갈 때 스크롤을 맨 아래로 이동
                            setTimeout(() => {
                                scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 100);
                        }}
                    />
                </View>
                
                <TouchableOpacity 
                    style={styles.sendButton}
                    onPress={handleSendMessage}
                >
                    <Ionicons name="send" size={24} color="#4CAF50" />
                </TouchableOpacity>
            </View>
            
            {/* 사진 선택 모달 */}
            <Modal
                visible={showImageModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowImageModal(false)}
            >
                <TouchableOpacity 
                    style={styles.imageModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowImageModal(false)}
                >
                    <View style={styles.imageOptionsContainer}>
                        <Text style={styles.imageOptionsTitle}>사진 선택</Text>
                        
                        <TouchableOpacity 
                            style={styles.imageOption}
                            onPress={pickImageFromGallery}
                        >
                            <Ionicons name="images-outline" size={24} color="#4CAF50" />
                            <Text style={styles.imageOptionText}>갤러리에서 선택</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.imageOption}
                            onPress={takePhotoWithCamera}
                        >
                            <Ionicons name="camera-outline" size={24} color="#4CAF50" />
                            <Text style={styles.imageOptionText}>카메라로 촬영</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.imageOption, styles.cancelOption]}
                            onPress={() => setShowImageModal(false)}
                        >
                            <Ionicons name="close-circle-outline" size={24} color="#E53935" />
                            <Text style={[styles.imageOptionText, styles.cancelOptionText]}>취소</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 친구 프로필 모달 */}
            <Modal
                visible={showProfileModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowProfileModal(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
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
                                    setShowProfileModal(false);
                                    // 모달 닫을 때는 키보드를 다시 열지 않음
                                }}
                                style={{ padding: 5 }}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        {isLoadingProfile ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#4CAF50" />
                                <Text style={{ marginTop: 10, color: '#666' }}>프로필을 불러오는 중...</Text>
                            </View>
                        ) : (
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
                                        overflow: 'hidden',
                                    }}
                                    onPress={() => setShowImageExpandModal(true)}
                                >
                                    {partnerProfile?.avatar ? (
                                        <Image 
                                            source={{ uri: partnerProfile.avatar }}
                                            style={{ width: 100, height: 100, borderRadius: 50 }}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                                            {partnerProfile?.username?.substring(0, 2) || partnerProfile?.name?.substring(0, 2) || userName.substring(0, 2)}
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
                                    {partnerProfile?.username || partnerProfile?.name || userName}
                                </Text>
                                <Text style={{
                                    fontSize: 16,
                                    color: '#666',
                                    marginBottom: 15,
                                }}>
                                    {(() => {
                                        const location = partnerProfile?.location || '지역 정보 없음';
                                        const age = partnerProfile?.birthdate ? calculateAge(partnerProfile.birthdate) : null;
                                        return age ? `${location} · ${age}세` : location;
                                    })()}
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
                                            {partnerProfile?.likesCount?.toLocaleString() || '0'}
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
                                            {partnerProfile?.friendsCount?.toLocaleString() || '0'}
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
                                        {partnerProfile?.bio || partnerProfile?.description || `안녕하세요! ${partnerProfile?.username || partnerProfile?.name || userName}입니다 ✨ 좋은 사람들과 함께 즐거운 대화 나누고 싶습니다. 많이 친해져요!`}
                                    </Text>
                                </View>
                                
                                {/* 사주 키워드 */}
                                {partnerProfile?.sajuKeywords && partnerProfile.sajuKeywords.length > 0 && (
                                    <View style={{ width: '100%', marginBottom: 20 }}>
                                        <Text style={{
                                            fontSize: 18,
                                            fontWeight: 'bold',
                                            color: '#333',
                                            marginBottom: 10,
                                        }}>사주 키워드</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            {partnerProfile.sajuKeywords.map((keyword: string, index: number) => (
                                                <View 
                                                    key={index}
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        borderWidth: 1,
                                                        borderColor: '#4CAF50',
                                                        borderRadius: 15,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 6,
                                                        marginRight: 8,
                                                        marginBottom: 8,
                                                        maxWidth: '48%',
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <Text 
                                                        style={{
                                                            fontSize: 14,
                                                            color: '#4CAF50',
                                                            fontWeight: '500',
                                                            flexShrink: 1,
                                                        }}
                                                        numberOfLines={3}
                                                    >
                                                        {keyword}
                                                    </Text>
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
                                        if (!partnerId) {
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
                                                const response = await fetch(USER_ENDPOINTS.unlike(partnerId), {
                                                    method: 'DELETE',
                                                    headers: {
                                                        'Authorization': `Bearer ${accessToken}`,
                                                    },
                                                });
                                                if (!response.ok) {
                                                    throw new Error('좋아요 취소 실패');
                                                }
                                                setIsHeartLiked(false);
                                                // 프로필 재조회
                                                await fetchPartnerProfile();
                                            } else {
                                                // 좋아요 추가
                                                const response = await fetch(USER_ENDPOINTS.like(partnerId), {
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
                                                // 프로필 재조회
                                                await fetchPartnerProfile();
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
                                        onPress={() => setShowProfileModal(false)}
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
                                                `${userName}님을 친구 목록에서 삭제하시겠습니까?`,
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
                        )}
                    </View>
                </View>
            </Modal>

            {/* 이미지 확대 모달 */}
            <ImageModal
                visible={showImageExpandModal}
                onClose={() => setShowImageExpandModal(false)}
                imageUri={null}
                userName={userName}
            />

            {/* 채팅 이미지 전체 화면 뷰어 */}
            <Modal
                visible={isMessageImageModalVisible && !!selectedMessageImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMessageImageModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setMessageImageModalVisible(false)}>
                    <View style={styles.messageImageModalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.messageImageModalContent}>
                                {selectedMessageImage && (
                                    <Image
                                        source={{ uri: selectedMessageImage }}
                                        style={styles.fullScreenMessageImage}
                                        resizeMode="contain"
                                    />
                                )}
                                <TouchableOpacity
                                    style={styles.messageImageModalClose}
                                    onPress={() => setMessageImageModalVisible(false)}
                                    accessible
                                    accessibilityRole="button"
                                    accessibilityLabel="이미지 닫기"
                                >
                                    <Ionicons name="close" size={28} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>


            {/* 대화 주제 추천 모달 - 친구 채팅일 때는 표시하지 않음 */}
            {!isFriendChat && (
            <Modal
                visible={showTopicModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowTopicModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowTopicModal(false)}>
                    <View style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 20
                    }}>
                        <TouchableWithoutFeedback>
                            <View style={{
                                backgroundColor: '#fff',
                                borderRadius: 20,
                                padding: 20,
                                width: '100%',
                                maxWidth: 400,
                                maxHeight: '80%'
                            }}>
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 20
                                }}>
                                    <Text style={{
                                        fontSize: 20,
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>대화 주제 추천</Text>
                                    <TouchableOpacity onPress={() => setShowTopicModal(false)}>
                                        <Ionicons name="close" size={24} color="#333" />
                                    </TouchableOpacity>
                                </View>
                                
                                <ScrollView>
                                    {savedTopics.length > 0 ? (
                                        savedTopics.map((topic, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={{
                                                    backgroundColor: '#E8F5E9',
                                                    borderRadius: 12,
                                                    padding: 16,
                                                    marginBottom: 12
                                                }}
                                                onPress={() => {
                                                    const remainingTopics = savedTopics.filter((_, i) => i !== index);
                                                    setSavedTopics(remainingTopics);
                                                    selectTopic(topic);
                                                    setShowTopicModal(false);
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 14,
                                                    color: '#2E7D32',
                                                    lineHeight: 20
                                                }}>{topic}</Text>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <Text style={{
                                            fontSize: 14,
                                            color: '#666',
                                            textAlign: 'center',
                                            padding: 20
                                        }}>저장된 대화 주제가 없습니다.</Text>
                                    )}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            )}

            {/* 나가기 확인 모달 */}
            {showExitConfirmModal && (
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
                                채팅방 나가기
                            </Text>
                            
                            <Text style={{
                                fontSize: 14,
                                color: '#666',
                                textAlign: 'center',
                                marginBottom: 20,
                                lineHeight: 20
                            }}>
                                정말로 채팅방을 나가시겠습니까?
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
            )}
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

