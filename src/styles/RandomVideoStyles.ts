import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSpacer: {
        width: 34, // 뒤로가기 버튼과 동일한 너비
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    loadingContainer: {
        marginBottom: 40,
    },
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
    innerCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainMessage: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    subMessage: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    elapsedTime: {
        fontSize: 14,
        color: '#4CAF50',
        marginBottom: 30,
    },
    queueInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    queueText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 8,
    },
    progressBarContainer: {
        width: '100%',
        marginBottom: 40,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E8F5E8',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 3,
    },
    controlsContainer: {
        flexDirection: 'row',
        marginBottom: 40,
        gap: 20,
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    controlButtonOff: {
        backgroundColor: '#f5f5f5',
        borderColor: '#999',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E53935',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        gap: 8,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default styles;
