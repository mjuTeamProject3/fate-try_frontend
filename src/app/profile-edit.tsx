import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ImageModal from '@/components/ImageModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_ENDPOINTS, API_BASE_URL } from '@/constants/api';

export default function ProfileEditScreen() {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [location, setLocation] = useState('');
    const [bio, setBio] = useState('');
    const keywords = ['친근함', '신뢰', '유머', '열정', '성실함', '긍정', '창의성', '도전'];
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 저장된 프로필 정보 불러오기
    useEffect(() => {
        const loadProfileData = async () => {
            try {
                const [nickname, birthDate, age, region, bio, profileImage] = await Promise.all([
                    AsyncStorage.getItem('userNickname'),
                    AsyncStorage.getItem('userBirthDate'),
                    AsyncStorage.getItem('userAge'),
                    AsyncStorage.getItem('userRegion'),
                    AsyncStorage.getItem('userBio'),
                    AsyncStorage.getItem('userProfileImage'),
                ]);

                if (nickname) setName(nickname);
                if (birthDate) setBirthDate(birthDate);
                if (age) setAge(age);
                if (region) setLocation(region);
                if (bio) setBio(bio);
                if (profileImage) setImageUri(profileImage);

                // 생년월일로부터 나이 계산 (나이가 없고 생년월일이 있으면)
                if (!age && birthDate) {
                    try {
                        const [year, month, day] = birthDate.split('-').map(Number);
                        const today = new Date();
                        const birth = new Date(year, month - 1, day);
                        const calculatedAge = today.getFullYear() - birth.getFullYear() - 
                                           (today.getMonth() < birth.getMonth() || 
                                            (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate()) ? 1 : 0);
                        setAge(calculatedAge.toString());
                        // 계산된 나이도 저장
                        await AsyncStorage.setItem('userAge', calculatedAge.toString());
                    } catch (error) {
                        console.error('나이 계산 오류:', error);
                    }
                }
            } catch (error) {
                console.error('프로필 데이터 로드 오류:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfileData();
    }, []);

    const requestMediaPermission = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            return false;
        }
        return true;
    }, []);

    const pickImage = useCallback(async () => {
        const granted = await requestMediaPermission();
        if (!granted) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
        });
        if (!result.canceled) {
            setImageUri(result.assets[0]?.uri ?? null);
        }
    }, [requestMediaPermission]);

    const [isSaving, setIsSaving] = useState(false);

    const save = async () => {
        try {
            setIsSaving(true);

            // 로컬 스토리지에 저장 (DB 연결 없이도 즉시 반영)
            await AsyncStorage.multiSet([
                ['userNickname', name],
                ['userBirthDate', birthDate],
                ['userAge', age],
                ['userRegion', location],
                ['userBio', bio],
            ]);

            // 프로필 사진 URI도 저장
            if (imageUri) {
                await AsyncStorage.setItem('userProfileImage', imageUri);
            }

            // 실제 로그인 상태인지 확인
            const loginStatus = await AsyncStorage.getItem('isLoggedIn');
            const accessToken = await AsyncStorage.getItem('accessToken');
            
            const isValidRealToken = accessToken !== null && 
                                   accessToken !== '' &&
                                   accessToken !== 'temp_token' && 
                                   !accessToken.startsWith('temp_login_token_') &&
                                   !accessToken.startsWith('dev_temp_token_') &&
                                   !accessToken.startsWith('temp_');

            // 실제 로그인 상태면 서버에도 저장 시도 (실패해도 로컬에는 저장됨)
            if (loginStatus === 'true' && isValidRealToken && accessToken) {
                try {
                    const response = await fetch(USER_ENDPOINTS.profile, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({
                            username: name,
                            birthdate: birthDate,
                            location: location,
                        }),
                    });

                    if (!response.ok) {
                        console.warn('서버 저장 실패, 로컬에만 저장됨');
                    }
                } catch (error) {
                    console.warn('서버 저장 오류, 로컬에만 저장됨:', error);
                }
            }

            // 저장 완료 후 홈 화면으로 이동
            console.log('✅ 프로필 저장 완료, 홈 화면으로 이동');
            router.replace('/(tabs)');
        } catch (error) {
            console.error('프로필 저장 오류:', error);
            Alert.alert('오류', '프로필 저장 중 문제가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>프로필 편집</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {/* 프로필 사진 */}
                <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eee', marginBottom: 16 }}>
                    <View style={{ alignItems: 'center' }}>
                        <TouchableOpacity 
                            onPress={() => setShowImageModal(true)}
                            style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: imageUri ? 'transparent' : '#4CAF50', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 4, borderColor: 'rgba(76,175,80,0.2)' }}
                        >
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={{ width: 96, height: 96 }} />
                            ) : (
                                <Ionicons name="person" size={44} color="#fff" />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={pickImage} style={{ marginTop: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
                            <Text style={{ color: '#333' }}>사진 변경</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 기본 정보 */}
                <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eee', marginBottom: 16 }}>
                    <Text style={{ fontWeight: '700', color: '#333', marginBottom: 10 }}>기본 정보</Text>
                    <LabeledInput label="닉네임" value={name} onChangeText={setName} placeholder="닉네임을 입력하세요" />
                    <LabeledInput label="생년월일" value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <LabeledInput label="나이" value={age} onChangeText={setAge} placeholder="나이" keyboardType="number-pad" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <LabeledInput label="지역" value={location} onChangeText={setLocation} placeholder="지역" />
                        </View>
                    </View>
                    <LabeledInput label="자기소개" value={bio} onChangeText={setBio} placeholder="자신을 소개해주세요" multiline />
                </View>

                {/* 키워드 */}
                <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eee', marginBottom: 16 }}>
                    <Text style={{ fontWeight: '700', color: '#333', marginBottom: 6 }}>나의 사주 키워드</Text>
                    <Text style={{ color: '#777', fontSize: 12, marginBottom: 10 }}>사주를 기반으로 자동으로 설정된 키워드입니다</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {keywords.map((k) => (
                            <View key={k} style={{ backgroundColor: 'rgba(37,162,68,0.1)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 }}>
                                <Text style={{ color: '#25a244', fontWeight: '600' }}>{k}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 저장 */}
                <TouchableOpacity 
                    onPress={save} 
                    disabled={isSaving}
                    style={{ 
                        backgroundColor: isSaving ? '#ccc' : '#4CAF50', 
                        padding: 14, 
                        borderRadius: 12, 
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 8
                    }}
                >
                    {isSaving && <ActivityIndicator size="small" color="#fff" />}
                    <Text style={{ color: '#fff', fontWeight: '700' }}>{isSaving ? '저장 중...' : '완료'}</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* 이미지 확대 모달 */}
            <ImageModal
                visible={showImageModal}
                onClose={() => setShowImageModal(false)}
                imageUri={imageUri}
                userName={name}
            />
        </SafeAreaView>
    );
}

function LabeledInput({ label, value, onChangeText, placeholder, keyboardType, multiline }: { label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; keyboardType?: any; multiline?: boolean }) {
    return (
        <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#999"
                keyboardType={keyboardType}
                multiline={multiline}
                style={{ 
                    borderWidth: 1, 
                    borderColor: '#eee', 
                    borderRadius: 10, 
                    padding: 12, 
                    minHeight: multiline ? 90 : undefined,
                    color: '#333',
                    fontSize: 16,
                    backgroundColor: '#fff'
                }}
            />
        </View>
    );
}


