import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        paddingTop: 50, // 상태바 높이 고려
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    backButton: {
        padding: 5,
    },
    headerSpacer: {
        width: 34,
    },
    markAllReadButton: {
        padding: 5,
    },
    markAllReadText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
    scrollContent: {
        padding: 20,
    },
    notificationSection: {
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    notificationBadge: {
        backgroundColor: '#4CAF50',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    notificationCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    notificationInfo: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    notificationIcon: {
        marginRight: 6,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginRight: 6,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    declineButton: {
        backgroundColor: '#f44336',
    },
    systemNotification: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    systemNotificationContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    systemIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    systemInfo: {
        flex: 1,
    },
    systemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    systemMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    systemTime: {
        fontSize: 12,
        color: '#999',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },

    // 프로필 모달 스타일
    profileModalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    profileModal: {
        backgroundColor: '#fff',
        borderRadius: 20,
        maxHeight: '80%',
        width: '90%',
        maxWidth: 400,
        paddingTop: 20,
    },
    profileModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    profileModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    profileModalContent: {
        padding: 20,
        alignItems: 'center',
    },
    profileAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    profileLocation: {
        fontSize: 16,
        color: '#666',
        marginBottom: 15,
    },
    profileStats: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 15,
    },
    statText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 5,
    },
    aboutSection: {
        width: '100%',
        marginBottom: 20,
    },
    // sectionTitle는 앞에서 정의됨 (중복 방지)
    aboutText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    keywordsSection: {
        width: '100%',
        marginBottom: 20,
    },
    keywordsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    keywordTag: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#4CAF50',
        borderRadius: 15,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    keywordText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
    
    // 액션 버튼 컨테이너
    actionButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-between',
    },
    heartButton: {
        backgroundColor: '#f8f9fa',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 12,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addFriendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 12,
        flex: 2,
        justifyContent: 'center',
    },
    addFriendText: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '500',
        marginLeft: 8,
    },
    chatButton: {
        backgroundColor: '#f8f9fa',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 12,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeFriendButton: {
        backgroundColor: '#f8f9fa',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 12,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // 이미지 확대 모달 스타일
    imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalCloseArea: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalContent: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
        height: '100%',
    },
    imageModalCloseButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 20,
        padding: 10,
    },
    expandedAvatar: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    expandedAvatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
});

export default styles;
