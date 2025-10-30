import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type Message = { id: string; sender: 'me' | 'support'; text: string };

export default function SupportChatScreen() {
    const [messages, setMessages] = useState<Message[]>([
        { id: 'sys1', sender: 'support', text: '안내) 평일 09:00-18:00 운영합니다. 최대한 빠르게 답변드릴게요 🙌' },
    ]);
    const [input, setInput] = useState('');

    const send = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        const myMsg: Message = { id: String(Date.now()), sender: 'me', text: trimmed };
        setMessages((prev) => [...prev, myMsg]);
        setInput('');
        setTimeout(() => {
            setMessages((prev) => [...prev, { id: String(Date.now()+1), sender: 'support', text: '접수되었습니다. 확인 후 안내드리겠습니다.' }]);
        }, 700);
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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
            {/* 헤더 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#333' }}>채팅 상담</Text>
            </View>

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
                    placeholder="문의 내용을 입력하세요"
                    style={{ flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 }}
                />
                <TouchableOpacity onPress={send} style={{ backgroundColor: '#4CAF50', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 }}>
                    <Ionicons name="send" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}


