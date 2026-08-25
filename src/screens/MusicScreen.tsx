import React, { useState } from 'react';
import {
  ActivityIndicator, ScrollView, StatusBar, Text,
  TextInput, TouchableOpacity, View, Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { T } from '../lib/theme';
import { optimizePrompt } from '../lib/deepseek';
import { generateMusic, MUSIC_GENRES, MUSIC_MOODS } from '../lib/musicgen';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default function MusicScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMood, setSelectedMood] = useState('');

  const generate = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      setLoadingStep('🧠 AI 优化音乐提示词...');
      let prompt = input.trim();
      if (selectedGenre) prompt += `，风格：${selectedGenre}`;
      if (selectedMood) prompt += `，情绪：${selectedMood}`;
      const optimized = await optimizePrompt(prompt, 'music');

      let parsed: { prompt: string } = { prompt: optimized };
      try { parsed = JSON.parse(optimized); } catch {}

      setLoadingStep('🎵 生成音乐中...');
      const blob = await generateMusic({ prompt: parsed.prompt, duration: 150 });

      const arrayBuffer = await blob.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);
      const uri = FileSystem.documentDirectory + `aicreator_music_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      if (sound) await sound.unloadAsync();
      setSound(newSound);
      setPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setPlaying(false);
      });
      await newSound.playAsync();
    } catch (e: any) {
      Alert.alert('生成失败', e.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const togglePlay = async () => {
    if (!sound) return;
    if (playing) { await sound.pauseAsync(); setPlaying(false); }
    else { await sound.playAsync(); setPlaying(true); }
  };

  const stopSound = async () => {
    if (sound) { await sound.stopAsync(); await sound.unloadAsync(); setSound(null); setPlaying(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <View style={s.header}>
        <Text style={s.headerTitle}>AI 生音乐</Text>
        <Text style={s.headerSub}>DeepSeek 优化 → MusicGen 生成</Text>
      </View>

      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="描述你想要的音乐...（如：一首钢琴曲，星空下的独白）"
        placeholderTextColor={T.text3}
        multiline
        style={s.input}
      />

      <Text style={s.label}>音乐风格</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.styleScroll}>
        {MUSIC_GENRES.map((genre) => (
          <TouchableOpacity
            key={genre}
            style={[s.styleChip, selectedGenre === genre && s.styleChipActive]}
            onPress={() => setSelectedGenre(selectedGenre === genre ? '' : genre)}
          >
            <Text style={[s.styleText, selectedGenre === genre && s.styleTextActive]}>{genre}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.label}>情绪氛围</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.styleScroll}>
        {MUSIC_MOODS.map((mood) => (
          <TouchableOpacity
            key={mood}
            style={[s.styleChip, selectedMood === mood && s.styleChipActive]}
            onPress={() => setSelectedMood(selectedMood === mood ? '' : mood)}
          >
            <Text style={[s.styleText, selectedMood === mood && s.styleTextActive]}>{mood}</Text>
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
          <Text style={s.generateText}>🎵 生成音乐</Text>
        )}
      </TouchableOpacity>

      {sound && (
        <View style={s.playerBox}>
          <Text style={s.playerLabel}>🎵 正在播放</Text>
          <View style={s.playerRow}>
            <TouchableOpacity style={s.playerBtn} onPress={togglePlay}>
              <Text style={s.playerBtnText}>{playing ? '⏸ 暂停' : '▶️ 播放'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.playerBtn} onPress={stopSound}>
              <Text style={s.playerBtnText}>⏹ 停止</Text>
            </TouchableOpacity>
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
  playerBox: { backgroundColor: T.surface, borderRadius: T.radius, padding: 16, alignItems: 'center' },
  playerLabel: { color: T.text, fontSize: 14, marginBottom: 12 },
  playerRow: { flexDirection: 'row', gap: 12 },
  playerBtn: { backgroundColor: T.surface2, borderRadius: T.radiusSm, paddingHorizontal: 24, paddingVertical: 12 },
  playerBtnText: { color: T.text, fontSize: 14, fontWeight: '600' },
};
