import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StatusBar, Text,
  TextInput, TouchableOpacity, View, Alert,
} from 'react-native';
import { T } from '../lib/theme';
import { getSettings, saveSettings } from '../lib/deepseek';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com');
  const [model, setModel] = useState('deepseek-chat');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    getSettings().then(s => {
      setApiKey(s.apiKey);
      setBaseUrl(s.baseUrl);
      setModel(s.model);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveSettings({ apiKey: apiKey.trim(), baseUrl: baseUrl.trim(), model: model.trim() });
    setSaving(false);
    setNotice('✅ 已保存');
    setTimeout(() => setNotice(''), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setNotice('');
    try {
      await handleSave();
      const res = await fetch(`${baseUrl.trim()}/models`, {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      });
      if (res.ok) setNotice('✅ 连接正常');
      else {
        const data = await res.json().catch(() => null);
        setNotice(data?.error?.message || `❌ 测试失败（${res.status}）`);
      }
    } catch (e: any) {
      setNotice(`❌ ${e.message || '网络错误'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <View style={s.header}>
        <Text style={s.headerTitle}>设置</Text>
      </View>

      <Text style={s.label}>DeepSeek API Key</Text>
      <TextInput
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="sk-..."
        placeholderTextColor={T.text3}
        style={s.input}
        secureTextEntry
      />

      <Text style={s.label}>API Base URL</Text>
      <TextInput
        value={baseUrl}
        onChangeText={setBaseUrl}
        placeholder="https://api.deepseek.com"
        placeholderTextColor={T.text3}
        style={s.input}
      />

      <Text style={s.label}>模型</Text>
      <TextInput
        value={model}
        onChangeText={setModel}
        placeholder="deepseek-chat"
        placeholderTextColor={T.text3}
        style={s.input}
      />

      {notice ? <Text style={[s.notice, notice.includes('❌') ? s.noticeError : s.noticeSuccess]}>{notice}</Text> : null}

      <View style={s.btnRow}>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={s.saveBtnText}>{saving ? '保存中...' : '💾 保存'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.testBtn} onPress={handleTest} disabled={testing}>
          {testing ? <ActivityIndicator color={T.text} size="small" /> : <Text style={s.testBtnText}>🔗 测试连接</Text>}
        </TouchableOpacity>
      </View>

      <View style={s.infoBox}>
        <Text style={s.infoTitle}>ℹ️ 关于</Text>
        <Text style={s.infoText}>AI Creator v1.0.0{'\n'}DeepSeek + Pollinations.ai + MusicGen{'\n'}所有生成均由免费API驱动，无需额外付费。</Text>
      </View>
    </ScrollView>
  );
}

const s: any = {
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { paddingTop: 50, paddingBottom: 16 },
  headerTitle: { color: T.text, fontSize: 22, fontWeight: '700' },
  label: { color: T.text2, fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { color: T.text, fontSize: 15, backgroundColor: T.surface2, borderRadius: T.radiusSm, padding: 12, marginBottom: 4 },
  notice: { textAlign: 'center', marginTop: 12, fontSize: 14 },
  noticeSuccess: { color: T.success },
  noticeError: { color: T.danger },
  btnRow: { flexDirection: 'row', marginTop: 20, gap: 12 },
  saveBtn: { flex: 1, backgroundColor: '#FFF', borderRadius: T.radiusSm, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  testBtn: { flex: 1, backgroundColor: T.surface2, borderRadius: T.radiusSm, paddingVertical: 14, alignItems: 'center' },
  testBtnText: { color: T.text, fontSize: 15, fontWeight: '600' },
  infoBox: { backgroundColor: T.surface, borderRadius: T.radius, padding: 16, marginTop: 30 },
  infoTitle: { color: T.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  infoText: { color: T.text2, fontSize: 13, lineHeight: 20 },
};
