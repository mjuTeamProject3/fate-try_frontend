import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createAgoraRtcEngine,
    IRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    RtcSurfaceView,
    RtcEngineContext,
    RtcConnection
} from 'react-native-agora';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/utils/socket';
import { AGORA_APP_ID } from '@/constants/agora';
import { USER_ENDPOINTS, FRIEND_ENDPOINTS, API_BASE_URL } from '@/constants/api';
import styles from '@/styles/RandomVideoRoomStyles';
import ImageModal from '@/components/ImageModal';

// 프로필 데이터 타입 정의
interface ProfileData {
    id: number;
    title: string;
    score: number;
    icon: string;
    friendsCount?: number;
    avatar?: string;
}

const RandomVideoRoomScreen = () => {
    const params = useLocalSearchParams();
    const roomId = params.roomId as string;
    const partnerId = params.partnerId as string;
    const partnerUsername = params.partnerUsername as string || '사용자';
    const compatibilityScore = params.compatibilityScore as string || '0';
    const verdict = params.verdict as string || '';
    
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isHeartLiked, setIsHeartLiked] = useState(false);
    const [isFriendAdded, setIsFriendAdded] = useState(false);
    const [isFriendRequestSent, setIsFriendRequestSent] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
    
    // Agora 관련 상태
    const [rtcEngine, setRtcEngine] = useState<IRtcEngine | null>(null);
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUid, setRemoteUid] = useState<number | null>(null);
    const [localUid, setLocalUid] = useState<number | null>(null);
    const socketRef = useRef<Socket | null>(null);

    // 상대방 프로필 데이터
    const [partnerProfile, setPartnerProfile] = useState<ProfileData>({
        id: parseInt(partnerId) || 1,
        title: partnerUsername,
        score: 0,
        icon: 'person'
    });
    const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);

    // 상대방 프로필 정보 가져오기
    useEffect(() => {
        let mounted = true;

        const fetchPartnerProfile = async () => {
            try {
                const userId = parseInt(partnerId);
                if (!userId) return;

                const token = await AsyncStorage.getItem('accessToken');
                if (!token) return;

                const response = await fetch(USER_ENDPOINTS.getProfileById(userId), {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && mounted) {
                        const profile = data.success;
                        setPartnerProfile({
                            id: profile.userId || userId,
                            title: profile.username || profile.name || partnerUsername,
                            score: profile.likesCount || 0,
                            icon: 'person',
                            friendsCount: profile.friendsCount || 0,
                            avatar: profile.avatar || null
                        });
                        if (profile.avatar) {
                            // avatar가 상대 경로면 절대 경로로 변환
                            const avatarUrl = profile.avatar.startsWith('http') 
                                ? profile.avatar 
                                : `${API_BASE_URL.replace('/v1/api', '')}${profile.avatar}`;
                            setPartnerAvatar(avatarUrl);
                        }
                    }
                }
            } catch (error) {
                console.error('[영상통화] 프로필 가져오기 오류:', error);
            }
        };

        fetchPartnerProfile();

        return () => {
            mounted = false;
        };
    }, [partnerId, partnerUsername]);

    // Socket.io 연결
    useEffect(() => {
        let mounted = true;

        const initSocket = async () => {
            try {
                const socket = await getSocket();
                if (socket) {
                    socketRef.current = socket;
                    
                    // video:ended 이벤트 리스너 (상대방이 통화 종료)
                    socket.on('video:ended', (data: { reason: string }) => {
                        console.log('[영상통화] 상대방이 통화를 종료했습니다:', data.reason);
                        if (mounted) {
                            // Agora 채널 나가기
                            if (rtcEngine) {
                                try {
                                    rtcEngine.leaveChannel();
                                    rtcEngine.release();
                                } catch (error) {
                                    console.error('[영상통화] 종료 오류:', error);
                                }
                            }
                            router.push('/random-video-end');
                        }
                    });

                    // 신고 성공 이벤트 (신고한 사람에게만 전송)
                    socket.on('user:reported', (data: { ok: boolean, error?: string }) => {
                        if (!mounted) return;
                        if (data.ok) {
                            Alert.alert('신고 접수', '신고가 접수되었습니다.', [
                                { 
                                    text: '확인', 
                                    onPress: () => {
                                        // Agora 채널 나가기
                                        if (rtcEngine) {
                                            try {
                                                rtcEngine.leaveChannel();
                                                rtcEngine.release();
                                            } catch (error) {
                                                console.error('[영상통화] 종료 오류:', error);
                                            }
                                        }
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
                        console.log('[영상통화] 채팅 종료:', data.reason, 'reporterId:', data.reporterId);
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
                                        // Agora 채널 나가기
                                        if (rtcEngine) {
                                            try {
                                                rtcEngine.leaveChannel();
                                                rtcEngine.release();
                                            } catch (error) {
                                                console.error('[영상통화] 종료 오류:', error);
                                            }
                                        }
                                        router.replace('/(tabs)');
                                    }
                                }
                            ]);
                        }
                    });
                }
            } catch (error) {
                console.error('[영상통화] Socket 연결 오류:', error);
            }
        };

        initSocket();

        return () => {
            mounted = false;
            if (socketRef.current) {
                socketRef.current.off('video:ended');
                socketRef.current.off('user:reported');
                socketRef.current.off('chat:ended');
            }
        };
    }, []);

    // Agora 엔진 초기화 및 채널 입장
    useEffect(() => {
        let mounted = true;
        let engine: IRtcEngine | null = null;

        const initAgora = async () => {
            try {
                if (!roomId) {
                    console.error('[영상통화] roomId가 없습니다');
                    router.back();
                    return;
                }

                console.log('[영상통화] Agora 초기화 시작, roomId:', roomId);
                
                // 모듈 확인을 위한 상세 로그
                try {
                    const agoraModule = require('react-native-agora');
                    console.log('[영상통화] react-native-agora 모듈 확인:', {
                        moduleType: typeof agoraModule,
                        hasCreateAgoraRtcEngine: typeof agoraModule.createAgoraRtcEngine === 'function',
                        hasDefault: typeof agoraModule.default === 'function',
                        moduleKeys: Object.keys(agoraModule || {}).slice(0, 15) // 처음 15개만
                    });
                } catch (e) {
                    console.error('[영상통화] 모듈 require 실패:', e);
                }

                // 1. Agora 엔진 생성
                // react-native-agora v4.5.3에서는 createAgoraRtcEngine() 함수 사용
                if (!createAgoraRtcEngine || typeof createAgoraRtcEngine !== 'function') {
                    console.error('[영상통화] createAgoraRtcEngine이 import되지 않았습니다:', {
                        createAgoraRtcEngine: typeof createAgoraRtcEngine,
                        isUndefined: createAgoraRtcEngine === undefined,
                        isNull: createAgoraRtcEngine === null
                    });
                    throw new Error('createAgoraRtcEngine이 import되지 않았습니다. 네이티브 모듈이 제대로 링크되었는지 확인하세요.');
                }

                try {
                    // 엔진 생성
                    engine = createAgoraRtcEngine();
                    console.log('[영상통화] Agora 엔진 생성 성공');
                    
                    // 엔진 초기화
                    const context: RtcEngineContext = {
                        appId: AGORA_APP_ID,
                    };
                    const initResult = engine.initialize(context);
                    if (initResult !== 0) {
                        throw new Error(`Agora 엔진 초기화 실패: 에러 코드 ${initResult}`);
                    }
                    console.log('[영상통화] Agora 엔진 초기화 성공');
                } catch (createError: any) {
                    console.error('[영상통화] 엔진 생성/초기화 중 오류:', createError);
                    throw new Error(`Agora 엔진 생성/초기화 실패: ${createError?.message || String(createError)}. 네이티브 모듈이 제대로 링크되었는지 확인하세요.`);
                }
                
                // 2. 이벤트 핸들러 설정
                console.log('[영상통화] 이벤트 핸들러 등록 시작');
                engine.registerEventHandler({
                    // 로컬 사용자가 채널에 입장 성공
                    onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
                        console.log('[영상통화] ✅ 채널 입장 성공 콜백 호출:', { connection, elapsed });
                        if (mounted && connection.localUid) {
                            console.log('[영상통화] 상태 업데이트: isJoined=true, localUid=', connection.localUid);
                            setIsJoined(true);
                            setLocalUid(connection.localUid);
                            // 채널 입장 후 로컬 비디오 미리보기 시작
                            if (engine) {
                                console.log('[영상통화] startPreview() 호출');
                                const previewResult = engine.startPreview();
                                console.log('[영상통화] startPreview() 결과:', previewResult);
                                
                                // 비디오 스트림이 시작되었는지 확인하기 위해 잠시 후 로그
                                setTimeout(() => {
                                    console.log('[영상통화] 비디오 스트림 상태 확인 (3초 후)');
                                }, 3000);
                            }
                        }
                    },
                    
                    // 원격 사용자가 채널에 입장
                    onUserJoined: (connection: RtcConnection, remoteUid: number, elapsed: number) => {
                        console.log('[영상통화] ✅ 상대방 입장 콜백 호출:', { connection, remoteUid, elapsed });
                        if (mounted && engine) {
                            console.log('[영상통화] remoteUid 설정:', remoteUid);
                            setRemoteUid(remoteUid);
                            
                            // 원격 비디오 스트림 명시적으로 설정
                            // RtcSurfaceView가 자동으로 설정하지만, 명시적으로 설정하는 것이 더 안전함
                            console.log('[영상통화] setupRemoteVideo() 호출:', remoteUid);
                            // VideoCanvas는 view나 surfaceTexture를 설정할 수 있지만,
                            // RtcSurfaceView를 사용할 때는 uid만 설정하면 됨
                            const setupResult = engine.setupRemoteVideo({
                                uid: remoteUid
                            });
                            console.log('[영상통화] setupRemoteVideo() 결과:', setupResult);
                        }
                    },
                    
                    // 원격 사용자가 채널을 떠남
                    onUserOffline: (connection: RtcConnection, remoteUid: number, reason: number) => {
                        console.log('[영상통화] ⚠️ 상대방 퇴장 콜백 호출:', { connection, remoteUid, reason });
                        // reason: 0 = UserOfflineQuit (사용자가 나감)
                        // reason: 1 = UserOfflineDropped (네트워크 문제로 타임아웃)
                        // reason: 2 = UserOfflineBecomeAudience (호스트에서 관객으로 전환)
                        // reason: 11 = 알 수 없는 에러 (비디오 스트림 문제일 수 있음)
                        if (mounted) {
                            setRemoteUid(null);
                            // reason이 1이거나 11이면 네트워크/비디오 스트림 문제일 수 있으므로 바로 종료하지 않고 잠시 대기
                            if (reason === 1 || reason === 11) {
                                console.log('[영상통화] 네트워크/비디오 스트림 문제 감지 (reason:', reason, '), 잠시 대기...');
                                // 5초 후에도 재연결되지 않으면 종료
                                setTimeout(() => {
                                    if (mounted) {
                                        console.log('[영상통화] 재연결 실패, 통화 종료');
                                        router.push('/random-video-end');
                                    }
                                }, 5000);
                            } else {
                                // 상대방이 나가면 통화 종료 화면으로
                                console.log('[영상통화] 상대방이 나감, 통화 종료');
                                router.push('/random-video-end');
                            }
                        }
                    },
                    
                    // 에러 발생
                    onError: (err: number, msg: string) => {
                        console.error('[영상통화] ❌ Agora 에러:', err, msg);
                    },
                });
                console.log('[영상통화] 이벤트 핸들러 등록 완료');
                
                // 3. 채널 프로필 설정 (1:1 통화) - 채널 입장 전에 설정
                engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
                
                // 4. 클라이언트 역할 설정 (호스트) - 채널 입장 전에 설정
                engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
                
                // 5. 비디오 활성화
                console.log('[영상통화] enableVideo() 호출');
                const enableVideoResult = engine.enableVideo();
                console.log('[영상통화] enableVideo() 결과:', enableVideoResult);
                
                if (mounted) {
                    setRtcEngine(engine);
                }
                
                // 6. 채널 입장 (roomId를 채널명으로 사용)
                console.log('[영상통화] joinChannel() 호출:', roomId);
                const joinResult = engine.joinChannel(
                    '', // Token (개발 환경에서는 빈 문자열 가능)
                    roomId, // 채널명 (Socket.io의 roomId 사용)
                    0, // UID (0이면 자동 할당)
                    {
                        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                        channelProfile: ChannelProfileType.ChannelProfileCommunication
                    } // 옵션
                );
                console.log('[영상통화] joinChannel() 결과:', joinResult);
                
            } catch (error) {
                console.error('[영상통화] Agora 초기화 실패:', error);
                if (mounted) {
                    Alert.alert('오류', '영상통화 연결에 실패했습니다.');
                    router.back();
                }
            }
        };
        
        initAgora();
        
        // 정리 함수
        return () => {
            mounted = false;
            if (engine) {
                try {
                    engine.leaveChannel();
                    engine.release();
                } catch (error) {
                    console.error('[영상통화] 정리 오류:', error);
                }
            }
        };
    }, [roomId]);

    const handleEndCall = () => {
        setShowExitConfirmModal(true);
    };

    const confirmExit = async () => {
        setShowExitConfirmModal(false);
        
        // Socket.io로 통화 종료 알림 (백엔드의 chat:end 이벤트 사용)
        if (socketRef.current && roomId) {
            socketRef.current.emit('chat:end', { roomId, reason: 'user_ended' }, (response: any) => {
                console.log('[영상통화] 종료 응답:', response);
            });
        }
        
        // Agora 채널 나가기
        if (rtcEngine) {
            try {
                rtcEngine.leaveChannel();
                rtcEngine.release();
                setRtcEngine(null);
            } catch (error) {
                console.error('[영상통화] 종료 오류:', error);
            }
        }
        
        router.push('/random-video-end');
    };

    const cancelExit = () => {
        setShowExitConfirmModal(false);
    };

    const toggleCamera = () => {
        if (rtcEngine) {
            try {
                rtcEngine.muteLocalVideoStream(!isCameraOn);
                setIsCameraOn(!isCameraOn);
            } catch (error) {
                console.error('[영상통화] 카메라 토글 오류:', error);
            }
        }
    };

    const toggleMicrophone = () => {
        if (rtcEngine) {
            try {
                rtcEngine.muteLocalAudioStream(!isMicrophoneOn);
                setIsMicrophoneOn(!isMicrophoneOn);
            } catch (error) {
                console.error('[영상통화] 마이크 토글 오류:', error);
            }
        }
    };

    const handleProfileClick = async () => {
        setShowProfileModal(true);
        
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) return;

            const userId = parseInt(partnerId);
            if (!userId) return;

            // 좋아요 상태 확인
            const likeResponse = await fetch(USER_ENDPOINTS.like(userId), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (likeResponse.ok) {
                const likeData = await likeResponse.json();
                setIsHeartLiked(likeData.success?.isLiked || false);
            }

            // 친구 상태 확인
            const friendsResponse = await fetch(FRIEND_ENDPOINTS.getFriends, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (friendsResponse.ok) {
                const friendsData = await friendsResponse.json();
                // API 응답 구조: { resultType: 'SUCCESS', success: { friends: [...] } }
                const friendList = (friendsData.success?.friends || friendsData.success || []);
                const isFriend = Array.isArray(friendList) && friendList.some((friend: any) => 
                    friend.userId === userId || friend.id === userId
                );
                setIsFriendAdded(isFriend);
            }

            // 친구 요청 상태 확인
            const pendingRequests = await AsyncStorage.getItem('friend_requests');
            const requests = pendingRequests ? JSON.parse(pendingRequests) : [];
            const hasRequestSent = requests.some((req: any) => 
                req.userName === partnerProfile.title || req.userId === userId
            );
            setIsFriendRequestSent(hasRequestSent);
        } catch (error) {
            console.error('[영상통화] 프로필 상태 확인 오류:', error);
        }
    };

    const handleReport = () => {
        router.push({
            pathname: '/report',
            params: {
                partnerId: partnerId || '',
                partnerUsername: partnerUsername,
                roomId: roomId || '',
                isRandom: 'true',
                isVideo: 'true'
            }
        });
    };

    return (
        <View style={styles.container}>
            {/* 상대방 비디오 영역 (배경) */}
            <View style={styles.partnerVideoContainer}>
                {remoteUid !== null && rtcEngine && isJoined ? (
                    <RtcSurfaceView
                        canvas={{ uid: remoteUid, sourceType: 9 }} // sourceType 9 = VideoSourceRemote
                        style={styles.partnerVideo}
                        zOrderMediaOverlay={false}
                    />
                ) : (
                    <View style={styles.partnerVideoPlaceholder}>
                        <View style={styles.partnerAvatar}>
                            <Ionicons name="person" size={80} color="#fff" />
                        </View>
                        <Text style={styles.partnerName}>{partnerUsername}</Text>
                    </View>
                )}
            </View>

            {/* 상대방 프로필 사진 (좌측 상단) */}
            <TouchableOpacity 
                style={styles.partnerProfileButton}
                onPress={handleProfileClick}
            >
                {partnerAvatar ? (
                    <Image 
                        source={{ uri: partnerAvatar }}
                        style={styles.partnerProfileAvatar}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.partnerProfileAvatar}>
                        <Ionicons name="person" size={20} color="#fff" />
                    </View>
                )}
            </TouchableOpacity>

            {/* 사주 궁합도 점수 (우측 상단) */}
            <View style={styles.compatibilityCard}>
                <View style={styles.compatibilityHeader}>
                    <Text style={styles.compatibilityTitle}>사주 궁합도</Text>
                </View>
                <Text style={styles.compatibilityScore}>{compatibilityScore}점</Text>
                <View style={styles.compatibilityFooter}>
                    <Text style={styles.compatibilityRating}>{verdict || '평가 없음'}</Text>
                    <Ionicons name="star" size={12} color="#FFD700" />
                </View>
            </View>

            {/* 내 비디오 (우측 하단) */}
            {rtcEngine && isJoined ? (
                <View style={styles.myVideoContainer}>
                    <RtcSurfaceView
                        canvas={{ sourceType: 0 }} // sourceType 0 = VideoSourceCameraPrimary, uid 생략 = 로컬 비디오
                        style={styles.myVideo}
                        zOrderMediaOverlay={true}
                        mirror={true} // 전면 카메라 미러링
                    />
                </View>
            ) : (
                <View style={styles.myVideoContainer}>
                    <View style={styles.myVideo}>
                        <View style={styles.myAvatar}>
                            <Ionicons name="person" size={30} color="#fff" />
                        </View>
                    </View>
                </View>
            )}

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
                                    <Text style={styles.statText}>{partnerProfile.friendsCount || 0}</Text>
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
                                    onPress={async () => {
                                        try {
                                            const token = await AsyncStorage.getItem('accessToken');
                                            if (!token) {
                                                Alert.alert('오류', '로그인이 필요합니다.');
                                                return;
                                            }

                                            const userId = parseInt(partnerId);
                                            if (!userId) return;

                                            const newLikeState = !isHeartLiked;
                                            const method = newLikeState ? 'POST' : 'DELETE';
                                            
                                            const response = await fetch(USER_ENDPOINTS.like(userId), {
                                                method: method,
                                                headers: {
                                                    'Authorization': `Bearer ${token}`,
                                                    'Content-Type': 'application/json',
                                                },
                                            });

                                            if (response.ok) {
                                                setIsHeartLiked(newLikeState);
                                                if (newLikeState) {
                                                    Alert.alert('성공', '좋아요를 눌렀습니다.');
                                                } else {
                                                    Alert.alert('성공', '좋아요를 취소했습니다.');
                                                }
                                            } else {
                                                const errorData = await response.json();
                                                Alert.alert('오류', errorData.error?.reason || '좋아요 처리에 실패했습니다.');
                                            }
                                        } catch (error) {
                                            console.error('[영상통화] 좋아요 오류:', error);
                                            Alert.alert('오류', '좋아요 처리 중 오류가 발생했습니다.');
                                        }
                                    }}
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
                                            try {
                                                const token = await AsyncStorage.getItem('accessToken');
                                                if (!token) {
                                                    Alert.alert('오류', '로그인이 필요합니다.');
                                                    return;
                                                }

                                                const userId = parseInt(partnerId);
                                                if (!userId) return;

                                                const response = await fetch(FRIEND_ENDPOINTS.request(userId), {
                                                    method: 'POST',
                                                    headers: {
                                                        'Authorization': `Bearer ${token}`,
                                                        'Content-Type': 'application/json',
                                                    },
                                                });

                                                if (response.ok) {
                                                    // 친구 요청 저장 (로컬에도 저장)
                                                    const pendingRequests = await AsyncStorage.getItem('friend_requests');
                                                    const requests = pendingRequests ? JSON.parse(pendingRequests) : [];
                                                    const newRequest = {
                                                        userName: partnerProfile.title,
                                                        avatarText: partnerProfile.title.substring(0, 2),
                                                        id: Date.now(),
                                                        status: 'pending',
                                                        userId: userId
                                                    };
                                                    requests.push(newRequest);
                                                    await AsyncStorage.setItem('friend_requests', JSON.stringify(requests));
                                                    
                                                    setIsFriendRequestSent(true);
                                                    Alert.alert('성공', '친구 요청이 전송되었습니다.');
                                                } else {
                                                    const errorData = await response.json();
                                                    Alert.alert('오류', errorData.error?.reason || '친구 요청에 실패했습니다.');
                                                }
                                            } catch (error) {
                                                console.error('[영상통화] 친구 추가 오류:', error);
                                                Alert.alert('오류', '친구 요청 중 오류가 발생했습니다.');
                                            }
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

                {/* 프로필 버튼 (비디오 버튼 대신) */}
                <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={handleProfileClick}
                >
                    <Ionicons 
                        name="person" 
                        size={24} 
                        color="#4CAF50" 
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
