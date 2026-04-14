import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import {
  Home,
  ClipboardList,
  Settings,
  User,
  Bell,
  Pencil,
  Search,
  X,
  Plus,
  Clipboard,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowDown01,
  ArrowUp10,
  ScanSearch,
  Upload,
  ArrowUpFromLine,
  RefreshCcw,
} from 'lucide-react-native';
import { useTheme } from '../contexts/SettingsContext';

interface LucideIconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  home: Home,
  'clipboard-list': ClipboardList,
  settings: Settings,
  user: User,
  bell: Bell,
  pencil: Pencil,
  search: Search,
  x: X,
  plus: Plus,
  clipboard: Clipboard,
  'arrow-down-a-z': ArrowDownAZ,
  'arrow-up-a-z': ArrowUpAZ,
  'arrow-down-0-1': ArrowDown01,
  'arrow-up-1-0': ArrowUp10,
  'scan-search': ScanSearch,
  upload: Upload,
  'arrow-up-from-line': ArrowUpFromLine,
  'refresh-ccw': RefreshCcw,
};

export default function LucideIcon({
  name,
  size = 24,
  color,
  strokeWidth = 2.25,
  style,
}: LucideIconProps) {
  const theme = useTheme();
  const c = theme.colors;

  const iconColor = color || c.text;
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={iconColor}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
}
