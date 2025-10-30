import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ProfileMenuScreen() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>메뉴</Text>
            </View>

            <View style={{ padding: 16, gap: 12 }}>
                <TouchableOpacity onPress={() => router.push('/settings')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f7f7f7', borderRadius: 10 }}>
                    <Ionicons name="settings-outline" size={22} color="#333" />
                    <Text style={{ marginLeft: 10, fontSize: 16, color: '#333' }}>설정</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/help')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f7f7f7', borderRadius: 10 }}>
                    <Ionicons name="help-circle-outline" size={22} color="#333" />
                    <Text style={{ marginLeft: 10, fontSize: 16, color: '#333' }}>고객센터</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/account')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f7f7f7', borderRadius: 10 }}>
                    <Ionicons name="person-outline" size={22} color="#333" />
                    <Text style={{ marginLeft: 10, fontSize: 16, color: '#333' }}>계정관리</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/logout')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff1f1', borderRadius: 10 }}>
                    <Ionicons name="log-out-outline" size={22} color="#E53935" />
                    <Text style={{ marginLeft: 10, fontSize: 16, color: '#E53935' }}>로그아웃</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}


