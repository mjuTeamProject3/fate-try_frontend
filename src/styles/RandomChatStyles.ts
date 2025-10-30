import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// 랜덤 채팅 대기 화면 스타일
const styles = StyleSheet.create({
    // 메인 컨테이너
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    // 헤더 영역
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    // 뒤로가기 버튼
    backButton: {
        padding: 5,
    },
    // 헤더 제목
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    // 헤더 여백 (균형 맞추기용)
    headerSpacer: {
        width: 34,
    },
    // 메인 콘텐츠 영역
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    // 로딩 애니메이션 컨테이너
    loadingContainer: {
        marginBottom: 40,
    },
    // 로딩 원형 테두리
    loadingCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#E8F5E8',
        borderTopColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // 내부 원형 (아이콘 배경)
    innerCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // 메인 메시지
    mainMessage: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    // 서브 메시지
    subMessage: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    // 경과 시간 표시
    elapsedTime: {
        fontSize: 14,
        color: '#4CAF50',
        marginBottom: 30,
    },
    // 대기 인원 정보 컨테이너
    queueInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    // 대기 인원 텍스트
    queueText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 8,
    },
    // 프로그레스 바 컨테이너
    progressBarContainer: {
        width: '100%',
        marginBottom: 40,
    },
    // 프로그레스 바 배경
    progressBar: {
        height: 6,
        backgroundColor: '#E8F5E8',
        borderRadius: 3,
        overflow: 'hidden',
    },
    // 프로그레스 바 채워진 부분
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 3,
    },
    // 취소 버튼
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E53935',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        gap: 8,
    },
    // 취소 버튼 텍스트
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    // 신고하기 버튼
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#FF9800',
        gap: 8,
    },
    // 신고하기 버튼 텍스트
    reportButtonText: {
        color: '#FF9800',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default styles;



