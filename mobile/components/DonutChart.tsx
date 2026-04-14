import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../contexts/SettingsContext';

interface DonutChartProps {
  data: { value: number; color: string; label: string }[];
  size?: number;
  strokeWidth?: number;
  title?: string;
  centerLabel?: string;
  centerValue?: string;
}

export default function DonutChart({
  data,
  size = 100,
  strokeWidth = 14,
  title,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const theme = useTheme();
  const c = theme.colors;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      )}
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={c.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Data segments */}
          {data.map((item, index) => {
            const percent = total > 0 ? item.value / total : 0;
            const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
            const rotation = accumulatedPercent * 360 - 90;
            accumulatedPercent += percent;

            return (
              <Circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                rotation={rotation}
                origin={`${center}, ${center}`}
                fill="none"
              />
            );
          })}
        </Svg>
        <View style={[styles.centerContent, { width: size, height: size }]}>
          {centerValue !== undefined && (
            <Text style={[styles.centerValue, { color: c.text, fontSize: 20 }]}>{centerValue}</Text>
          )}
          {centerLabel && (
            <Text style={[styles.centerLabel, { color: c.textMuted }]}>{centerLabel}</Text>
          )}
        </View>
      </View>
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendLabel, { color: c.textMuted }]}>{item.label}</Text>
            <Text style={[styles.legendValue, { color: c.text }]}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  chartContainer: {
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerValue: {
    fontWeight: '700',
  },
  centerLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  legend: {
    marginTop: 8,
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
  },
  legendValue: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
});
