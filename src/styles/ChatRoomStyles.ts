import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    // 전체 컨테이너
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    
    // 상단 헤더
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 5,
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerAvatar: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerAvatarText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    moreButton: {
        padding: 5,
    },
    headerRight: {
        width: 34,
    },
    reportButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // 메시지 영역
    messagesContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    messagesContent: {
        padding: 15,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 15,
        alignItems: 'flex-end',
    },
    myMessageWrapper: {
        justifyContent: 'flex-end',
    },
    otherMessageWrapper: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    messageAvatarText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    messageContent: {
        maxWidth: '70%',
    },
    messageBubble: {
        borderRadius: 18,
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    myMessageBubble: {
        backgroundColor: '#4CAF50',
    },
    otherMessageBubble: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#fff',
    },
    otherMessageText: {
        color: '#333',
    },
    messageTime: {
        fontSize: 11,
        marginTop: 4,
        color: '#999',
    },
    myMessageTime: {
        textAlign: 'right',
    },
    otherMessageTime: {
        textAlign: 'left',
    },
    
    // 하단 입력 영역
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 15,
        paddingBottom: 15, // 키보드가 올라올 때 자동으로 조정되도록 여백 감소
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    addButton: {
        marginRight: 10,
    },
    textInputWrapper: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        maxHeight: 100,
    },
    textInput: {
        fontSize: 15,
        color: '#333',
        lineHeight: 20,
    },
    sendButton: {
        marginLeft: 10,
        padding: 5,
    },
    
    // 사주 궁합도 카드
    compatibilityCard: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: 15,
        marginBottom: 10,
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    compatibilityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    compatibilityIcon: {
        marginRight: 8,
    },
    compatibilityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    compatibilityScoreContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    compatibilityScore: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 5,
    },
    compatibilityScoreLabel: {
        fontSize: 14,
        color: '#666',
    },
    compatibilityRating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    compatibilityRatingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4CAF50',
        marginRight: 5,
    },
    compatibilityDescription: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    compatibilityDescriptionText: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    
    // 메시지 이미지
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 5,
    },
    messageBubbleWithImage: {
        marginTop: 5,
    },
    
    // 사진 선택 모달
    imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    imageOptionsContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    imageOptionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    imageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 10,
    },
    imageOptionText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 15,
        fontWeight: '500',
    },
    cancelOption: {
        backgroundColor: '#FFE5E5',
        marginTop: 5,
    },
    cancelOptionText: {
        color: '#E53935',
    },
    
    // 대화주제 추천 버튼
    topicButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
});

export default styles;


