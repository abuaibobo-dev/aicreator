import React, { useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, StatusBar, Text,
  TextInput, TouchableOpacity, View, Alert,
} from 'react-native';
import { T } from '../lib/theme';
import { optimizePrompt } from '../lib/deepseek';
import { parseVideoFrames, VIDEO_STYLES, VIDEO_DURATIONS } from '../lib/videogen';

export default function VideoScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [frames, setFrames] = useState<{ prompt: string; url: string }[]>([]);
  const [loadingStep, setLoadingStep] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('电影级');
  const [selectedDuration, setSelectedDuration] = useState(1);

  const generate = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setFrames([]);
    try {
      setLoadingStep('🧠 AI 生成分镜脚本...');
      const result = await optimizePrompt(`${input}，风格：${selectedStyle}，时长：${VIDEO_DURATIONS[selectedDuration].label}`, 'video');
      const parsed = parseVideoFrames(result);
      
      if (!parsed.frames.length) {
        Alert.alert('分镜生成失败', 'AI 无法解析出有效分镜，请换个描述试试');
        return;
      }

      setLoadingStep(`🎨 生成 ${parsed.frames.length} 个关键帧...`);
      setFrames(parsed.frames);
    } catch (e: any) {
      Alert.alert('生成失败', e.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <View style={s.header}>
        <Text style={s.headerTitle}>AI 生视频</Text>
        <Text style={s.headerSub}>DeepSeek 分镜 → Flux 逐帧生成</Text>
      </View>

      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="描述你想生成的视频场景..."
        placeholderTextColor={T.text3}
        multiline
        style={s.input}
      />

      <Text style={s.label}>视频风格</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.styleScroll}>
        {VIDEO_STYLES.map((style) => (
          <TouchableOpacity
            key={style}
            style={[s.styleChip, selectedStyle === style && s.styleChipActive]}
            onPress={() => setSelectedStyle(style)}
          >
            <Text style={[s.styleText, selectedStyle === style && s.styleTextActive]}>{style}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.label}>视频时长</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.styleScroll}>
        {VIDEO_DURATIONS.map((d, i) => (
          <TouchableOpacity
            key={d.label}
            style={[s.styleChip, selectedDuration === i && s.styleChipActive]}
            onPress={() => setSelectedDuration(i)}
          >
            <Text style={[s.styleText, selectedDuration === i && s.styleTextActive]}>{d.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={[s.generateBtn, loading && s.generateBtnDisabled]} onPress={generate} disabled={loading}>
        {loading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator color={T.text} size="small" />
            <Text style={s.loadingText}>{loadingStep}</Text>
          </View>
        ) : (
          <Text style={s.generateText}>🎬 生成视频</Text>
        )}
      </TouchableOpacity>

      {frames.length > 0 && (
        <View>
          <Text style={s.label}>关键帧预览（{frames.length} 帧）</Text>
          {frames.map((frame, i) => (
            <View key={i} style={s.frameCard}>
              <Text style={s.frameLabel}>镜头 {i + 1}</Text>
              <Image source={{ uri: frame.url }} style={s.frameImage} resizeMode="cover" />
              <Text style={s.framePrompt} numberOfLines={2}>{frame.prompt}</Text>
            </View>
          ))}
          <View style={s.infoBox}>
            <Text style={s.infoText}>💡 提示：使用视频编辑工具（如 CapCut/剪映）将以上关键帧合成视频，添加过渡效果即可得到完整视频。</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s: any = {
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { paddingTop: 50, paddingBottom: 16 },
  headerTitle: { color: T.text, fontSize: 22, fontWeight: '700' },
  headerSub: { color: T.text2, fontSize: 13, marginTop: 4 },
  input: { color: T.text, fontSize: 15, backgroundColor: T.surface2, borderRadius: T.radius, padding: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  label: { color: T.text2, fontSize: 13, marginBottom: 8, marginTop: 8 },
  styleScroll: { marginBottom: 12 },
  styleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: T.surface2, marginRight: 8 },
  styleChipActive: { backgroundColor: '#FFF' },
  styleText: { color: T.text2, fontSize: 13 },
  styleTextActive: { color: '#000', fontWeight: '600' },
  generateBtn: { backgroundColor: '#2563EB', borderRadius: T.radius, paddingVertical: 16, alignItems: 'center', marginTop: 12, marginBottom: 16 },
  generateBtnDisabled: { opacity: 0.6 },
  generateText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  loadingText: { color: T.text, fontSize: 14, marginLeft: 8 },
  frameCard: { backgroundColor: T.surface, borderRadius: T.radius, padding: 12, marginBottom: 12 },
  frameLabel: { color: T.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  frameImage: { width: '100%', height: 200, borderRadius: T.radiusSm, backgroundColor: T.surface2 },
  framePrompt: { color: T.text2, fontSize: 12, marginTop: 8, lineHeight: 18 },
  infoBox: { backgroundColor: T.surface2, borderRadius: T.radiusSm, padding: 12, marginTop: 8 },
  infoText: { color: T.text2, fontSize: 12, lineHeight: 18 },
};
