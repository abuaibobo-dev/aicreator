import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { T } from '../lib/theme';
import { chatWithAI } from '../lib/deepseek';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatScreen() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: '你好！我是AI助手，可以聊天、回答问题、提供创意建议。' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      const reply = await chatWithAI(history);
      setMessages(prev => [...prev, { role: 'assistant', content: reply || '没有回复内容' }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `错误：${e.message}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <View style={s.header}>
        <Text style={s.headerTitle}>AI 聊天</Text>
      </View>
      <ScrollView ref={scrollRef} contentContainerStyle={s.messages} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {messages.map((msg, i) => (
          <View key={i} style={[s.bubble, msg.role === 'user' ? s.userBubble : s.aiBubble]}>
            <Text style={[s.bubbleText, msg.role === 'user' && s.userText]}>{msg.content}</Text>
          </View>
        ))}
        {loading && (
          <View style={[s.bubble, s.aiBubble]}>
            <ActivityIndicator color={T.text2} size="small" />
          </View>
        )}
      </ScrollView>
      <View style={s.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="输入消息..."
          placeholderTextColor={T.text3}
          multiline
          style={s.input}
        />
        <TouchableOpacity disabled={!input.trim() || loading} style={[s.sendBtn, (!input.trim() || loading) && s.sendDisabled]} onPress={() => send()}>
          <Text style={s.sendText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s: any = {
  container: { flex: 1, backgroundColor: T.bg },
  header: { paddingTop: 50, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: T.surface },
  headerTitle: { color: T.text, fontSize: 20, fontWeight: '700' },
  messages: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: '82%', padding: 14, borderRadius: T.radius, marginBottom: 8 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#2563EB' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: T.surface2 },
  bubbleText: { color: T.text, fontSize: 15, lineHeight: 22 },
  userText: { color: '#FFFFFF' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingBottom: 30, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border },
  input: { flex: 1, color: T.text, fontSize: 15, backgroundColor: T.surface2, borderRadius: T.radius, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, maxHeight: 100, marginRight: 8 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
};
