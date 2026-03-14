import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { database } from '../services/database';

export interface AppSettings {
  darkMode: boolean;
  largeText: boolean;
  ttsEnabled: boolean;
  ttsAutoPlay: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  isLoaded: boolean;
}

const defaultSettings: AppSettings = {
  darkMode: false,
  largeText: false,
  ttsEnabled: false,
  ttsAutoPlay: false,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSetting: () => {},
  isLoaded: false,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      await database.init();
      const [darkMode, largeText, ttsEnabled, ttsAutoPlay] = await Promise.all([
        database.getSetting('dark_mode'),
        database.getSetting('large_text'),
        database.getSetting('tts_enabled'),
        database.getSetting('tts_auto_play'),
      ]);
      setSettings({
        darkMode: darkMode === 'true',
        largeText: largeText === 'true',
        ttsEnabled: ttsEnabled === 'true',
        ttsAutoPlay: ttsAutoPlay === 'true',
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoaded(true);
    }
  };

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    const dbKeyMap: Record<keyof AppSettings, string> = {
      darkMode: 'dark_mode',
      largeText: 'large_text',
      ttsEnabled: 'tts_enabled',
      ttsAutoPlay: 'tts_auto_play',
    };
    const dbKey = dbKeyMap[key];
    database.saveSetting(dbKey, String(value)).catch((err) => {
      console.error('Failed to save setting:', err);
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

// Theme colors derived from settings
export function useTheme() {
  const { settings } = useSettings();
  const dark = settings.darkMode;

  return {
    dark,
    colors: {
      background: dark ? '#121212' : '#f5f6f7',
      surface: dark ? '#1e1e1e' : '#ffffff',
      card: dark ? '#2a2a2a' : '#ffffff',
      text: dark ? '#e0e0e0' : '#1a1a1a',
      textSecondary: dark ? '#a0a0a0' : '#374151',
      textMuted: dark ? '#707070' : '#6b7280',
      textPlaceholder: dark ? '#606060' : '#9ca3af',
      border: dark ? '#333333' : '#e5e7eb',
      primary: '#03979D',
      primaryButton: '#03979D',
      danger: '#dc2626',
      inputBg: dark ? '#2a2a2a' : '#ffffff',
      statusDotBorder: dark ? '#121212' : '#f5f6f7',
      iconDefault: dark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      iconWrapper: dark ? '#333333' : '#ffffff',
      avatarBg: '#03979D',
      heroBg: '#03979D',
    },
  };
}

// Font size scale based on largeText setting
export function useFontScale() {
  const { settings } = useSettings();
  const scale = settings.largeText ? 1.3 : 1;
  return (size: number) => Math.round(size * scale);
}
