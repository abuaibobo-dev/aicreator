import React, { useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, StatusBar, Text,
  TextInput, TouchableOpacity, View, Share, Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { T } from '../lib/theme';
import { optimizePrompt } from '../lib/deepseek';
import { buildImageUrl, IMAGE_PRESETS, IMAGE_STYLES } from '../lib/imagegen';

export default function ImageGenScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [loadingStep, setLoadingStep] = useState('');

  const generate = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setOptimizedPrompt('');
    setImageUri('');
    try {
      setLoadingStep('🧠 AI 优化提示词...');
      let prompt = input.trim();
      if (selectedStyle) prompt += `, ${selectedStyle} style`;
      const optimized = await optimizePrompt(prompt, 'image');
      setOptimizedPrompt(optimized);

      setLoadingStep('🎨 生成 4K 图片中...');
      const preset = IMAGE_PRESETS[selectedPreset];
      const url = buildImageUrl({
        prompt: optimized,
        width: preset.width,
        height: preset.height,
        enhance: true,
      });
      setImageUri(url);
    } catch (e: any) {
      Alert.alert('生成失败', e.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const saveImage = async () => {
    if (!imageUri) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('需要权限', '请在设置中允许访问相册'); return; }
      const fileUri = FileSystem.documentDirectory + `aicreator_${Date.now()}.jpg`;
      await FileSystem.downloadAsync(imageUri, fileUri);
      await MediaLibrary.saveToLibraryAsync(fileUri);
      Alert.alert('✅ 已保存', '图片已保存到相册');
    } catch (e: any) {
      Alert.alert('保存失败', e.message);
    }
  };

  const shareImage = async () => {
    if (!imageUri) return;
    try { await Share.share({ url: imageUri, message: optimizedPrompt }); } catch {}
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <View style={s.header}>
        <Text style={s.headerTitle}>AI 生图</Text>
        <Text style={s.headerSub}>DeepSeek 优化提示词 → Flux 4K 出图</Text>
      </View>

      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="描述你想要的画面..."
        placeholderTextColor={T.text3}
        multiline
        style={s.input}
      />

      <Text style={s.label}>画面风格</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.styleScroll}>
        {IMAGE_STYLES.map((style) => (
          <TouchableOpacity
            key={style}
            style={[s.styleChip, selectedStyle === style && s.styleChipActive]}
            onPress={() => setSelectedStyle(selectedStyle === style ? '' : style)}
          >
            <Text style={[s.styleText, selectedStyle === style && s.styleTextActive]}>{style}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.label}>输出分辨率</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.styleScroll}>
        {IMAGE_PRESETS.map((preset, i) => (
          <TouchableOpacity
            key={preset.label}
            style={[s.styleChip, selectedPreset === i && s.styleChipActive]}
            onPress={() => setSelectedPreset(i)}
          >
            <Text style={[s.styleText, selectedPreset === i && s.styleTextActive]}>{preset.label}</Text>
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
          <Text style={s.generateText}>✨ 生成图片</Text>
        )}
      </TouchableOpacity>

      {optimizedPrompt ? (
        <View style={s.promptBox}>
          <Text style={s.promptLabel}>AI 优化后的提示词：</Text>
          <Text style={s.promptText}>{optimizedPrompt}</Text>
        </View>
      ) : null}

      {imageUri ? (
        <View style={s.imageContainer}>
          <Image source={{ uri: imageUri }} style={s.image} resizeMode="contain" />
          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionBtn} onPress={saveImage}>
              <Text style={s.actionText}>💾 保存</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={shareImage}>
              <Text style={s.actionText}>📤 分享</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
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
  promptBox: { backgroundColor: T.surface, borderRadius: T.radius, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: T.border },
  promptLabel: { color: T.text2, fontSize: 12, marginBottom: 6 },
  promptText: { color: T.text, fontSize: 14, lineHeight: 20 },
  imageContainer: { alignItems: 'center' },
  image: { width: '100%', height: 400, borderRadius: T.radius, backgroundColor: T.surface },
  actionRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  actionBtn: { flex: 1, backgroundColor: T.surface2, borderRadius: T.radiusSm, paddingVertical: 12, alignItems: 'center' },
  actionText: { color: T.text, fontSize: 14, fontWeight: '600' },
};
