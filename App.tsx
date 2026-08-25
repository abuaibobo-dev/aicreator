import React, { useState } from 'react';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ChatScreen from './src/screens/ChatScreen';
import ImageGenScreen from './src/screens/ImageGenScreen';
import VideoScreen from './src/screens/VideoScreen';
import MusicScreen from './src/screens/MusicScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { T } from './src/lib/theme';

const TABS = [
  { key: 'chat', label: '聊天', icon: '💬' },
  { key: 'image', label: '生图', icon: '🎨' },
  { key: 'video', label: '视频', icon: '🎬' },
  { key: 'music', label: '音乐', icon: '🎵' },
  { key: 'settings', label: '设置', icon: '⚙️' },
];

const screens: Record<string, React.FC> = {
  chat: ChatScreen,
  image: ImageGenScreen,
  video: VideoScreen,
  music: MusicScreen,
  settings: SettingsScreen,
};

export default function App() {
  const [tab, setTab] = useState('chat');
  const Screen = screens[tab];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <View style={styles.screen}>
        <Screen />
      </View>
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
            <Text style={styles.tabIcon}>{t.icon}</Text>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  screen: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 11, color: T.text3, marginTop: 2 },
  tabLabelActive: { color: T.text, fontWeight: '600' },
});
