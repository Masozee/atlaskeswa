import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Home01Icon, FileEditIcon, Settings01Icon, UserIcon } from 'hugeicons-react-native';

type MenuItem = 'home' | 'survey' | 'settings' | 'profile';

interface BottomNavigationProps {
  onNavigate: (screen: string) => void;
}

export default function BottomNavigation({ onNavigate }: BottomNavigationProps) {
  const [activeTab, setActiveTab] = useState<MenuItem>('home');

  const menuItems = [
    { id: 'home' as MenuItem, icon: Home01Icon, label: 'Home' },
    { id: 'survey' as MenuItem, icon: FileEditIcon, label: 'Survey' },
    { id: 'settings' as MenuItem, icon: Settings01Icon, label: 'Settings' },
    { id: 'profile' as MenuItem, icon: UserIcon, label: 'Profile' },
  ];

  const handlePress = (item: MenuItem) => {
    setActiveTab(item);
    onNavigate(item);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isActive && styles.menuItemActive,
              ]}
              onPress={() => handlePress(item.id)}
            >
              <IconComponent
                size={24}
                color={isActive ? '#ffffff' : 'rgba(0, 0, 0, 0.7)'}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.menuLabel,
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
    backgroundColor: '#ffffff',
  },
  container: {
    height: 70,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 8,
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
    backgroundColor: '#07579e',
  },
  menuLabel: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.7)',
    marginTop: 4,
    fontWeight: '500',
  },
  menuLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
