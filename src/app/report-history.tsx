import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ReportHistoryScreen() {
    const items = [
        { id: '1', title: '욕설/비방 신고', userName: '스타✨', date: '2024-12-01', status: '처리완료' },
        { id: '2', title: '스팸 신고', userName: '달빛소녀', date: '2024-11-22', status: '접수' },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>신고 내역</Text>
            </View>

            <FlatList
                data={items}
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                    <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <Text style={{ color: '#333', fontWeight: '600', flex: 1 }}>{item.title}</Text>
                            <View style={{ 
                                backgroundColor: item.status === '처리완료' ? '#E8F5E8' : '#FFF3E0', 
                                paddingHorizontal: 8, 
                                paddingVertical: 2, 
                                borderRadius: 8 
                            }}>
                                <Text style={{ 
                                    color: item.status === '처리완료' ? '#4CAF50' : '#FF9800', 
                                    fontSize: 10, 
                                    fontWeight: '600' 
                                }}>
                                    {item.status}
                                </Text>
                            </View>
                        </View>
                        <Text style={{ color: '#666', fontSize: 14, marginBottom: 4 }}>신고 대상: {item.userName}</Text>
                        <Text style={{ color: '#999', fontSize: 12 }}>{item.date}</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}


