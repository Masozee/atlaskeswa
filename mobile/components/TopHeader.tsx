import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Notification02Icon, MenuSquareIcon } from 'hugeicons-react-native';
import NetInfo from '@react-native-community/netinfo';
import { apiClient } from '../services/api';

interface User {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export default function TopHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(true);

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
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* Left: Avatar + Name + Role */}
        <View style={styles.leftSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
            <View style={[
              styles.statusDot,
              { backgroundColor: isOnline ? '#10b981' : '#ef4444' }
            ]} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{getFullName()}</Text>
            {user?.role && <Text style={styles.userRole}>{getRoleDisplay()}</Text>}
          </View>
        </View>

        {/* Right: Notification + Menu */}
        <View style={styles.rightSection}>
          <View style={styles.iconWrapper}>
            <TouchableOpacity style={styles.iconButton}>
              <Notification02Icon size={20} color="rgba(0, 0, 0, 0.7)" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={styles.iconWrapper}>
            <TouchableOpacity style={styles.iconButton}>
              <MenuSquareIcon size={20} color="rgba(0, 0, 0, 0.7)" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#f5f6f7',
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
    backgroundColor: '#07579e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#f5f6f7',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  userRole: {
    fontSize: 11,
    fontWeight: '400',
    color: '#6b7280',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrapper: {
    backgroundColor: '#ffffff',
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
