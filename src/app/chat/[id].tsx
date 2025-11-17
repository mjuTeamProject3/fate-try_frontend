import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Image, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

type Message = { id: string; sender: 'me' | 'friend'; text?: string; image?: string };

export default function FriendChatScreen() {
    const params = useLocalSearchParams<{ id?: string; name?: string }>();
    const friendName = (params.name as string) || '친구';

    const [messages, setMessages] = useState<Message[]>([
        { id: 'm1', sender: 'friend', text: '안녕! 반가워요 😊' },
        { id: 'm2', sender: 'me', text: '안녕하세요! 무엇을 하고 계세요?' },
    ]);
    const [input, setInput] = useState('');
    const [showImageOptions, setShowImageOptions] = useState(false);
    const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

    const send = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        setMessages((prev) => [...prev, { id: String(Date.now()), sender: 'me', text: trimmed }]);
        setInput('');
        setTimeout(() => {
            setMessages((prev) => [...prev, { id: String(Date.now() + 1), sender: 'friend', text: '좋아요! 😀' }]);
        }, 400);
    };

    const appendImageMessage = (uri: string) => {
        setMessages((prev) => [
            ...prev,
            {
                id: String(Date.now()),
                sender: 'me',
                image: uri,
            },
        ]);
    };

    const requestPermission = async (type: 'camera' | 'media') => {
        const permission =
            type === 'camera'
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('권한 필요', type === 'camera' ? '카메라 권한이 필요합니다.' : '갤러리 접근 권한이 필요합니다.');
            return false;
        }
        return true;
    };

    const pickImageFromGallery = async () => {
        const granted = await requestPermission('media');
        if (!granted) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            appendImageMessage(result.assets[0].uri);
            setShowImageOptions(false);
        }
    };

    const takePhoto = async () => {
        const granted = await requestPermission('camera');
        if (!granted) return;
        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
            allowsEditing: true,
        });
        if (!result.canceled && result.assets[0]) {
            appendImageMessage(result.assets[0].uri);
            setShowImageOptions(false);
        }
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isMe = item.sender === 'me';
        return (
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    marginVertical: 6,
                    paddingHorizontal: 16,
                }}
            >
                <View
                    style={{
                        maxWidth: '80%',
                        backgroundColor: isMe ? '#DCF8C6' : '#fff',
                        borderRadius: 16,
                        paddingHorizontal: item.image ? 0 : 12,
                        paddingVertical: item.image ? 0 : 8,
                        borderWidth: isMe ? 0 : 1,
                        borderColor: '#eee',
                        overflow: 'hidden',
                    }}
                >
                    {item.image && (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => setPreviewImageUri(item.image || null)}
                            accessibilityRole="imagebutton"
                            accessibilityLabel="보낸 사진 크게 보기"
                        >
                            <Image source={{ uri: item.image }} style={{ width: 220, height: 220, borderRadius: 12 }} resizeMode="cover" />
                        </TouchableOpacity>
                    )}
                    {item.text && (
                        <Text style={{ color: '#333', fontSize: 15, paddingHorizontal: item.image ? 12 : 0, paddingVertical: item.image ? 10 : 0 }}>
                            {item.text}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9' }} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                {/* 헤더 */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: '#fff',
                        borderBottomWidth: 1,
                        borderBottomColor: '#eee',
                    }}
                >
                    <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#333' }}>{friendName}</Text>
                </View>

                {/* 메시지 리스트 */}
                <FlatList
                    data={messages}
                    keyExtractor={(m) => m.id}
                    renderItem={renderItem}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingVertical: 12, paddingBottom: 40 }}
                />

                {/* 입력 바 */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        borderTopWidth: 1,
                        borderTopColor: '#eee',
                        columnGap: 10,
                    }}
                >
                    <TouchableOpacity onPress={() => setShowImageOptions(true)} style={{ padding: 4 }}>
                        <Ionicons name="add-circle-outline" size={30} color="#4CAF50" />
                    </TouchableOpacity>
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="메시지를 입력하세요"
                        style={{
                            flex: 1,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 20,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                        }}
                    />
                    <TouchableOpacity onPress={send} style={{ backgroundColor: '#4CAF50', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24 }}>
                        <Ionicons name="send" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <Modal visible={showImageOptions} transparent animationType="fade" onRequestClose={() => setShowImageOptions(false)}>
                <TouchableWithoutFeedback onPress={() => setShowImageOptions(false)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                        <TouchableWithoutFeedback>
                            <View
                                style={{
                                    backgroundColor: '#fff',
                                    paddingHorizontal: 20,
                                    paddingTop: 20,
                                    paddingBottom: 30,
                                    borderTopLeftRadius: 24,
                                    borderTopRightRadius: 24,
                                }}
                            >
                                <Text style={{ fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 20 }}>사진 보내기</Text>
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15 }}
                                    onPress={pickImageFromGallery}
                                >
                                    <Ionicons name="images-outline" size={24} color="#4CAF50" />
                                    <Text style={{ marginLeft: 12, fontSize: 16, color: '#333' }}>갤러리에서 선택</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15 }} onPress={takePhoto}>
                                    <Ionicons name="camera-outline" size={24} color="#4CAF50" />
                                    <Text style={{ marginLeft: 12, fontSize: 16, color: '#333' }}>카메라로 촬영</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15 }}
                                    onPress={() => setShowImageOptions(false)}
                                >
                                    <Ionicons name="close-circle-outline" size={24} color="#E53935" />
                                    <Text style={{ marginLeft: 12, fontSize: 16, color: '#E53935' }}>취소</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal visible={!!previewImageUri} transparent animationType="fade" onRequestClose={() => setPreviewImageUri(null)}>
                <TouchableWithoutFeedback onPress={() => setPreviewImageUri(null)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
                        <TouchableWithoutFeedback>
                            <View style={{ width: '100%', alignItems: 'center', position: 'relative' }}>
                                {previewImageUri && (
                                    <Image
                                        source={{ uri: previewImageUri }}
                                        style={{ width: '100%', height: 350, borderRadius: 18 }}
                                        resizeMode="contain"
                                    />
                                )}
                                <TouchableOpacity
                                    onPress={() => setPreviewImageUri(null)}
                                    style={{ position: 'absolute', top: -10, right: 0, padding: 8 }}
                                    accessibilityRole="button"
                                    accessibilityLabel="이미지 닫기"
                                >
                                    <Ionicons name="close-circle" size={32} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}


