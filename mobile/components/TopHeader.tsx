import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { apiClient } from '../services/api';
import { useTheme, useFontScale } from '../contexts/SettingsContext';
import LucideIcon from './LucideIcon';

interface User {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export default function TopHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const theme = useTheme();
  const fs = useFontScale();
  const c = theme.colors;

  useEffect(() => {
    fetchUser();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await apiClient.get<User>('/accounts/users/me/');
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const getInitials = () => {
    if (!user) return '';
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  const getFullName = () => {
    if (!user) return 'Loading...';
    return `${user.first_name} ${user.last_name}`;
  };

  const getRoleDisplay = () => {
    if (!user || !user.role) return '';
    return user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: c.background }]}>
      <View style={styles.container}>
        {/* Left: Avatar + Name + Role */}
        <View style={styles.leftSection}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: c.avatarBg }]}>
              <Text style={[styles.avatarText, { fontSize: fs(16) }]}>{getInitials()}</Text>
            </View>
            <View style={[
              styles.statusDot,
              { backgroundColor: isOnline ? '#10b981' : '#ef4444', borderColor: c.statusDotBorder }
            ]} />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: c.text, fontSize: fs(14) }]}>{getFullName()}</Text>
            {user?.role && <Text style={[styles.userRole, { color: c.textMuted, fontSize: fs(11) }]}>{getRoleDisplay()}</Text>}
          </View>
        </View>

        {/* Right: Notification */}
        <View style={styles.rightSection}>
          <View style={[styles.iconWrapper, { backgroundColor: c.iconWrapper }]}>
            <TouchableOpacity style={styles.iconButton}>
              <LucideIcon name="bell" size={20} color={c.iconDefault} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    width: 42,
    height: 42,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  userName: {
    fontWeight: '600',
  },
  userRole: {
    fontWeight: '400',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrapper: {
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    padding: 0,
  },
});
