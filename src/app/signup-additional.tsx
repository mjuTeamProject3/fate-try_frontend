import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '@/styles/SignupAdditionalStyles';

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
    { label: '기타', value: 'other' }
];

export default function SignupAdditionalScreen() {
    const [nickname, setNickname] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [region, setRegion] = useState('');
    const [gender, setGender] = useState('');
    const [showRegionPicker, setShowRegionPicker] = useState(false);
    const [checkingNickname, setCheckingNickname] = useState(false);
    const [nicknameError, setNicknameError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 닉네임 중복 체크 (임시 - 실제로는 API 호출 필요)
    const checkNicknameAvailability = async (nicknameToCheck: string) => {
        if (!nicknameToCheck.trim()) {
            setNicknameError('');
            return false;
        }

        if (nicknameToCheck.length < 2) {
            setNicknameError('닉네임은 2자 이상이어야 합니다.');
            return false;
        }

        if (nicknameToCheck.length > 20) {
            setNicknameError('닉네임은 20자 이하여야 합니다.');
            return false;
        }

        setCheckingNickname(true);
        setNicknameError('');

        // 임시: AsyncStorage에 저장된 닉네임 목록 확인 (실제로는 API 호출)
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // API 호출 시뮬레이션
            
            const existingNicknames = await AsyncStorage.getItem('registeredNicknames');
            const nicknames = existingNicknames ? JSON.parse(existingNicknames) : [];
            
            if (nicknames.includes(nicknameToCheck)) {
                setNicknameError('이미 사용 중인 닉네임입니다.');
                setCheckingNickname(false);
                return false;
            }

            setNicknameError('');
            setCheckingNickname(false);
            return true;
        } catch (error) {
            console.error('닉네임 체크 오류:', error);
            setNicknameError('닉네임 확인 중 오류가 발생했습니다.');
            setCheckingNickname(false);
            return false;
        }
    };

    // 생년월일 유효성 검사
    const validateBirthDate = (date: string) => {
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

        const today = new Date();
        const age = today.getFullYear() - year - (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day) ? 1 : 0);
        
        if (age < 14 || age > 100) {
            return false;
        }

        return true;
    };

    // 폼 제출
    const handleSubmit = async () => {
        // 유효성 검사
        if (!nickname.trim()) {
            Alert.alert('입력 오류', '닉네임을 입력해주세요.');
            return;
        }

        if (!birthDate.trim()) {
            Alert.alert('입력 오류', '생년월일을 입력해주세요.');
            return;
        }

        if (!validateBirthDate(birthDate)) {
            Alert.alert('입력 오류', '올바른 생년월일을 입력해주세요. (YYYY-MM-DD 형식, 만 14세 이상)');
            return;
        }

        if (!region) {
            Alert.alert('입력 오류', '지역을 선택해주세요.');
            return;
        }

        if (!gender) {
            Alert.alert('입력 오류', '성별을 선택해주세요.');
            return;
        }

        // 닉네임 중복 최종 체크
        const isNicknameAvailable = await checkNicknameAvailability(nickname);
        if (!isNicknameAvailable) {
            return;
        }

        setIsSubmitting(true);

        try {
            // 생년월일로부터 나이 계산
            let calculatedAge = '';
            if (birthDate) {
                try {
                    const [year, month, day] = birthDate.split('-').map(Number);
                    const today = new Date();
                    const birth = new Date(year, month - 1, day);
                    const age = today.getFullYear() - birth.getFullYear() - 
                               (today.getMonth() < birth.getMonth() || 
                                (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate()) ? 1 : 0);
                    calculatedAge = age.toString();
                } catch (error) {
                    console.error('나이 계산 오류:', error);
                }
            }

            // 먼저 로컬 스토리지에 저장 (DB 연결 없이도 즉시 반영)
            await AsyncStorage.multiSet([
                ['userNickname', nickname],
                ['userBirthDate', birthDate],
                ['userAge', calculatedAge],
                ['userRegion', region],
                ['userGender', gender],
            ]);
            
            // 회원가입 완료 플래그 저장 (홈 화면에서 체크 건너뛰기)
            await AsyncStorage.setItem('hasCheckedSignup', 'true');
            
            console.log('✅ 로컬 저장 완료');

            // Access Token 확인 (실제 로그인 상태인지)
            const accessToken = await AsyncStorage.getItem('accessToken');
            const loginStatus = await AsyncStorage.getItem('isLoggedIn');
            
            const isValidRealToken = accessToken !== null && 
                                   accessToken !== '' &&
                                   accessToken !== 'temp_token' && 
                                   !accessToken.startsWith('temp_login_token_') &&
                                   !accessToken.startsWith('dev_temp_token_') &&
                                   !accessToken.startsWith('temp_');

            // 실제 로그인 상태면 서버에도 저장 시도 (실패해도 로컬에는 저장됨)
            if (loginStatus === 'true' && isValidRealToken && accessToken) {
                try {
                    const { USER_ENDPOINTS } = await import('@/constants/api');
                    const response = await fetch(USER_ENDPOINTS.profile, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({
                            username: nickname,
                            birthdate: birthDate,
                            location: region,
                            gender: gender === 'male' ? '남성' : gender === 'female' ? '여성' : '기타',
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log('✅ 서버 저장 성공:', data);
                    } else {
                        console.warn('⚠️ 서버 저장 실패, 로컬에만 저장됨');
                    }
                } catch (error) {
                    console.warn('⚠️ 서버 저장 오류, 로컬에만 저장됨:', error);
                }
            } else {
                console.log('ℹ️ 개발자 진입 모드, 로컬에만 저장됨');
            }

            // 저장 완료 후 홈 화면으로 이동
            console.log('✅ 정보 저장 완료, 홈 화면으로 이동');
            router.replace('/(tabs)');
        } catch (error) {
            console.error('회원가입 정보 저장 오류:', error);
            Alert.alert('오류', '정보 저장 중 문제가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 뒤로가기 핸들러
    const handleBack = async () => {
        try {
            console.log('뒤로가기 버튼 클릭, 로그인 화면으로 이동');
            // 모든 로그인 관련 데이터 초기화
            await AsyncStorage.multiRemove([
                'accessToken',
                'refreshToken',
                'loginProvider',
                'isLoggedIn',
                'hasCheckedSignup',
                'tempSkipSignup',
            ]);
            router.replace('/login');
        } catch (error) {
            console.error('뒤로가기 오류:', error);
            router.replace('/login');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 헤더에 뒤로가기 버튼 추가 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' }}>
                <TouchableOpacity 
                    onPress={handleBack}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ paddingRight: 12, paddingVertical: 4, paddingLeft: 4 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>추가 정보 입력</Text>
                    <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>서비스를 이용하기 위해 추가 정보가 필요합니다</Text>
                </View>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 닉네임 입력 */}
                <View style={styles.section}>
                    <Text style={styles.label}>
                        닉네임 <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[styles.input, nicknameError ? styles.inputError : null]}
                            value={nickname}
                            onChangeText={(text) => {
                                setNickname(text);
                                setNicknameError('');
                            }}
                            placeholder="닉네임을 입력하세요 (2-20자)"
                            placeholderTextColor="#999"
                            maxLength={20}
                            onBlur={() => {
                                if (nickname.trim()) {
                                    checkNicknameAvailability(nickname);
                                }
                            }}
                        />
                        {checkingNickname && (
                            <ActivityIndicator size="small" color="#4CAF50" style={styles.checkingIndicator} />
                        )}
                        {nicknameError ? (
                            <Text style={styles.errorText}>{nicknameError}</Text>
                        ) : nickname && !checkingNickname ? (
                            <Text style={styles.successText}>사용 가능한 닉네임입니다</Text>
                        ) : null}
                    </View>
                </View>

                {/* 생년월일 입력 */}
                <View style={styles.section}>
                    <Text style={styles.label}>
                        생년월일 <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={birthDate}
                        onChangeText={(text) => {
                            // YYYY-MM-DD 형식으로 자동 포맷팅
                            let formatted = text.replace(/[^\d]/g, '');
                            if (formatted.length >= 5) {
                                formatted = formatted.slice(0, 4) + '-' + formatted.slice(4);
                            }
                            if (formatted.length >= 8) {
                                formatted = formatted.slice(0, 7) + '-' + formatted.slice(7, 9);
                            }
                            setBirthDate(formatted);
                        }}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        maxLength={10}
                    />
                    <Text style={styles.hintText}>만 14세 이상만 가입 가능합니다</Text>
                </View>

                {/* 지역 선택 */}
                <View style={styles.section}>
                    <Text style={styles.label}>
                        지역 <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowRegionPicker(!showRegionPicker)}
                    >
                        <Text style={[styles.pickerButtonText, !region && styles.pickerButtonTextPlaceholder]}>
                            {region || '지역을 선택하세요'}
                        </Text>
                        <Ionicons 
                            name={showRegionPicker ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#666" 
                        />
                    </TouchableOpacity>
                    {showRegionPicker && (
                        <View style={styles.pickerOptions}>
                            <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                                {REGIONS.map((reg) => (
                                    <TouchableOpacity
                                        key={reg}
                                        style={[
                                            styles.pickerOption,
                                            region === reg && styles.pickerOptionSelected
                                        ]}
                                        onPress={() => {
                                            setRegion(reg);
                                            setShowRegionPicker(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.pickerOptionText,
                                            region === reg && styles.pickerOptionTextSelected
                                        ]}>
                                            {reg}
                                        </Text>
                                        {region === reg && (
                                            <Ionicons name="checkmark" size={20} color="#4CAF50" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* 성별 선택 */}
                <View style={styles.section}>
                    <Text style={styles.label}>
                        성별 <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.genderContainer}>
                        {GENDERS.map((g) => (
                            <TouchableOpacity
                                key={g.value}
                                style={[
                                    styles.genderButton,
                                    gender === g.value && styles.genderButtonSelected
                                ]}
                                onPress={() => setGender(g.value)}
                            >
                                <Text style={[
                                    styles.genderButtonText,
                                    gender === g.value && styles.genderButtonTextSelected
                                ]}>
                                    {g.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* 제출 버튼 */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>완료</Text>
                    )}
                </TouchableOpacity>
                
                {/* 개발용 임시 버튼 - 홈 화면으로 바로 이동 */}
                <TouchableOpacity
                    style={styles.tempSkipButton}
                    onPress={async () => {
                        try {
                            // 개발 중: 임시 스킵 플래그 설정 (홈 화면에서 체크 건너뛰기)
                            await AsyncStorage.setItem('tempSkipSignup', 'true');
                            await AsyncStorage.setItem('hasCheckedSignup', 'true');
                            console.log('✅ 개발용: 홈 화면으로 이동');
                            router.replace('/(tabs)');
                        } catch (error) {
                            console.error('홈 화면 이동 오류:', error);
                        }
                    }}
                >
                    <Text style={styles.tempSkipButtonText}>개발용: 홈 화면으로 이동</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

