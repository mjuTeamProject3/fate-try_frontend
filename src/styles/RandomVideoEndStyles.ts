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
    videoIconContainer: {
        marginBottom: 40,
    },
    videoIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E8F5E8',
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
        marginBottom: 60,
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
        gap: 15,
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FF9800',
        borderRadius: 25,
        paddingVertical: 15,
        paddingHorizontal: 30,
        gap: 8,
    },
    reportButtonText: {
        fontSize: 16,
        color: '#FF9800',
        fontWeight: '500',
    },
    matchAgainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        borderRadius: 25,
        paddingVertical: 15,
        paddingHorizontal: 30,
        gap: 8,
    },
    matchAgainButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    goHomeButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 25,
        paddingVertical: 15,
        paddingHorizontal: 30,
    },
    goHomeButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
});

export default styles;
