import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function LogoutScreen() {
    const confirmLogout = () => {
        Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
                text: '로그아웃', style: 'destructive', onPress: () => {
                    // TODO: 실제 로그아웃 로직 연동 (토큰 제거 등)
                    Alert.alert('완료', '로그아웃되었습니다.');
                    router.replace('/(tabs)');
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>로그아웃</Text>
            </View>

            <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, color: '#333', marginBottom: 16 }}>계정에서 로그아웃합니다.</Text>
                <TouchableOpacity onPress={confirmLogout} style={{ backgroundColor: '#E53935', padding: 14, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>로그아웃</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}


