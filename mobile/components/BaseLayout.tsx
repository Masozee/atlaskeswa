import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import BottomNavigation from './BottomNavigation';
import { useTheme } from '../contexts/SettingsContext';

interface BaseLayoutProps {
  children: React.ReactNode;
  onNavigate: (screen: string) => void;
}

export default function BaseLayout({ children, onNavigate }: BaseLayoutProps) {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.content, { backgroundColor: c.background }]}>
        {children}
      </View>
      <View style={{ paddingBottom: insets.bottom }}>
        <BottomNavigation onNavigate={onNavigate} />
      </View>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
