import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Modal, Alert, Image, ActivityIndicator } from 'react-native';
// 아이콘 사용을 위한 임포트 (expo-vector-icons)
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
// 스타일 임포트
import styles from '@/styles/HomeStyles';
// 네비게이션 임포트
import { router, useFocusEffect } from 'expo-router';
// AsyncStorage 임포트
import AsyncStorage from '@react-native-async-storage/async-storage';
// 이미지 모달 컴포넌트
import ImageModal from '@/components/ImageModal';
// API 엔드포인트 임포트
import { RANKING_ENDPOINTS, getUserLikeEndpoint } from '@/constants/api';

// 랭킹 데이터 타입 정의
interface RankingItem {
    id: number;
    title: string;
    score: number;
    icon: string;
    image?: any; // 프로필 이미지 (선택적)
}

const HomeScreen = () => {
    // 사주 정보 펼침 상태
    const [isSajuExpanded, setIsSajuExpanded] = useState(false);
    // 프로필 모달 상태
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<RankingItem | null>(null);
    const [isHeartLiked, setIsHeartLiked] = useState(false);
    const [isFriendAdded, setIsFriendAdded] = useState(false);
    const [isFriendRequestSent, setIsFriendRequestSent] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    // 사주 키워드 펼침 상태
    const [keywordsExpanded, setKeywordsExpanded] = useState(false);
    // 랜덤 채팅/영상 선택 모달 상태
    const [showRandomModal, setShowRandomModal] = useState(false);
    // 알림 갯수 상태
    const [notificationCount, setNotificationCount] = useState(4); // 안읽은 알림 개수
    // 랭킹 목록 모달 상태
    const [showRankingModal, setShowRankingModal] = useState(false);
    const [rankingModalType, setRankingModalType] = useState<'all' | 'monthly' | 'local'>('all');
    
    // 랭킹 데이터 상태
    const [overallRanking, setOverallRanking] = useState<RankingItem[]>([]);
    const [monthlyRanking, setMonthlyRanking] = useState<RankingItem[]>([]);
    const [localRanking, setLocalRanking] = useState<RankingItem[]>([]);
    
    // 랭킹 로딩 상태
    const [isLoadingOverall, setIsLoadingOverall] = useState(false);
    const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);
    const [isLoadingLocal, setIsLoadingLocal] = useState(false);
    
    // 안읽은 알림 개수 계산 함수
    const getUnreadNotificationCount = () => {
        // 실제로는 서버에서 받아와야 하지만, 여기서는 더미 데이터로 계산
        const friendRequests = 2; // 안읽은 친구 요청 (햇살왕자, 별빛나래)
        const otherNotifications = 2; // 안읽은 기타 알림 (달빛소녀, 바람처럼)
        return friendRequests + otherNotifications;
    };

    // 최초 회원가입 체크 함수 (개발용: 항상 추가정보 페이지로 이동)
    const checkFirstSignup = async () => {
        try {
            // 개발용 버튼으로 스킵한 경우 체크 건너뛰기
            const tempSkip = await AsyncStorage.getItem('tempSkipSignup');
            if (tempSkip === 'true') {
                // 임시 플래그 제거
                await AsyncStorage.removeItem('tempSkipSignup');
                return;
            }
            
            // 개발 중: 기록 저장하지 않고 매번 추가정보 페이지로 이동
            router.replace('/signup-additional');
        } catch (error) {
            console.error('최초 회원가입 체크 오류:', error);
        }
    };

    // 컴포넌트 마운트 시 알림 개수 로드 및 최초 회원가입 체크
    useEffect(() => {
        loadNotificationCount();
        checkFirstSignup();
        loadAllRankings();
    }, []);

    // 화면 포커스 시 알림 개수 다시 로드 및 최초 회원가입 체크
    useFocusEffect(
        React.useCallback(() => {
            loadNotificationCount();
            checkFirstSignup();
            loadAllRankings(); // 화면 포커스 시 랭킹 새로고침
        }, [])
    );

    // AsyncStorage에서 알림 개수 로드
    const loadNotificationCount = async () => {
        try {
            const count = await AsyncStorage.getItem('notificationCount');
            if (count !== null) {
                setNotificationCount(parseInt(count));
            } else {
                // 처음 실행 시 기본값 설정
                setNotificationCount(4);
                await AsyncStorage.setItem('notificationCount', '4');
            }
        } catch (error) {
            console.error('알림 개수 로드 실패:', error);
            setNotificationCount(4);
        }
    };

    // 백엔드 랭킹 데이터를 프론트엔드 형식으로 변환
    const transformRankingData = (backendData: any[]): RankingItem[] => {
        return backendData.map((item) => ({
            id: item.user?.id || 0,
            title: item.user?.username || item.user?.name || '사용자',
            score: item.likesCount || 0,
            icon: 'person',
            image: item.user?.avatar || undefined,
        }));
    };

    // 전체 랭킹 로드
    const loadOverallRanking = async () => {
        try {
            setIsLoadingOverall(true);
            console.log('🔍 전체 랭킹 API 호출:', RANKING_ENDPOINTS.overall);
            const response = await fetch(RANKING_ENDPOINTS.overall);
            if (!response.ok) {
                throw new Error('전체 랭킹 로드 실패');
            }
            const data = await response.json();
            console.log('✅ 전체 랭킹 API 응답:', data);
            const transformed = transformRankingData(data);
            console.log('📊 변환된 전체 랭킹 데이터:', transformed);
            setOverallRanking(transformed);
        } catch (error) {
            console.error('❌ 전체 랭킹 로드 오류:', error);
            // 에러 시 빈 배열 유지
            setOverallRanking([]);
        } finally {
            setIsLoadingOverall(false);
        }
    };

    // 월간 랭킹 로드
    const loadMonthlyRanking = async () => {
        try {
            setIsLoadingMonthly(true);
            console.log('🔍 월간 랭킹 API 호출:', RANKING_ENDPOINTS.monthly);
            const response = await fetch(RANKING_ENDPOINTS.monthly);
            if (!response.ok) {
                throw new Error('월간 랭킹 로드 실패');
            }
            const data = await response.json();
            console.log('✅ 월간 랭킹 API 응답:', data);
            const transformed = transformRankingData(data);
            console.log('📊 변환된 월간 랭킹 데이터:', transformed);
            setMonthlyRanking(transformed);
        } catch (error) {
            console.error('❌ 월간 랭킹 로드 오류:', error);
            // 에러 시 빈 배열 유지
            setMonthlyRanking([]);
        } finally {
            setIsLoadingMonthly(false);
        }
    };

    // 지역별 랭킹 로드
    const loadLocalRanking = async () => {
        try {
            setIsLoadingLocal(true);
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                console.log('⚠️  지역별 랭킹: Access Token 없음 (더미 데이터 사용)');
                // 토큰이 없으면 빈 배열 반환
                setLocalRanking([]);
                return;
            }

            console.log('🔍 지역별 랭킹 API 호출:', RANKING_ENDPOINTS.local);
            const response = await fetch(RANKING_ENDPOINTS.local, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ 지역별 랭킹 응답 오류:', response.status, errorText);
                throw new Error(`지역별 랭킹 로드 실패: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            console.log('✅ 지역별 랭킹 API 응답:', data);
            const transformed = transformRankingData(data);
            console.log('📊 변환된 지역별 랭킹 데이터:', transformed);
            setLocalRanking(transformed);
        } catch (error) {
            console.error('❌ 지역별 랭킹 로드 오류:', error);
            // 에러 시 빈 배열 유지
            setLocalRanking([]);
        } finally {
            setIsLoadingLocal(false);
        }
    };

    // 모든 랭킹 데이터 로드
    const loadAllRankings = async () => {
        await Promise.all([
            loadOverallRanking(),
            loadMonthlyRanking(),
            loadLocalRanking(),
        ]);
    };

    // 알림 개수를 0으로 리셋하는 함수
    const resetNotificationCount = async () => {
        setNotificationCount(0);
        try {
            await AsyncStorage.setItem('notificationCount', '0');
        } catch (error) {
            console.error('알림 개수 저장 실패:', error);
        }
    };

    // 알림 화면으로 이동하는 함수
    const goToNotifications = () => {
        router.push('/notifications');
    };
    
    //전체 하트 랭킹 프로필 이미지 URL (여기에 이미지 URL을 입력하세요)
    const karinaImageUrl = 'https://search.pstatic.net/sunny/?src=http%3A%2F%2Ffile3.instiz.net%2Fdata%2Fcached_img%2Fupload%2F2025%2F02%2F02%2F18%2Fe52565f0268b42e8e26fc6ab6e61f723.jpg&type=sc960_832'; // 여기에 실제 이미지 URL을 넣어주세요
    const yunaImageUrl = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDAxMTJfODUg%2FMDAxNzA1MDI4MjM0Mzk4.wk0I4effUHgI_X5H6h-L5ndHF93eKJbASvKiuAK5N50g.AMOKzT8m11gAjVq8AcCeDiSQ7meVLDl7uwrD9kUdkuwg.JPEG.gooddaykiki%2FIMG_1332.JPG&type=sc960_832'; // 여기에 실제 이미지 URL을 넣어주세요
    const winterImageUrl = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDA2MThfMTI2%2FMDAxNzE4NzE1MzY5MzE2.XnAiCKUtZEdp2tDd1uM2DzXN4NMmcTYmirw_Bu3PPQkg.LyIbnUReCguvcpC_tQgP8W2HDFpfEH0FYgczZC-shH8g.JPEG%2F5750d7f52ba30dd42c905601803107c3.jpg&type=a340'
    const sulyunImageUrl = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fimgnews.naver.net%2Fimage%2F109%2F2022%2F12%2F13%2F0004757144_001_20221213185803598.jpg&type=a340'
    const kazuhaImageUrl ='https://search.pstatic.net/sunny/?src=http%3A%2F%2Ffile3.instiz.net%2Fdata%2Fcached_img%2Fupload%2F2022%2F12%2F25%2F3%2F6822dad56c54d678147b15b771cce57c.jpg&type=sc960_832'


    // 전체 랭킹: API에서 받은 데이터 사용 (더미 데이터는 fallback으로 유지)
    const sortedRankingData = useMemo(
        () => {
            if (overallRanking.length > 0) {
                console.log('✅ 전체 랭킹: API 데이터 사용 중 (실제 데이터)');
                return [...overallRanking].sort(
                    (a, b) => Number(b.score) - Number(a.score),
                );
            }
            // 데이터가 없을 때는 더미 데이터 사용 (fallback)
            console.log('⚠️  전체 랭킹: API 데이터 없음, 더미 데이터 사용 중');
            const fallbackData: RankingItem[] = [
        { id: 1, title: '카리나', score: 15420, icon: 'person', image: karinaImageUrl },
        { id: 2, title: '유나', score: 12890, icon: 'person', image: yunaImageUrl },
        { id: 3, title: '윈터', score: 11250, icon: 'person', image: winterImageUrl },
        { id: 4, title: '설윤', score: 9870, icon: 'person', image: sulyunImageUrl },
        { id: 5, title: '카즈하', score: 9200, icon: 'person' , image: kazuhaImageUrl },
            ];
            return fallbackData.sort((a, b) => Number(b.score) - Number(a.score));
        },
        [overallRanking]
    );

    //이달의 랭킹 프로필 이미지 URL (여기에 이미지 URL을 입력하세요)
    const chaewonImageUrl = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyMzAyMDFfMjgg%2FMDAxNjc1MjU1OTI0NDU4.FGEfyFN91NCetcBca1GLfsCrbqJ-fT8ssFzEue2xLacg.5LmwExujHWFo3IckaDikm_Q1dmJ3Rn6_O-uK6TI35q4g.JPEG.jhs020329%2Fkchaewon.lesserafim%25A3%25AD07%25A3%25AD01%25A3%25AD2023%25A3%25AD0008.jpg&type=sc960_832'; // 여기에 실제 이미지 URL을 넣어주세요
    const anImageUrl = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNTA5MTBfMTIz%2FMDAxNzU3NDM2MDUxNDQy.RLLyJVme3Hr50QxdxZDtFytpitnTFse9QQRjBL9A08Eg.b6SJcJg1Fjxz9uLIBhghXUKl3UjpsOQB6mYKiwSzfhAg.JPEG%2F0000278857%25A3%25DF001%25A3%25DF20250901194515625.jpg&type=sc960_832'
    const julieImageUrl = 'https://search.pstatic.net/sunny/?src=https%3A%2F%2Fimg-cdn.theqoo.net%2FjoYDjc.jpg&type=sc960_832'
    const yuyunImageUrl = 'https://search.pstatic.net/sunny/?src=http%3A%2F%2Ffile3.instiz.net%2Fdata%2Fcached_img%2Fupload%2F2022%2F02%2F04%2F15%2F4fbeedcee7f673e141dcdb3234fff3b6.jpg&type=a340'
    const natiImageUrl = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDAxMTRfMTA4%2FMDAxNzA1MjI1NDE1NzYy.v5CQhWcExHieBvdB7k4G7BrTjaMrA_lmF7p9NS9gfjcg.brwb6KYmfkdrvKEWny-5aATE-uq2BZ8IPjMg8axk6esg.JPEG.idhair3377%2FKakaoTalk%25A3%25DF20240102%25A3%25DF202648326%25A3%25DF02.jpg&type=sc960_832'
    //이달의 랭킹 데이터를 위한 더미 배열
    const monthlyRankingData: RankingItem[] = [
        { id: 1, title: '김채원', score: 8650, icon: 'person' , image: chaewonImageUrl },
        { id: 2, title: '이안', score: 7980, icon: 'person' , image: anImageUrl },
        { id: 3, title: '쥴리', score: 7320, icon: 'person' , image: julieImageUrl },
        { id: 4, title: '김유연', score: 6850, icon: 'person', image: yuyunImageUrl },
        { id: 5, title: '나띠', score: 6200, icon: 'person', image: natiImageUrl},
    ];
    //우리 지역 랭킹 프로필 이미지 URL
    const hankang = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNTA5MThfMTg0%2FMDAxNzU4MTcwMzA0MTU3.GXbLc0CJQrjuD-B1qctDtX-nArPIat2PRGyTBQ637qEg.vr_k_nYiLgcZyam9d95TqxqE_eu28lMh9O5X4HUO69Qg.JPEG%2F%25B4%25D9%25BF%25EE%25B7%25CE%25B5%25E5%25A3%25AD5.jpeg&type=sc960_832'
    const businessman = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyMzA0MTdfNzMg%2FMDAxNjgxNzI5NjQ3MTU4._rNBN9aW2S7gzXgf2K3JNxZZbNESHfIdBg5cVvSOILgg.PzlFD74YoCNgED2QhdArWuIHFapoHz-KMiumHApo5Y8g.JPEG.kuj3423%2FIMG_8757.jpg&type=sc960_832'
    const hongpeople = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDAzMjdfMTcw%2FMDAxNzExNTA5MzAwNzMw.EhHzkZLKfQ8R8TPxApc2z8BfdorftRkqkTzB1bfmLocg.PhG6j9wX0pRdCKUEkMxykDWqNBOB2JC7XjPDBMX0hbwg.PNG%2F%25B0%25FC%25B1%25A4%25B0%25FA%25B6%25B0%25B3%25AA%25BF%25EB.png&type=sc960_832'
    const seoulseoul = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDA5MTJfMTI4%2FMDAxNzI2MTIxODIwNTQ0.8Aaxt2H_uaSFDHgNnrnIkZN9Zoi72rsoVcqMBkNrLxwg.yLmfkwykRwCLuvC5aohxhtxHuxdCLBFVR1sA3SHf328g.JPEG%2F20220515_183434.jpg&type=sc960_832'
    const sinchon = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fcafefiles.naver.net%2FMjAxOTA5MDVfMjE5%2FMDAxNTY3NjgwMDc5Mzk1.0MHFWyM4gXp_QLmWU4Sz4u_6VueWXWujOH2NXP2vy70g.vM-11sAkx726DCR2CG4H0_z5364IQEsp4GNkCJpuAacg.JPEG%2F1%25C0%25CF%25C2%25F7-10.jpg&type=sc960_832'
    // 이달의 랭킹: API에서 받은 데이터 사용 (더미 데이터는 fallback으로 유지)
    const sortedMonthlyRankingData = useMemo(
        () => {
            if (monthlyRanking.length > 0) {
                console.log('✅ 월간 랭킹: API 데이터 사용 중 (실제 데이터)');
                return [...monthlyRanking].sort(
                    (a, b) => Number(b.score) - Number(a.score),
                );
            }
            // 데이터가 없을 때는 더미 데이터 사용 (fallback)
            console.log('⚠️  월간 랭킹: API 데이터 없음, 더미 데이터 사용 중');
            const fallbackData: RankingItem[] = [
                { id: 1, title: '김채원', score: 8650, icon: 'person' , image: chaewonImageUrl },
                { id: 2, title: '이안', score: 7980, icon: 'person' , image: anImageUrl },
                { id: 3, title: '쥴리', score: 7320, icon: 'person' , image: julieImageUrl },
                { id: 4, title: '김유연', score: 6850, icon: 'person', image: yuyunImageUrl },
                { id: 5, title: '나띠', score: 6200, icon: 'person', image: natiImageUrl},
            ];
            return fallbackData.sort((a, b) => Number(b.score) - Number(a.score));
        },
        [monthlyRanking]
    );

    // 우리 지역 랭킹: API에서 받은 데이터 사용 (더미 데이터는 fallback으로 유지)
    const sortedLocalRankingData = useMemo(
        () => {
            if (localRanking.length > 0) {
                console.log('✅ 지역별 랭킹: API 데이터 사용 중 (실제 데이터)');
                return [...localRanking].sort(
                    (a, b) => Number(b.score) - Number(a.score),
                );
            }
            // 데이터가 없을 때는 더미 데이터 사용 (fallback)
            console.log('⚠️  지역별 랭킹: API 데이터 없음, 더미 데이터 사용 중');
            const fallbackData: RankingItem[] = [
        { id: 1, title: '조아용', score: 2650, icon: 'person' , image: hongpeople },
        { id: 2, title: '한강뷰', score: 3420, icon: 'person', image: hankang },
        { id: 3, title: '비즈니스맨', score: 2890, icon: 'person' , image: businessman },
        { id: 4, title: '서울숲', score: 2420, icon: 'person' , image: seoulseoul },
        { id: 5, title: '신촌을 못가', score: 2300, icon: 'person' , image: sinchon },
    ];
            return fallbackData.sort((a, b) => Number(b.score) - Number(a.score));
        },
        [localRanking]
    );

    // 사주 키워드 데이터 (프로필별로 고정)
    const getProfileKeywords = (profileTitle: string) => {
        // 이달의 랭킹에 있는 사람들은 12-16개의 키워드
        const isMonthlyRanking = monthlyRankingData.some(person => person.title === profileTitle);
        
        const allKeywords = [
            '사랑', '열정', '기쁨', '행복', '희망', '꿈', '자유', '평화',
            '건강', '부귀', '명예', '성공', '운세', '복', '영광', '축복'
        ];
        
        // 프로필 이름을 해시해서 고정된 키워드 가져오기
        let hash = 0;
        for (let i = 0; i < profileTitle.length; i++) {
            hash = ((hash << 5) - hash) + profileTitle.charCodeAt(i);
            hash = hash & hash;
        }
        
        if (isMonthlyRanking) {
            // 이달의 랭킹: 16개 키워드
            const count = 16;
            const startIdx = Math.abs(hash) % (allKeywords.length - count + 1);
            return allKeywords.slice(startIdx, startIdx + count);
        } else {
            // 일반 사용자: 8개 키워드
            const count = 8;
            const startIdx = Math.abs(hash) % (allKeywords.length - count + 1);
            return allKeywords.slice(startIdx, startIdx + count);
        }
    };

    // 개별 랭킹 카드를 렌더링하는 컴포넌트 함수
    const renderRankingCard = (item: RankingItem, index: number) => (
        <TouchableOpacity 
            style={styles.rankingCard}
            onPress={async () => {
                console.log('랭킹 카드 클릭:', item.title);
                setSelectedProfile(item);
                setIsHeartLiked(false); // 하트 상태 초기화
                setIsFriendAdded(false); // 친구 상태 초기화
                setKeywordsExpanded(false); // 키워드 펼침 상태 초기화
                
                // 친구 요청 상태 확인
                const pendingRequests = await AsyncStorage.getItem('friend_requests');
                const requests = pendingRequests ? JSON.parse(pendingRequests) : [];
                const hasRequestSent = requests.some((req: any) => req.userName === item.title);
                setIsFriendRequestSent(hasRequestSent);
                
                setShowProfileModal(true);
                console.log('프로필 모달 상태:', showProfileModal);
            }}
        >
            <Text style={styles.rankingNumber}>{index + 1}</Text>
            <View style={styles.rankingAvatar}>
                {item.image ? (
                    <Image 
                        source={typeof item.image === 'string' ? { uri: item.image } : item.image} 
                        style={styles.rankingAvatarImage}
                        resizeMode="cover"
                    />
                ) : (
                    <Text style={styles.rankingAvatarText}>{item.title.substring(0, 2)}</Text>
                )}
            </View>
            <Text style={styles.rankingTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.heartScore}>
                <AntDesign name="heart" size={12} color="#E53935" />
                <Text style={styles.scoreText}>{item.score.toLocaleString()}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* 상단 헤더 영역 */}
            <View style={styles.header}>
                <Text style={styles.logoText}>fate:try</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity 
                        onPress={goToNotifications}
                    >
                        <Ionicons name="notifications-outline" size={24} color="#333" />
                        {notificationCount > 0 && (
                            <View style={styles.badge}><Text style={styles.badgeText}>{notificationCount}</Text></View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => router.push('/chat')}
                        style={{ marginLeft: 15 }}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 메인 스크롤 콘텐츠 영역 */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* 1. 내 사주 정보 섹션 */}
                <TouchableOpacity 
                    style={styles.sajuInfoCard}
                    onPress={() => setIsSajuExpanded(!isSajuExpanded)}
                >
                    <View style={styles.sajuInfoTop}>
                        <AntDesign name="star" size={24} color="#4CAF50" />
                        <View style={styles.sajuTextContainer}>
                            <Text style={styles.sajuInfoTitle}>내 사주 정보</Text>
                            <Text style={styles.sajuInfoDetail}>2003년 3월 18일 • 화요일</Text>
                        </View>
                    </View>
                    <AntDesign 
                        name={isSajuExpanded ? "up" : "down"} 
                        size={20} 
                        color="#999" 
                    />
                </TouchableOpacity>

                {/* 사주 정보 펼침 내용 */}
                {isSajuExpanded && (
                    <View style={styles.sajuExpandedContent}>
                        {/* 사주 팔자 */}
                        <View style={styles.sajuSection}>
                            <Text style={styles.sajuSectionTitle}>사주 팔자</Text>
                            <View style={styles.sajuPillars}>
                                <View style={styles.pillarItem}>
                                    <Text style={styles.pillarLabel}>연주</Text>
                                    <Text style={styles.pillarValue}>올해 (을목 해수)</Text>
                                </View>
                                <View style={styles.pillarItem}>
                                    <Text style={styles.pillarLabel}>월주</Text>
                                    <Text style={styles.pillarValue}>기묘 (기토 묘목)</Text>
                                </View>
                                <View style={styles.pillarItem}>
                                    <Text style={styles.pillarLabel}>일주</Text>
                                    <Text style={styles.pillarValue}>정사 (정화 사화)</Text>
                                </View>
                            </View>
                        </View>

                        {/* 운세 */}
                        <View style={styles.sajuSection}>
                            <Text style={styles.sajuSectionTitle}>운세</Text>
                            <View style={styles.fortuneItems}>
                                <View style={styles.fortuneItem}>
                                    <Text style={styles.fortuneLabel}>연애운</Text>
                                    <Text style={styles.fortuneStars}>★★★★☆</Text>
                                </View>
                                <View style={styles.fortuneItem}>
                                    <Text style={styles.fortuneLabel}>금전운</Text>
                                    <Text style={styles.fortuneStars}>★★★☆☆</Text>
                                </View>
                                <View style={styles.fortuneItem}>
                                    <Text style={styles.fortuneLabel}>건강운</Text>
                                    <Text style={styles.fortuneStars}>★★★★★</Text>
                                </View>
                                <View style={styles.fortuneItem}>
                                    <Text style={styles.fortuneLabel}>직업운</Text>
                                    <Text style={styles.fortuneStars}>★★★☆☆</Text>
                                </View>
                            </View>
                        </View>

                        {/* 오늘의 한마디 */}
                        <View style={styles.todayMessage}>
                            <Text style={styles.todayMessageText}>
                                새로운 인연이 찾아올 수 있는 좋은 날입니다. 적극적인 자세로 사람들과 소통해보세요! ✨
                            </Text>
                        </View>
                    </View>
                )}
                
                {/* 2. 전체 하트 랭킹 섹션 */}
                <View style={[styles.rankingSection, { borderTopWidth: 1, borderTopColor: '#eee' }]}>
                    <View style={styles.rankingHeader}>
                        <Ionicons name="trophy-outline" size={20} color="#333" />
                        <Text style={styles.rankingHeaderText}>전체 하트 랭킹</Text>
                    </View>
                    {isLoadingOverall ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color="#4CAF50" />
                        </View>
                    ) : (
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        style={styles.rankingScroll}
                        contentContainerStyle={styles.rankingScrollContent}
                    >
                        {sortedRankingData.slice(0, 5).map((item, index) => (
                            <View key={`ranking-${item.id}`}>
                                {renderRankingCard(item, index)}
                            </View>
                        ))}
                        <TouchableOpacity 
                            style={styles.viewAllButton}
                            onPress={() => {
                                setRankingModalType('all');
                                setShowRankingModal(true);
                            }}
                        >
                            <Ionicons name="chevron-forward-circle-outline" size={30} color="#4CAF50" />
                            <Text style={styles.viewAllText}>전체보기</Text>
                        </TouchableOpacity>
                    </ScrollView>
                    )}
                </View>

                {/* 3. 이달의 랭킹 섹션 */}
                <View style={styles.rankingSection}>
                    <View style={styles.rankingHeader}>
                        <Feather name="calendar" size={20} color="#333" />
                        <Text style={styles.rankingHeaderText}>이달의 랭킹</Text>
                    </View>
                    {isLoadingMonthly ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color="#4CAF50" />
                        </View>
                    ) : (
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        style={styles.rankingScroll}
                        contentContainerStyle={styles.rankingScrollContent}
                    >
                        {sortedMonthlyRankingData.slice(0, 5).map((item, index) => (
                            <View key={`monthly-${item.id}`}>
                                {renderRankingCard(item, index)}
                            </View>
                        ))}
                        <TouchableOpacity 
                            style={styles.viewAllButton}
                            onPress={() => {
                                setRankingModalType('monthly');
                                setShowRankingModal(true);
                            }}
                        >
                            <Ionicons name="chevron-forward-circle-outline" size={30} color="#4CAF50" />
                            <Text style={styles.viewAllText}>전체보기</Text>
                        </TouchableOpacity>
                    </ScrollView>
                    )}
                </View>

                {/* 4. 우리 지역 랭킹 섹션 */}
                <View style={styles.rankingSection}> 
                    <View style={styles.rankingHeader}>
                        <Ionicons name="location-outline" size={20} color="#333" />
                        <Text style={styles.rankingHeaderText}>우리 지역 랭킹</Text>
                    </View>
                    {isLoadingLocal ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color="#4CAF50" />
                        </View>
                    ) : (
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        style={styles.rankingScroll}
                        contentContainerStyle={styles.rankingScrollContent}
                    >
                        {sortedLocalRankingData.slice(0, 5).map((item, index) => (
                            <View key={`local-${item.id}`}>
                                {renderRankingCard(item, index)}
                            </View>
                        ))}
                        <TouchableOpacity 
                            style={styles.viewAllButton}
                            onPress={() => {
                                setRankingModalType('local');
                                setShowRankingModal(true);
                            }}
                        >
                            <Ionicons name="chevron-forward-circle-outline" size={30} color="#4CAF50" />
                            <Text style={styles.viewAllText}>전체보기</Text>
                        </TouchableOpacity>
                    </ScrollView>
                    )}
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
                    <Ionicons name="home" size={30} color="#4CAF50" /> 
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.navButton}
                    onPress={() => router.push('/(tabs)/two')}
                >
                    <Ionicons name="person-circle-outline" size={30} color="#999" />
                </TouchableOpacity>
            </View>

            {/* 랜덤 채팅/영상 선택 드롭다운 */}
            {showRandomModal && (
                <TouchableOpacity 
                    style={styles.dropdownOverlay}
                    activeOpacity={1}
                    onPress={() => setShowRandomModal(false)}
                >
                    <TouchableOpacity 
                        style={styles.dropdownMenu}
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <TouchableOpacity 
                            style={styles.dropdownOption}
                            onPress={() => {
                                setShowRandomModal(false);
                                // 랜덤 채팅 대기 화면으로 이동
                                router.push('/random-chat-waiting');
                            }}
                        >
                            <Ionicons name="chatbubble-outline" size={20} color="#333" />
                            <Text style={styles.dropdownOptionText}>랜덤 채팅</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.dropdownOption}
                            onPress={() => {
                                setShowRandomModal(false);
                                router.push('/random-video-waiting');
                            }}
                        >
                            <Ionicons name="videocam-outline" size={20} color="#333" />
                            <Text style={styles.dropdownOptionText}>랜덤 영상</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
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
                        
                        <View style={styles.profileModalBody}>
                        <ScrollView 
                            style={styles.profileModalScroll}
                            contentContainerStyle={styles.profileModalContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* 프로필 아바타 */}
                            <TouchableOpacity 
                                style={styles.profileAvatar}
                                onPress={() => setShowImageModal(true)}
                            >
                                {selectedProfile?.image ? (
                                    <Image 
                                        source={typeof selectedProfile.image === 'string' ? { uri: selectedProfile.image } : selectedProfile.image} 
                                        style={styles.profileAvatarImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Ionicons name="person" size={60} color="#fff" />
                                )}
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
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <Text style={styles.sectionTitle}>사주 키워드</Text>
                                    {(() => {
                                        const keywords = selectedProfile ? getProfileKeywords(selectedProfile.title) : [];
                                        return keywords.length > 4 ? (
                                            <TouchableOpacity 
                                                onPress={() => setKeywordsExpanded(!keywordsExpanded)}
                                            >
                                                <Ionicons 
                                                    name={keywordsExpanded ? "chevron-up" : "chevron-down"} 
                                                    size={20} 
                                                    color="#4CAF50" 
                                                />
                                            </TouchableOpacity>
                                        ) : null;
                                    })()}
                                </View>
                                <View style={styles.keywordsContainer}>
                                    {(() => {
                                        const keywords = selectedProfile ? getProfileKeywords(selectedProfile.title) : [];
                                        const displayCount = keywordsExpanded ? keywords.length : 4;
                                        const keywordsToShow = keywords.slice(0, displayCount);
                                        
                                        return keywordsToShow.map((keyword, index) => (
                                            <View key={index} style={styles.keywordTag}>
                                                <Text style={styles.keywordText}>{keyword}</Text>
                                            </View>
                                        ));
                                    })()}
                                </View>
                            </View>
                        </ScrollView>
                        </View>
                        <View style={styles.profileModalFooter}>
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
                                                const response = await fetch(getUserLikeEndpoint(selectedProfile.id), {
                                                    method: 'DELETE',
                                                    headers: {
                                                        'Authorization': `Bearer ${accessToken}`,
                                                    },
                                                });
                                                if (!response.ok) {
                                                    throw new Error('좋아요 취소 실패');
                                                }
                                                setIsHeartLiked(false);
                                                // 랭킹 데이터 새로고침
                                                await loadAllRankings();
                                            } else {
                                                // 좋아요 추가
                                                const response = await fetch(getUserLikeEndpoint(selectedProfile.id), {
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
                                                // 랭킹 데이터 새로고침
                                                await loadAllRankings();
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
                                
                                {!isFriendAdded && !isFriendRequestSent ? (
                                    <TouchableOpacity 
                                        style={styles.addFriendButton}
                                        onPress={async () => {
                                            const pendingRequests = await AsyncStorage.getItem('friend_requests');
                                            const requests = pendingRequests ? JSON.parse(pendingRequests) : [];
                                            const newRequest = {
                                                userName: selectedProfile?.title,
                                                avatarText: selectedProfile?.title.substring(0, 2) || '',
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
                                    <TouchableOpacity 
                                        style={[styles.addFriendButton, { opacity: 0.6 }]}
                                        disabled={true}
                                    >
                                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                        <Text style={styles.addFriendText}>친구 요청 전송됨</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <>
                                        <TouchableOpacity 
                                            style={styles.chatButton}
                                            onPress={() => {
                                                setShowProfileModal(false);
                                                router.push({
                                                    pathname: '/chat-room',
                                                    params: {
                                                        name: selectedProfile?.title || '사용자',
                                                        avatar: selectedProfile?.title.substring(0, 2) || '사용자'
                                                    }
                                                });
                                            }}
                                        >
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
            <ImageModal
                visible={showImageModal}
                onClose={() => setShowImageModal(false)}
                imageUri={null}
                imageSource={selectedProfile?.image}
                userName={selectedProfile?.title || '사용자'}
            />

            {/* 랭킹 목록 모달 */}
            <Modal
                visible={showRankingModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowRankingModal(false)}
            >
                <View style={styles.rankingModalOverlay}>
                    <View style={styles.rankingModal}>
                        <View style={styles.rankingModalHeader}>
                            <Text style={styles.rankingModalTitle}>
                                {rankingModalType === 'all' ? '전체 하트 랭킹' : 
                                 rankingModalType === 'monthly' ? '이달의 랭킹' : 
                                 '우리 지역 랭킹'}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => setShowRankingModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView 
                            style={styles.rankingModalScroll}
                            contentContainerStyle={styles.rankingModalContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {(() => {
                                const data = rankingModalType === 'all' ? sortedRankingData :
                                           rankingModalType === 'monthly' ? sortedMonthlyRankingData :
                                           sortedLocalRankingData;
                                return data.map((item, index) => (
                                    <TouchableOpacity
                                        key={`modal-${rankingModalType}-${item.id}`}
                                        style={styles.rankingModalItem}
                                        onPress={async () => {
                                            setSelectedProfile(item);
                                            setIsHeartLiked(false);
                                            setIsFriendAdded(false);
                                            setKeywordsExpanded(false);
                                            setShowRankingModal(false);
                                            
                                            const pendingRequests = await AsyncStorage.getItem('friend_requests');
                                            const requests = pendingRequests ? JSON.parse(pendingRequests) : [];
                                            const hasRequestSent = requests.some((req: any) => req.userName === item.title);
                                            setIsFriendRequestSent(hasRequestSent);
                                            
                                            setShowProfileModal(true);
                                        }}
                                    >
                                        <View style={styles.rankingModalItemLeft}>
                                            <Text style={styles.rankingModalNumber}>{index + 1}</Text>
                                            <View style={styles.rankingModalAvatar}>
                                                {item.image ? (
                                                    <Image 
                                                        source={typeof item.image === 'string' ? { uri: item.image } : item.image} 
                                                        style={styles.rankingModalAvatarImage}
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <Text style={styles.rankingModalAvatarText}>{item.title.substring(0, 2)}</Text>
                                                )}
                                            </View>
                                            <Text style={styles.rankingModalName}>{item.title}</Text>
                                        </View>
                                        <View style={styles.heartScore}>
                                            <AntDesign name="heart" size={16} color="#E53935" />
                                            <Text style={styles.scoreText}>{item.score.toLocaleString()}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ));
                            })()}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

export default HomeScreen;