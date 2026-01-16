import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from './BottomNavigation';

interface BaseLayoutProps {
  children: React.ReactNode;
  onNavigate: (screen: string) => void;
}

export default function BaseLayout({ children, onNavigate }: BaseLayoutProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>

      <BottomNavigation onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
});
