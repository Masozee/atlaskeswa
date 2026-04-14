import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, useFontScale } from '../contexts/SettingsContext';
import LucideIcon from './LucideIcon';

type MenuItem = 'home' | 'survey' | 'settings' | 'profile';

interface BottomNavigationProps {
  onNavigate: (screen: string) => void;
}

export default function BottomNavigation({ onNavigate }: BottomNavigationProps) {
  const [activeTab, setActiveTab] = useState<MenuItem>('home');
  const theme = useTheme();
  const fs = useFontScale();
  const c = theme.colors;

  const handlePress = (item: MenuItem) => {
    setActiveTab(item);
    onNavigate(item);
  };

  const handleNewSurvey = () => {
    onNavigate('survey-form');
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: c.surface, borderTopColor: c.border }]}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.menuItem} onPress={() => handlePress('home')}>
          <LucideIcon
            name="home"
            size={22}
            color={activeTab === 'home' ? '#03979D' : c.iconDefault}
          />
          <Text
            style={[
              styles.menuLabel,
              { color: c.iconDefault },
              activeTab === 'home' && { color: '#03979D' },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => handlePress('survey')}>
          <LucideIcon
            name="clipboard-list"
            size={22}
            color={activeTab === 'survey' ? '#03979D' : c.iconDefault}
          />
          <Text
            style={[
              styles.menuLabel,
              { color: c.iconDefault },
              activeTab === 'survey' && { color: '#03979D' },
            ]}
          >
            Survey
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleNewSurvey}>
          <View style={[styles.addButton, { backgroundColor: '#03979D' }]}>
            <LucideIcon name="plus" size={22} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => handlePress('settings')}>
          <LucideIcon
            name="settings"
            size={22}
            color={activeTab === 'settings' ? '#03979D' : c.iconDefault}
          />
          <Text
            style={[
              styles.menuLabel,
              { color: c.iconDefault },
              activeTab === 'settings' && { color: '#03979D' },
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => handlePress('profile')}>
          <LucideIcon
            name="user"
            size={22}
            color={activeTab === 'profile' ? '#03979D' : c.iconDefault}
          />
          <Text
            style={[
              styles.menuLabel,
              { color: c.iconDefault },
              activeTab === 'profile' && { color: '#03979D' },
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
  },
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 2,
  },
  menuLabel: {
    fontSize: 10,
    fontWeight: '400',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
