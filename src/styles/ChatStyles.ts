import { StyleSheet, StatusBar, Platform } from 'react-native';

// 상태 표시줄 높이를 안전하게 가져오는 함수
const getStatusBarHeight = () => {
    if (Platform.OS === 'android') {
        return StatusBar.currentHeight || 0;
    }
    return 0;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        paddingTop: 0,
    },
    
    // 헤더 스타일
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: getStatusBarHeight() + 5,
        paddingBottom: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    headerRight: {
        width: 34, // 뒤로가기 버튼과 균형 맞추기
    },

    // 검색 바 스타일
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginVertical: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },

    // 채팅 목록 스타일
    chatList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 15,
        paddingHorizontal: 15,
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    chatLeft: {
        marginRight: 15,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarText: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4CAF50',
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 50,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: 'white',
    },
    chatCenter: {
        flex: 1,
    },
    chatName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    lastMessage: {
        fontSize: 14,
        color: '#777',
    },
    chatRight: {
        alignItems: 'flex-end',
    },
    messageTime: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    unreadBadge: {
        backgroundColor: '#4CAF50',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default styles;
