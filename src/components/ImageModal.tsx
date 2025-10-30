import React from 'react';
import { Modal, View, TouchableOpacity, Image, Text, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImageModalProps {
    visible: boolean;
    onClose: () => void;
    imageUri?: string | null;
    imageSource?: any; // 로컬 이미지 소스 (require로 가져온 이미지)
    userName?: string;
    showDefaultIcon?: boolean;
}

export default function ImageModal({ 
    visible, 
    onClose, 
    imageUri, 
    imageSource,
    userName = '사용자',
    showDefaultIcon = true 
}: ImageModalProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            {/* 바깥 영역을 탭하면 닫히도록 전체 오버레이를 터치 가능하게 처리 */}
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {/* 사진과 이름 부분은 터치해도 닫히지 않도록 전파 차단 */}
                <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={{ alignItems: 'center' }}>
                        {/* 프로필 이미지 */}
                        <View style={{
                            width: 300,
                            height: 300,
                            borderRadius: 150,
                            backgroundColor: (imageUri || imageSource) ? 'transparent' : '#4CAF50',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                            borderWidth: 4,
                            borderColor: 'rgba(255, 255, 255, 0.3)'
                        }}>
                            {imageUri ? (
                                <Image 
                                    source={{ uri: imageUri }} 
                                    style={{ 
                                        width: 300, 
                                        height: 300,
                                        borderRadius: 150
                                    }}
                                    resizeMode="cover"
                                />
                            ) : imageSource ? (
                                <Image 
                                    source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource} 
                                    style={{ 
                                        width: 300, 
                                        height: 300,
                                        borderRadius: 150
                                    }}
                                    resizeMode="cover"
                                />
                            ) : showDefaultIcon ? (
                                <Ionicons name="person" size={120} color="#fff" />
                            ) : null}
                        </View>
                        
                        {/* 사용자 이름 */}
                        <Text style={{
                            color: '#fff',
                            fontSize: 18,
                            fontWeight: '600',
                            marginTop: 20,
                            textAlign: 'center'
                        }}>
                            {userName}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </Modal>
    );
}
