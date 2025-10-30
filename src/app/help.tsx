import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type Announcement = { title: string; content: string; date: string; isNew?: boolean };
type FAQ = { question: string; answer: string; category: string };

const announcements: Announcement[] = [
    { title: '새로운 기능 업데이트', content: '영상 채팅 기능이 추가되었습니다!', date: '2024.01.15', isNew: true },
    { title: '서버 점검 안내', content: '1월 20일 새벽 2시-4시 서버 점검이 예정되어 있습니다.', date: '2024.01.12' },
    { title: '이용약관 개정 안내', content: '개인정보처리방침이 개정되었습니다.', date: '2024.01.10' },
];

const faqs: FAQ[] = [
    { question: '랜덤 채팅은 어떻게 이용하나요?', answer: '하단의 채팅 버튼을 눌러 매칭을 시작하실 수 있습니다.', category: '사용법' },
    { question: '하트는 어떻게 얻을 수 있나요?', answer: '활발한 채팅 활동과 좋아요를 통해 하트를 얻을 수 있습니다.', category: '하트' },
    { question: '부적절한 사용자를 신고하려면?', answer: '채팅 중 신고 버튼을 통해 신고하실 수 있습니다.', category: '신고' },
    { question: '계정을 삭제하고 싶어요', answer: '설정 > 계정 관리에서 계정 삭제를 신청하실 수 있습니다.', category: '계정' },
];

export default function HelpScreen() {
    const openEmail = () => Linking.openURL('mailto:support@fatetry.com');
    const openPhone = () => Linking.openURL('tel:000-0000-0000');
    const openChat = () => router.push('/support-chat');

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>고객센터</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {/* 문의하기 */}
                <Card title="문의하기" icon="chatbubble-ellipses-outline">
                    <RowButton icon="mail-outline" title="이메일 문의" rightText="support@fatetry.com" onPress={openEmail} />
                    <Separator />
                    <RowButton icon="chatbubble-outline" title="채팅 상담" rightBadge="온라인" onPress={openChat} />
                    <Separator />
                    <RowButton icon="call-outline" title="전화 상담" rightText="평일 9-18시" onPress={openPhone} />
                </Card>

                {/* 공지사항 */}
                <Card title="공지사항" icon="warning-outline">
                    {announcements.map((a, idx) => (
                        <View key={idx} style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontWeight: '600', color: '#333' }}>{a.title}</Text>
                                    {a.isNew ? <Badge text="NEW" color="#E53935" /> : null}
                                </View>
                                <Text style={{ fontSize: 12, color: '#999' }}>{a.date}</Text>
                            </View>
                            <Text style={{ marginTop: 6, color: '#777', fontSize: 13 }}>{a.content}</Text>
                        </View>
                    ))}
                </Card>

                {/* 자주 묻는 질문 */}
                <Card title="자주 묻는 질문" icon="help-circle-outline">
                    {faqs.map((f, idx) => (
                        <View key={idx} style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontWeight: '600', color: '#333' }}>{f.question}</Text>
                                <OutlineBadge text={f.category} />
                            </View>
                            <Text style={{ marginTop: 6, color: '#777', fontSize: 13 }}>{f.answer}</Text>
                        </View>
                    ))}
                </Card>

                {/* 신고 및 차단 */}
                <Card title="신고 및 차단" icon="document-text-outline">
                    <RowButton icon="alert-circle-outline" title="사용자 신고하기" onPress={() => router.push('/report')} />
                    <Separator />
                    <RowButton icon="document-text-outline" title="내 신고 내역" onPress={() => router.push('/report-history')} />
                    <Separator />
                    <RowButton icon="close-circle-outline" title="차단 목록 관리" onPress={() => router.push('/blocked')} />
                </Card>

                {/* 약관 및 정책 */}
                <Card title="약관 및 정책" icon="reader-outline">
                    <RowGhost title="서비스 이용약관" />
                    <RowGhost title="개인정보처리방침" />
                    <RowGhost title="커뮤니티 가이드라인" />
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

function Card({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eee', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name={icon} size={20} color="#25a244" />
                <Text style={{ marginLeft: 8, fontWeight: '700', color: '#333' }}>{title}</Text>
            </View>
            {children}
        </View>
    );
}

function RowButton({ icon, title, onPress, rightText, rightBadge }: { icon?: any; title: string; onPress?: () => void; rightText?: string; rightBadge?: string }) {
    return (
        <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {icon ? <Ionicons name={icon} size={20} color="#333" /> : null}
                <Text style={{ marginLeft: icon ? 10 : 0, fontSize: 16, color: '#333' }}>{title}</Text>
            </View>
            {rightText ? <Text style={{ fontSize: 12, color: '#999' }}>{rightText}</Text> : null}
            {rightBadge ? <Badge text={rightBadge} /> : <Ionicons name="chevron-forward" size={18} color="#999" />}
        </TouchableOpacity>
    );
}

function RowGhost({ title }: { title: string }) {
    return (
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
            <Text style={{ fontSize: 14, color: '#555' }}>{title}</Text>
        </TouchableOpacity>
    );
}

function Separator() {
    return <View style={{ height: 1, backgroundColor: '#eee' }} />;
}

function Badge({ text, color = '#25a244' }: { text: string; color?: string }) {
    return (
        <View style={{ backgroundColor: color, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{text}</Text>
        </View>
    );
}

function OutlineBadge({ text }: { text: string }) {
    return (
        <View style={{ borderColor: '#ddd', borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ color: '#666', fontSize: 10 }}>{text}</Text>
        </View>
    );
}


