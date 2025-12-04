import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageModal from '@/components/ImageModal';
import { USER_ENDPOINTS, UPLOAD_ENDPOINTS, API_BASE_URL } from '@/constants/api';

// 한국 지역 목록
const REGIONS = [
    '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
    '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원도',
    '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
];

// 성별 옵션
const GENDERS = [
    { label: '남성', value: 'male' },
    { label: '여성', value: 'female' },
];

// 프로필 데이터 타입
interface UserProfile {
    userId: number;
    username: string;
    birthdate: string | null;
    location: string | null;
    gender: string | null;
    avatar: string | null;
    sajuKeywords: string[] | null;
}

export default function ProfileEditScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    
    // 편집 가능한 필드
    const [username, setUsername] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [location, setLocation] = useState('');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [showRegionPicker, setShowRegionPicker] = useState(false);
    
    // 프로필 사진
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // 생년월일로부터 나이 계산
    const calculateAge = (birthdate: string | null): string => {
        if (!birthdate) return '';
        const today = new Date();
        const birth = new Date(birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age.toString();
    };

    // 생년월일 형식 검증
    const validateBirthDate = (date: string): boolean => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return false;
        }
        const [year, month, day] = date.split('-').map(Number);
        const inputDate = new Date(year, month - 1, day);
        if (inputDate.getFullYear() !== year || 
            inputDate.getMonth() !== month - 1 || 
            inputDate.getDate() !== day) {
            return false;
        }
        return true;
    };

    // 현재 프로필 데이터 로드
    const loadProfile = async () => {
        try {
            setIsLoading(true);
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                Alert.alert('오류', '로그인이 필요합니다.');
                router.back();
                return;
            }

            const response = await fetch(USER_ENDPOINTS.getProfile, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('프로필 조회 실패');
            }

            const data = await response.json();
            if (data.resultType === 'SUCCESS' && data.success) {
                const user = data.success;
                setProfileData(user);
                
                // 편집 가능한 필드 초기화
                setUsername(user.username || '');
                setBirthDate(user.birthdate ? user.birthdate.split('T')[0] : '');
                setLocation(user.location || '');
                
                // 성별 변환 (백엔드: '남성'/'여성' → 프론트엔드: 'male'/'female')
                if (user.gender === '남성') {
                    setGender('male');
                } else if (user.gender === '여성') {
                    setGender('female');
                } else {
                    setGender('male'); // 기본값
                }
                
                // 프로필 사진
                if (user.avatar) {
                    // avatar가 상대 경로면 절대 경로로 변환
                    const avatarUrl = user.avatar.startsWith('http') 
                        ? user.avatar 
                        : `${API_BASE_URL.replace('/v1/api', '')}${user.avatar}`;
                    setImageUri(avatarUrl);
                }
            }
        } catch (error) {
            console.error('프로필 로드 오류:', error);
            Alert.alert('오류', '프로필 정보를 불러오는 중 문제가 발생했습니다.');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const requestMediaPermission = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
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
        if (!result.canceled && result.assets[0]?.uri) {
            // 선택한 이미지를 바로 표시
            setImageUri(result.assets[0].uri);
        }
    }, [requestMediaPermission]);

    // 이미지 업로드 함수
    const uploadImage = async (imageUri: string): Promise<string | null> => {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                Alert.alert('오류', '로그인이 필요합니다.');
                return null;
            }

            // FormData 생성
            const formData = new FormData();
            const filename = imageUri.split('/').pop() || 'image.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            
            formData.append('file', {
                uri: imageUri,
                name: filename,
                type: type,
            } as any);

            // 서버에 업로드
            const response = await fetch(UPLOAD_ENDPOINTS.image, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('이미지 업로드 실패');
            }

            const data = await response.json();
            // 백엔드에서 반환하는 url이 상대 경로이므로 절대 경로로 변환
            const imageUrl = data.url && data.url.startsWith('http') 
                ? data.url 
                : `${API_BASE_URL.replace('/v1/api', '')}${data.url}`;
            
            return imageUrl;
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            Alert.alert('오류', '이미지 업로드 중 문제가 발생했습니다.');
            return null;
        }
    };

    // 프로필 저장
    const save = async () => {
        // 유효성 검사
        if (!username.trim()) {
            Alert.alert('입력 오류', '닉네임을 입력해주세요.');
            return;
        }

        if (!birthDate.trim()) {
            Alert.alert('입력 오류', '생년월일을 입력해주세요.');
            return;
        }

        if (!validateBirthDate(birthDate)) {
            Alert.alert('입력 오류', '올바른 생년월일 형식(YYYY-MM-DD)으로 입력해주세요.');
            return;
        }

        if (!location.trim()) {
            Alert.alert('입력 오류', '지역을 선택해주세요.');
            return;
        }

        if (!gender) {
            Alert.alert('입력 오류', '성별을 선택해주세요.');
            return;
        }

        try {
            setIsSaving(true);
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) {
                Alert.alert('오류', '로그인이 필요합니다.');
                return;
            }

            // 이미지가 새로 선택되었고 로컬 URI인 경우 서버에 업로드
            let avatarUrl: string | null = null;
            if (imageUri) {
                // 로컬 URI인지 확인 (file:// 또는 content://로 시작)
                if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
                    setIsUploadingImage(true);
                    avatarUrl = await uploadImage(imageUri);
                    setIsUploadingImage(false);
                    if (!avatarUrl) {
                        Alert.alert('오류', '이미지 업로드에 실패했습니다.');
                        return;
                    }
                } else {
                    // 이미 서버 URL인 경우 그대로 사용
                    avatarUrl = imageUri;
                }
            }

            // 성별 변환 (프론트엔드: 'male'/'female' → 백엔드: '남성'/'여성')
            const genderValue = gender === 'male' ? '남성' : '여성';

            const response = await fetch(USER_ENDPOINTS.updateProfile, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username.trim(),
                    birthdate: birthDate,
                    location: location,
                    gender: genderValue,
                    avatar: avatarUrl, // avatar 필드 추가
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error?.reason || '프로필 업데이트 실패';
                
                // 닉네임 중복 에러 처리
                if (errorMessage.includes('닉네임') || errorMessage.includes('사용 중')) {
                    Alert.alert('오류', '이미 사용 중인 닉네임입니다.');
                } else {
                    Alert.alert('오류', errorMessage);
                }
                return;
            }

            const data = await response.json();
            if (data.resultType === 'SUCCESS') {
                Alert.alert('성공', '프로필이 저장되었습니다.', [
                    { text: '확인', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('오류', '프로필 저장 중 문제가 발생했습니다.');
            }
        } catch (error) {
            console.error('프로필 저장 오류:', error);
            Alert.alert('오류', '프로필 저장 중 문제가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={{ marginTop: 12, color: '#666' }}>프로필 정보를 불러오는 중...</Text>
            </SafeAreaView>
        );
    }

    if (!profileData) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#666' }}>프로필 정보를 불러올 수 없습니다.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, padding: 12, backgroundColor: '#4CAF50', borderRadius: 8 }}>
                    <Text style={{ color: '#fff' }}>돌아가기</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const age = calculateAge(birthDate);

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
                    <LabeledInput 
                        label="닉네임" 
                        value={username} 
                        onChangeText={setUsername} 
                        placeholder="닉네임을 입력하세요" 
                    />
                    <LabeledInput 
                        label="생년월일" 
                        value={birthDate} 
                        onChangeText={setBirthDate} 
                        placeholder="YYYY-MM-DD" 
                    />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <View style={{ marginBottom: 12 }}>
                                <Text style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>나이</Text>
                                <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, backgroundColor: '#f5f5f5' }}>
                                    <Text style={{ color: '#999' }}>{age || '자동 계산'}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ marginBottom: 12 }}>
                                <Text style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>지역</Text>
                                <TouchableOpacity
                                    onPress={() => setShowRegionPicker(!showRegionPicker)}
                                    style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12 }}
                                >
                                    <Text style={{ color: location ? '#333' : '#999' }}>
                                        {location || '지역 선택'}
                                    </Text>
                                </TouchableOpacity>
                                {showRegionPicker && (
                                    <View style={{ position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 10, maxHeight: 200, zIndex: 1000, elevation: 5 }}>
                                        <ScrollView>
                                            {REGIONS.map((region) => (
                                                <TouchableOpacity
                                                    key={region}
                                                    onPress={() => {
                                                        setLocation(region);
                                                        setShowRegionPicker(false);
                                                    }}
                                                    style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                                                >
                                                    <Text style={{ color: '#333' }}>{region}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                    
                    {/* 성별 선택 */}
                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>성별</Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {GENDERS.map((g) => (
                                <TouchableOpacity
                                    key={g.value}
                                    onPress={() => setGender(g.value)}
                                    style={{
                                        flex: 1,
                                        padding: 12,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderColor: gender === g.value ? '#4CAF50' : '#eee',
                                        backgroundColor: gender === g.value ? 'rgba(76,175,80,0.1)' : '#fff',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{
                                        color: gender === g.value ? '#4CAF50' : '#333',
                                        fontWeight: gender === g.value ? '600' : '400',
                                    }}>
                                        {g.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* 키워드 */}
                {profileData.sajuKeywords && profileData.sajuKeywords.length > 0 && (
                    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eee', marginBottom: 16 }}>
                        <Text style={{ fontWeight: '700', color: '#333', marginBottom: 6 }}>나의 사주 키워드</Text>
                        <Text style={{ color: '#777', fontSize: 12, marginBottom: 10 }}>사주를 기반으로 자동으로 설정된 키워드입니다</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {profileData.sajuKeywords.map((k, index) => (
                                <View key={index} style={{ backgroundColor: 'rgba(37,162,68,0.1)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 }}>
                                    <Text style={{ color: '#25a244', fontWeight: '600' }}>{k}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* 저장 */}
                <TouchableOpacity 
                    onPress={save} 
                    disabled={isSaving || isUploadingImage}
                    style={{ 
                        backgroundColor: (isSaving || isUploadingImage) ? '#ccc' : '#4CAF50', 
                        padding: 14, 
                        borderRadius: 12, 
                        alignItems: 'center',
                        opacity: (isSaving || isUploadingImage) ? 0.6 : 1,
                    }}
                >
                    {(isSaving || isUploadingImage) ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={{ color: '#fff', fontWeight: '700' }}>프로필 저장</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* 이미지 확대 모달 */}
            <ImageModal
                visible={showImageModal}
                onClose={() => setShowImageModal(false)}
                imageUri={imageUri}
                userName={username}
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
                keyboardType={keyboardType}
                multiline={multiline}
                style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, minHeight: multiline ? 90 : undefined }}
            />
        </View>
    );
}
