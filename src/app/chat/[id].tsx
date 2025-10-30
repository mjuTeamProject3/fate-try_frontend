import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

type Message = { id: string; sender: 'me' | 'friend'; text: string };

export default function FriendChatScreen() {
    const params = useLocalSearchParams<{ id?: string; name?: string }>();
    const friendName = (params.name as string) || '친구';

    const [messages, setMessages] = useState<Message[]>([
        { id: 'm1', sender: 'friend', text: '안녕! 반가워요 😊' },
        { id: 'm2', sender: 'me', text: '안녕하세요! 무엇을 하고 계세요?' },
    ]);
    const [input, setInput] = useState('');

    const send = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        setMessages((prev) => [...prev, { id: String(Date.now()), sender: 'me', text: trimmed }]);
        setInput('');
        // 간단한 에코 응답
        setTimeout(() => {
            setMessages((prev) => [...prev, { id: String(Date.now()+1), sender: 'friend', text: '좋아요! 😀' }]);
        }, 400);
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isMe = item.sender === 'me';
        return (
            <View style={{ flexDirection: 'row', justifyContent: isMe ? 'flex-end' : 'flex-start', marginVertical: 4, paddingHorizontal: 16 }}>
                <View style={{ maxWidth: '80%', backgroundColor: isMe ? '#DCF8C6' : '#fff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: isMe ? 0 : 1, borderColor: '#eee' }}>
                    <Text style={{ color: '#333', fontSize: 15 }}>{item.text}</Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
            {/* 헤더 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
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
                contentContainerStyle={{ paddingVertical: 12 }}
            />

            {/* 입력 바 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 15, paddingBottom: 35, borderTopWidth: 1, borderTopColor: '#eee' }}>
                <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="메시지를 입력하세요"
                    style={{ flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 }}
                />
                <TouchableOpacity onPress={send} style={{ backgroundColor: '#4CAF50', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 }}>
                    <Ionicons name="send" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}


