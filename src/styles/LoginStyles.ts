import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

const getStatusBarHeight = () => {
    if (Platform.OS === 'android') {
        return StatusBar.currentHeight || 0;
    }
    return 0;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: getStatusBarHeight(),
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
        marginTop: 40,
    },
    socialButton: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        position: 'relative',
    },
    googleButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    kakaoButton: {
        backgroundColor: '#FEE500',
    },
    naverButton: {
        backgroundColor: '#03C75A',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    googleButtonText: {
        color: '#333',
    },
    kakaoButtonText: {
        color: '#000',
    },
    naverButtonText: {
        color: '#fff',
    },
    iconContainer: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: 16,
    },
    logoImage: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
    },
    tempButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
    },
    tempButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#fff',
    },
});

export default styles;

