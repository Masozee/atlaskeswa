import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, useFontScale } from '../contexts/SettingsContext';

type MenuItem = 'home' | 'survey' | 'settings' | 'profile';

interface BottomNavigationProps {
  onNavigate: (screen: string) => void;
}

export default function BottomNavigation({ onNavigate }: BottomNavigationProps) {
  const [activeTab, setActiveTab] = useState<MenuItem>('home');
  const theme = useTheme();
  const fs = useFontScale();
  const c = theme.colors;

  const menuItems = [
    { id: 'home' as MenuItem, iconName: 'home' as const, label: 'Home' },
    { id: 'survey' as MenuItem, iconName: 'description' as const, label: 'Survey' },
    { id: 'settings' as MenuItem, iconName: 'settings' as const, label: 'Settings' },
    { id: 'profile' as MenuItem, iconName: 'person' as const, label: 'Profile' },
  ];

  const handlePress = (item: MenuItem) => {
    setActiveTab(item);
    onNavigate(item);
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: c.surface, borderTopColor: c.border }]}>
      <View style={[styles.container, { backgroundColor: c.surface }]}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isActive && styles.menuItemActive,
              ]}
              onPress={() => handlePress(item.id)}
            >
              <MaterialIcons
                name={item.iconName}
                size={24}
                color={isActive ? '#ffffff' : c.iconDefault}
              />
              <Text
                style={[
                  styles.menuLabel,
                  { color: c.iconDefault, fontSize: fs(10) },
                  isActive && styles.menuLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
  },
  container: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
    borderRadius: 12,
  },
  menuItemActive: {
    backgroundColor: '#03979D',
  },
  menuLabel: {
    marginTop: 4,
    fontWeight: '500',
  },
  menuLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
