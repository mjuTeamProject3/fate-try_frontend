import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function BlockedScreen() {
    const [blocked, setBlocked] = useState<string[]>(['김민수', '박소영']);

    const unblock = (name: string) => {
        Alert.alert('차단 해제', `${name} 님을 차단 해제할까요?`, [
            { text: '취소', style: 'cancel' },
            { text: '해제', onPress: () => setBlocked((prev) => prev.filter((n) => n !== name)) }
        ]);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>차단 목록</Text>
            </View>

            <FlatList
                data={blocked}
                keyExtractor={(n) => n}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                        <Text style={{ color: '#333', fontSize: 16 }}>{item}</Text>
                        <TouchableOpacity onPress={() => unblock(item)} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
                            <Text style={{ color: '#333' }}>해제</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={{ color: '#777' }}>차단된 사용자가 없습니다.</Text>}
            />
        </SafeAreaView>
    );
}


