import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.surface }]}>
      <View style={[styles.content, { backgroundColor: c.background }]}>
        {children}
      </View>
      <BottomNavigation onNavigate={onNavigate} />
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
