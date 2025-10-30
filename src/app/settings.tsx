import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Switch, ScrollView, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useI18n } from '@/contexts/i18nContext';

export default function SettingsScreen() {
    const { t, language, setLanguage } = useI18n();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [profilePublic, setProfilePublic] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [selectedBackground, setSelectedBackground] = useState('default');
    const [volume, setVolume] = useState(50);
    const [micVolume, setMicVolume] = useState(50);
    
    // Expandable sections
    const [soundExpanded, setSoundExpanded] = useState(false);
    
    // Language selection modal
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [showBackgroundModal, setShowBackgroundModal] = useState(false);

    // load persisted toggles
    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem('app_settings');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setNotificationsEnabled(parsed.notificationsEnabled ?? true);
                    setDarkModeEnabled(parsed.darkModeEnabled ?? false);
                    setProfilePublic(parsed.profilePublic ?? true);
                    setLocationEnabled(parsed.locationEnabled ?? true);
                    setVolume(parsed.volume ?? 50);
                    setMicVolume(parsed.micVolume ?? 50);
                    setSelectedBackground(parsed.selectedBackground ?? 'default');
                }
            } catch {}
        })();
    }, []);

    // persist on change
    useEffect(() => {
        const data = { notificationsEnabled, darkModeEnabled, profilePublic, locationEnabled, volume, micVolume, selectedBackground };
        AsyncStorage.setItem('app_settings', JSON.stringify(data)).catch(() => {});
    }, [notificationsEnabled, darkModeEnabled, profilePublic, locationEnabled, volume, micVolume, selectedBackground]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{t('settings')}</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {/* 알림 설정 카드 */}
                <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eee', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Ionicons name="notifications-outline" size={20} color="#25a244" />
                        <Text style={{ marginLeft: 8, fontWeight: '700', color: '#333' }}>{t('notificationSettings')}</Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 }} />
                    <RowSwitch icon="notifications-outline" title={t('pushNotifications')} subtitle={t('pushNotificationSubtitle')} value={notificationsEnabled} onChange={setNotificationsEnabled} />
                    <Separator />
                    <RowExpandable 
                        icon="volume-high-outline" 
                        title={t('sound')}
                        expanded={soundExpanded}
                        onToggle={() => setSoundExpanded(!soundExpanded)}
                    >
                        <RowSlider icon="volume-high-outline" title={t('volume')} value={volume} onChange={setVolume} />
                        <Separator />
                        <RowSlider icon="mic-outline" title={t('micVolume')} value={micVolume} onChange={setMicVolume} />
                    </RowExpandable>
                </View>

                {/* 개인정보 및 보안 카드 */}
                <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eee', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Ionicons name="shield-checkmark-outline" size={20} color="#25a244" />
                        <Text style={{ marginLeft: 8, fontWeight: '700', color: '#333' }}>{t('privacyAndSecurity')}</Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 }} />
                    <RowSwitch icon="eye-outline" title={t('profilePublic')} subtitle={t('profilePublicSubtitle')} value={profilePublic} onChange={setProfilePublic} />
                    <Separator />
                    <RowSwitch icon="location-outline" title={t('locationInfo')} subtitle={t('locationInfoSubtitle')} value={locationEnabled} onChange={setLocationEnabled} />
                    <Separator />
                    <RowButton icon="close-circle-outline" title={t('blockedList')} onPress={() => {}} />
                </View>

                {/* 앱 설정 카드 */}
                <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eee', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Ionicons name="phone-portrait-outline" size={20} color="#25a244" />
                        <Text style={{ marginLeft: 8, fontWeight: '700', color: '#333' }}>{t('appSettings')}</Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 }} />
                    <RowSwitch icon="moon-outline" title={t('darkMode')} subtitle={t('darkModeSubtitle')} value={darkModeEnabled} onChange={(v) => {
                        setDarkModeEnabled(v);
                        // notify theme change immediately
                        const bus = (global as any).__APP_EVENT_BUS__;
                        if (bus && Array.isArray(bus.listeners)) {
                            bus.listeners.forEach((l: any) => l({ type: 'theme_change', payload: v ? 'dark' : 'light' }));
                        }
                    }} />
                    <Separator />
                    <RowButton icon="globe-outline" title={`${t('language')} (${language === 'ko' ? t('languageKorean') : t('languageEnglish')})`} onPress={() => setShowLanguageModal(true)} />
                    <Separator />
                    <RowButton icon="color-palette-outline" title={`${t('chatBackground')} (${selectedBackground === 'default' ? t('chatBackgroundDefault') : selectedBackground})`} onPress={() => setShowBackgroundModal(true)} />
                </View>

                {/* 기타 카드 */}
                <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eee' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Ionicons name="ellipsis-horizontal-circle-outline" size={20} color="#25a244" />
                        <Text style={{ marginLeft: 8, fontWeight: '700', color: '#333' }}>{t('other')}</Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 }} />
                    <RowButton icon="trash-outline" title={t('clearCache')} onPress={async () => { await AsyncStorage.clear(); Alert.alert(t('confirm'), t('clearCacheComplete')); }} />
                    <Separator />
                    <RowButton icon="information-circle-outline" title={t('appInfo')} onPress={() => router.push('/about')} />
                    <Separator />
                    <Text style={{ textAlign: 'left', color: '#999', marginTop: 8 }}>{t('version')} 1.0.0</Text>
                </View>
            </ScrollView>

            {/* Language Selection Modal */}
            <Modal
                visible={showLanguageModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowLanguageModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
                        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 20 }}>{t('selectLanguage')}</Text>
                        <TouchableOpacity
                            style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                            onPress={() => { setLanguage('ko'); setShowLanguageModal(false); }}
                        >
                            <Text style={{ fontSize: 16 }}>{t('languageKorean')}</Text>
                            {language === 'ko' && <Ionicons name="checkmark" size={24} color="#25a244" />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                            onPress={() => { setLanguage('en'); setShowLanguageModal(false); }}
                        >
                            <Text style={{ fontSize: 16 }}>{t('languageEnglish')}</Text>
                            {language === 'en' && <Ionicons name="checkmark" size={24} color="#25a244" />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ marginTop: 20, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 10, alignItems: 'center' }}
                            onPress={() => setShowLanguageModal(false)}
                        >
                            <Text style={{ fontSize: 16, fontWeight: '600' }}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Background Selection Modal */}
            <Modal
                visible={showBackgroundModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowBackgroundModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
                        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 20 }}>{t('selectBackground')}</Text>
                        <TouchableOpacity
                            style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                            onPress={() => { setSelectedBackground('default'); setShowBackgroundModal(false); }}
                        >
                            <Text style={{ fontSize: 16 }}>{t('chatBackgroundDefault')}</Text>
                            {selectedBackground === 'default' && <Ionicons name="checkmark" size={24} color="#25a244" />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ marginTop: 20, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 10, alignItems: 'center' }}
                            onPress={() => setShowBackgroundModal(false)}
                        >
                            <Text style={{ fontSize: 16, fontWeight: '600' }}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function RowSwitch({ icon, title, subtitle, value, onChange }: { icon: any; title: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={icon} size={20} color="#333" />
                <View style={{ marginLeft: 10 }}>
                    <Text style={{ fontSize: 16, color: '#333' }}>{title}</Text>
                    {subtitle ? <Text style={{ marginTop: 2, fontSize: 12, color: '#777' }}>{subtitle}</Text> : null}
                </View>
            </View>
            <Switch value={value} onValueChange={onChange} />
        </View>
    );
}

