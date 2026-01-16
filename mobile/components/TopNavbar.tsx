import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Menu01Icon } from 'hugeicons-react-native';

interface TopNavbarProps {
  onMenuPress: () => void;
}

export default function TopNavbar({ onMenuPress }: TopNavbarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
        <Menu01Icon size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuButton: {
    padding: 8,
  },
});
