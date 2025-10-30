import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        paddingTop: 50, // 상태바 높이 고려
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    mainCard: {
        flex: 1,
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    friendsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    friendsIcon: {
        marginRight: 8,
    },
    friendsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginRight: 8,
    },
    friendsCount: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    friendsCountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    addFriendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addFriendText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    searchInput: {
        backgroundColor: '#4CAF50',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchText: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
    },
    searchPlaceholder: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    friendsList: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    friendAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    friendAvatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    friendStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    onlineDot: {
        backgroundColor: '#4CAF50',
    },
    offlineDot: {
        backgroundColor: '#999',
    },
    statusText: {
        fontSize: 14,
        color: '#666',
    },
    messageButton: {
        padding: 8,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '80%',
        maxWidth: 300,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 15,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    cancelButtonText: {
        color: '#666',
    },
    confirmButtonText: {
        color: '#fff',
    },
});

export default styles;
