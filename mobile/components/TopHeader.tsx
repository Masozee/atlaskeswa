import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Notification02Icon, MenuSquareIcon, Search01Icon, FilterIcon } from 'hugeicons-react-native';
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUser();

    // Subscribe to network state changes
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
    // Capitalize first letter and lowercase the rest
    return user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      Alert.alert('Search', `Searching for: ${searchQuery}`);
      // TODO: Implement actual search functionality
    }
  };

  const handleFilter = () => {
    Alert.alert('Advanced Filter', 'Filter options will be implemented here');
    // TODO: Implement filter modal/screen
  };

  return (
    <View style={styles.wrapper}>
      {/* Top Row: Avatar + Name + Icons */}
      <View style={styles.container}>
        {/* Left: Avatar + Name + Role */}
        <View style={styles.leftSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
            {/* Online/Offline Indicator */}
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

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search01Icon size={20} color="rgba(0, 0, 0, 0.42)" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services, surveys, users..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={handleFilter}>
            <FilterIcon size={20} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>
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
    paddingBottom: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#07579e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'NotoSans_600SemiBold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'NotoSans_600SemiBold',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6b7280',
    fontFamily: 'NotoSans_400Regular',
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
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    padding: 0,
  },
  filterButton: {
    backgroundColor: '#07579e',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