function RowButton({ icon, title, onPress }: { icon: any; title: string; onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={icon} size={20} color="#333" />
                <Text style={{ marginLeft: 10, fontSize: 16, color: '#333' }}>{title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>
    );
}

function Separator() {
    return <View style={{ height: 1, backgroundColor: '#eee' }} />;
}

function RowSlider({ icon, title, value, onChange }: { icon: any; title: string; value: number; onChange: (v: number) => void }) {
    return (
        <View style={{ paddingTop: 8, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name={icon} size={20} color="#333" />
                <View style={{ marginLeft: 10, flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, color: '#333' }}>{title}</Text>
                    <Text style={{ fontSize: 14, color: '#777' }}>{value}%</Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 30 }}>
                <View style={{ flex: 1, height: 4, backgroundColor: '#eee', borderRadius: 2, marginRight: 10 }}>
                    <View style={{ width: `${value}%`, height: 4, backgroundColor: '#25a244', borderRadius: 2 }} />
                </View>
                <TouchableOpacity 
                    onPress={() => onChange(Math.max(0, value - 10))}
                    style={{ width: 30, height: 30, justifyContent: 'center', alignItems: 'center' }}
                >
                    <Ionicons name="remove-circle-outline" size={24} color="#25a244" />
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => onChange(Math.min(100, value + 10))}
                    style={{ width: 30, height: 30, justifyContent: 'center', alignItems: 'center', marginLeft: 5 }}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#25a244" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function RowExpandable({ icon, title, expanded, onToggle, children }: { icon: any; title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
        <View>
            <TouchableOpacity onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name={icon} size={20} color="#333" />
                    <Text style={{ marginLeft: 10, fontSize: 16, color: '#333' }}>{title}</Text>
                </View>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color="#999" />
            </TouchableOpacity>
            {expanded && (
                <View style={{ paddingLeft: 30 }}>
                    {children}
                </View>
            )}
        </View>
    );
}


