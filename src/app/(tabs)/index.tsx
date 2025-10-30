import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Modal, Alert, Image } from 'react-native';
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
    
    // 안읽은 알림 개수 계산 함수
    const getUnreadNotificationCount = () => {
        // 실제로는 서버에서 받아와야 하지만, 여기서는 더미 데이터로 계산
        const friendRequests = 2; // 안읽은 친구 요청 (햇살왕자, 별빛나래)
        const otherNotifications = 2; // 안읽은 기타 알림 (달빛소녀, 바람처럼)
        return friendRequests + otherNotifications;
    };

    // 컴포넌트 마운트 시 알림 개수 로드
    useEffect(() => {
        loadNotificationCount();
    }, []);

    // 화면 포커스 시 알림 개수 다시 로드
    useFocusEffect(
        React.useCallback(() => {
            loadNotificationCount();
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


    //전체 랭킹 데이터를 위한 더미 배열 (실제 데이터는 서버에서 받아와야 합니다)
    const rankingData = [
        { id: 1, title: '카리나', score: 15420, icon: 'person', image: karinaImageUrl },
        { id: 2, title: '유나', score: 12890, icon: 'person', image: yunaImageUrl },
        { id: 3, title: '윈터', score: 11250, icon: 'person', image: winterImageUrl },
        { id: 4, title: '설윤', score: 9870, icon: 'person', image: sulyunImageUrl },
        { id: 5, title: '카즈하', score: 9200, icon: 'person' , image: kazuhaImageUrl },
        // 데이터가 더 많다면 이 배열에 계속 추가됩니다.
    ];

    //이달의 랭킹 프로필 이미지 URL (여기에 이미지 URL을 입력하세요)
    const chaewonImageUrl = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyMzAyMDFfMjgg%2FMDAxNjc1MjU1OTI0NDU4.FGEfyFN91NCetcBca1GLfsCrbqJ-fT8ssFzEue2xLacg.5LmwExujHWFo3IckaDikm_Q1dmJ3Rn6_O-uK6TI35q4g.JPEG.jhs020329%2Fkchaewon.lesserafim%25A3%25AD07%25A3%25AD01%25A3%25AD2023%25A3%25AD0008.jpg&type=sc960_832'; // 여기에 실제 이미지 URL을 넣어주세요
    const anImageUrl = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNTA5MTBfMTIz%2FMDAxNzU3NDM2MDUxNDQy.RLLyJVme3Hr50QxdxZDtFytpitnTFse9QQRjBL9A08Eg.b6SJcJg1Fjxz9uLIBhghXUKl3UjpsOQB6mYKiwSzfhAg.JPEG%2F0000278857%25A3%25DF001%25A3%25DF20250901194515625.jpg&type=sc960_832'
    const julieImageUrl = 'https://search.pstatic.net/sunny/?src=https%3A%2F%2Fimg-cdn.theqoo.net%2FjoYDjc.jpg&type=sc960_832'
    const yuyunImageUrl = 'https://search.pstatic.net/sunny/?src=http%3A%2F%2Ffile3.instiz.net%2Fdata%2Fcached_img%2Fupload%2F2022%2F02%2F04%2F15%2F4fbeedcee7f673e141dcdb3234fff3b6.jpg&type=a340'
    const natiImageUrl = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDAxMTRfMTA4%2FMDAxNzA1MjI1NDE1NzYy.v5CQhWcExHieBvdB7k4G7BrTjaMrA_lmF7p9NS9gfjcg.brwb6KYmfkdrvKEWny-5aATE-uq2BZ8IPjMg8axk6esg.JPEG.idhair3377%2FKakaoTalk%25A3%25DF20240102%25A3%25DF202648326%25A3%25DF02.jpg&type=sc960_832'
    //이달의 랭킹 데이터를 위한 더미 배열
    const monthlyRankingData = [
        { id: 1, title: '김채원', score: 8650, icon: 'person' , image: chaewonImageUrl },
        { id: 2, title: '이안', score: 7980, icon: 'person' , image: anImageUrl },
        { id: 3, title: '쥴리', score: 7320, icon: 'person' , image: julieImageUrl },
        { id: 4, title: '김유연', score: 6850, icon: 'person', image: yuyunImageUrl },
        { id: 5, title: '나띠', score: 6200, icon: 'person', image: natiImageUrl},
    ];
    //우리 지역 랭킹 프로필 이미지 URL
    const hankang = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNTA5MThfMTg0%2FMDAxNzU4MTcwMzA0MTU3.GXbLc0CJQrjuD-B1qctDtX-nArPIat2PRGyTBQ637qEg.vr_k_nYiLgcZyam9d95TqxqE_eu28lMh9O5X4HUO69Qg.JPEG%2F%25B4%25D9%25BF%25EE%25B7%25CE%25B5%25E5%25A3%25AD5.jpeg&type=sc960_832'
    const businessman = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyMzA0MTdfNzMg%2FMDAxNjgxNzI5NjQ3MTU4._rNBN9aW2S7gzXgf2K3JNxZZbNESHfIdBg5cVvSOILgg.PzlFD74YoCNgED2QhdArWuIHFapoHz-KMiumHApo5Y8g.JPEG.kuj3423%2FIMG_8757.jpg&type=sc960_832'
    const hongpeople = 'https://scontent-ssn1-1.cdninstagram.com/v/t51.82787-15/568223023_18031780538733701_5521788549443438675_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_cat=110&ig_cache_key=Mzc0OTQzMDM2OTk1MTc5NzE1OQ%3D%3D.3-ccb1-7&ccb=1-7&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTg3Ny5zZHIuQzMifQ%3D%3D&_nc_ohc=pfwUqf0qTB8Q7kNvwEPX8Nr&_nc_oc=AdkvYrRfW1tcmzP8f-JUMVgfpUUbmYIAcrZczXBv1r7KjTEiurEHmAXK4hPaUVTyfRU&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-ssn1-1.cdninstagram.com&_nc_gid=UrFwVhE0N93uHOXJEisYPA&oh=00_AfcdjFzXKto28OP2wCU45uxbDbq82lLHGMSQhSF06AajsQ&oe=6907F148'
    const seoulseoul = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDA5MTJfMTI4%2FMDAxNzI2MTIxODIwNTQ0.8Aaxt2H_uaSFDHgNnrnIkZN9Zoi72rsoVcqMBkNrLxwg.yLmfkwykRwCLuvC5aohxhtxHuxdCLBFVR1sA3SHf328g.JPEG%2F20220515_183434.jpg&type=sc960_832'
    const sinchon = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fcafefiles.naver.net%2FMjAxOTA5MDVfMjE5%2FMDAxNTY3NjgwMDc5Mzk1.0MHFWyM4gXp_QLmWU4Sz4u_6VueWXWujOH2NXP2vy70g.vM-11sAkx726DCR2CG4H0_z5364IQEsp4GNkCJpuAacg.JPEG%2F1%25C0%25CF%25C2%25F7-10.jpg&type=sc960_832'
    //우리 지역 랭킹 데이터를 위한 더미 배열
    const localRankingData = [
        { id: 1, title: '홍대피플', score: 2650, icon: 'person' , image: hongpeople },
        { id: 2, title: '한강뷰', score: 3420, icon: 'person', image: hankang },
        { id: 3, title: '비즈니스맨', score: 2890, icon: 'person' , image: businessman },
        { id: 4, title: '서울숲', score: 2420, icon: 'person' , image: seoulseoul },
        { id: 5, title: '신촌을 못가', score: 2300, icon: 'person' , image: sinchon },
    ];

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
                <View style={styles.rankingSection}>
                    <View style={styles.rankingHeader}>
                        <Ionicons name="trophy-outline" size={20} color="#333" />
                        <Text style={styles.rankingHeaderText}>전체 하트 랭킹</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rankingScroll}>
                        {rankingData.map((item, index) => (
                            <View key={`ranking-${item.id}`}>
                                {renderRankingCard(item, index)}
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* 3. 이달의 랭킹 섹션 */}
                <View style={styles.rankingSection}>
                    <View style={styles.rankingHeader}>
                        <Feather name="calendar" size={20} color="#333" />
                        <Text style={styles.rankingHeaderText}>이달의 랭킹</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rankingScroll}>
                        {monthlyRankingData.map((item, index) => (
                            <View key={`monthly-${item.id}`}>
                                {renderRankingCard(item, index)}
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* 4. 우리 지역 랭킹 섹션 */}
                <View style={[styles.rankingSection, { marginBottom: 30 }]}> 
                    <View style={styles.rankingHeader}>
                        <Ionicons name="location-outline" size={20} color="#333" />
                        <Text style={styles.rankingHeaderText}>우리 지역 랭킹</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rankingScroll}>
                        {localRankingData.map((item, index) => (
                            <View key={`local-${item.id}`}>
                                {renderRankingCard(item, index)}
                            </View>
                        ))}
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
                        
                        <View style={styles.profileModalContent}>
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
                                
                                {!isFriendAdded && !isFriendRequestSent ? (
                                    // 친구 추가 버튼
                                    <TouchableOpacity 
                                        style={styles.addFriendButton}
                                        onPress={async () => {
                                            // 친구 요청 저장
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
                                        <TouchableOpacity 
                                            style={styles.chatButton}
                                            onPress={() => {
                                                // 채팅방으로 이동
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

        </View>
    );
};

export default HomeScreen;