import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

export const Toast: React.FC = () => {
  const { theme } = useTheme();
  const { toast, hideToast } = useApp();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  if (!toast) return null;

  const getIconAndColor = () => {
    switch (toast.type) {
      case 'success':
        return { name: 'checkmark-circle' as const, color: theme.success };
      case 'warning':
        return { name: 'warning' as const, color: theme.warning };
      case 'danger':
        return { name: 'alert-circle' as const, color: theme.danger };
      case 'info':
      default:
        return { name: 'information-circle' as const, color: theme.info };
    }
  };

  const { name, color } = getIconAndColor();

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View
        style={[
          styles.toastCard,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: color,
            shadowColor: theme.cardShadow,
          },
        ]}
      >
        <Ionicons name={name} size={20} color={color} style={{ marginRight: 10 }} />
        <Text style={[styles.message, { color: theme.textPrimary }]} numberOfLines={2}>
          {toast.message}
        </Text>
        <TouchableOpacity onPress={hideToast} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: 55,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
