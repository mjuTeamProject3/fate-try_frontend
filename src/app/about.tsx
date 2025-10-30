import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/i18nContext';

export default function AboutScreen() {
    const { t } = useI18n();
    
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{t('about')}</Text>
            </View>

            <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#333' }}>{t('appName')}</Text>
                <Text style={{ color: '#777', marginTop: 6 }}>{t('version')} 1.0.0</Text>
                <Text style={{ color: '#777', marginTop: 12 }}>
                    {t('description')}
                </Text>
            </View>
        </SafeAreaView>
    );
}


