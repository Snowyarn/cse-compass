import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 110,
  strokeWidth = 9,
  label = 'Today',
}) => {
  const { theme } = useTheme();
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer track ring */}
      <View
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: theme.borderSubtle,
          },
        ]}
      />
      {/* Active progress indicator ring overlay */}
      <View
        style={[
          styles.activeRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: clamped === 100 ? theme.success : theme.primary,
            borderTopColor: clamped > 0 ? (clamped === 100 ? theme.success : theme.primary) : 'transparent',
            borderRightColor: clamped >= 25 ? (clamped === 100 ? theme.success : theme.primary) : 'transparent',
            borderBottomColor: clamped >= 50 ? (clamped === 100 ? theme.success : theme.primary) : 'transparent',
            borderLeftColor: clamped >= 75 ? (clamped === 100 ? theme.success : theme.primary) : 'transparent',
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
      {/* Center content */}
      <View style={styles.centerTextContainer}>
        <Text style={[styles.percentageText, { color: theme.textPrimary }]}>
          {clamped}%
        </Text>
        <Text style={[styles.labelText, { color: theme.textSecondary }]}>
          {label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
  },
  activeRing: {
    position: 'absolute',
  },
  centerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
