import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'compass-outline' as const,
    title: 'Welcome to CSE Compass',
    subtitle: 'The intelligent, reminder-driven academic planner engineered exclusively for a B.Tech Computer Science student.',
    badge: 'ACADEMIC COMMAND CENTER',
  },
  {
    icon: 'notifications-outline' as const,
    title: 'Smart Reminders & Zero Procrastination',
    subtitle: 'Configure device alarms for assignments, labs, and revisions 5m, 15m, 1h before deadlines or customized intervals.',
    badge: 'NEVER MISS A DEADLINE',
  },
  {
    icon: 'school-outline' as const,
    title: 'CSE Curriculum & Syllabus Tracking',
    subtitle: 'Track units and topics across DSA, OS, DBMS, Computer Architecture, and Discrete Maths with revision counts.',
    badge: 'COURSEWORK MASTERY',
  },
  {
    icon: 'code-slash-outline' as const,
    title: 'DSA Practice & Pomodoro Focus',
    subtitle: 'Log LeetCode problem solutions, track topic coverage, and clock deep work with integrated study timers.',
    badge: 'PLACEMENT & INTERVIEW READY',
  },
];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const { updateSettings } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    updateSettings({ onboarding_completed: true });
    router.replace('/(tabs)');
  };

  const slide = SLIDES[currentIndex];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Skip Button */}
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <View style={styles.paginationDots}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === currentIndex ? theme.primary : theme.border,
                  width: idx === currentIndex ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Slide Content */}
      <View style={styles.slideContainer}>
        <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}18`, borderColor: theme.primary }]}>
          <Ionicons name={slide.icon} size={64} color={theme.primary} />
        </View>

        <View style={[styles.badgePill, { backgroundColor: `${theme.primary}20` }]}>
          <Text style={[styles.badgeText, { color: theme.primaryLight }]}>{slide.badge}</Text>
        </View>

        <Text style={[styles.slideTitle, { color: theme.textPrimary }]}>{slide.title}</Text>
        <Text style={[styles.slideSub, { color: theme.textSecondary }]}>{slide.subtitle}</Text>
      </View>

      {/* Bottom Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Launch CSE Compass' : 'Continue'}
          </Text>
          <Ionicons
            name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={18}
            color="#FFFFFF"
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  skipBtn: {
    padding: 6,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  slideSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
