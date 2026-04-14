import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

interface MSIconProps {
  name: string;
  size?: number;
  color?: string;
  weight?: '100' | '200' | '300' | '400' | '500' | '600' | '700';
}

export default function MSIcon({ name, size = 24, color = '#000', weight = '400' }: MSIconProps) {
  return (
    <Text
      style={[
        styles.icon,
        {
          fontSize: size,
          color,
          fontFamily: `MaterialSymbolsRounded_${weight}Weight`,
        } as TextStyle,
      ]}
    >
      {name}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
});
