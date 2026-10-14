import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AppProvider } from '../context/AppContext';
import { Toast } from '../components/Toast';
import { initDatabase } from '../database/db';

function RootNavigation() {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: theme.background,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="task/create"
          options={{
            title: 'Create Task',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="task/[id]"
          options={{
            title: 'Task Details',
          }}
        />
        <Stack.Screen
          name="subject/[id]"
          options={{
            title: 'Subject Overview',
          }}
        />
        <Stack.Screen
          name="syllabus/index"
          options={{
            title: 'Syllabus Tracker',
          }}
        />
        <Stack.Screen
          name="assessments/index"
          options={{
            title: 'Assessments & Exams',
          }}
        />
        <Stack.Screen
          name="coding/index"
          options={{
            title: 'Coding Practice Tracker',
          }}
        />
        <Stack.Screen
          name="projects/index"
          options={{
            title: 'Project Tracker',
          }}
        />
        <Stack.Screen
          name="timer/index"
          options={{
            title: 'Study & Focus Timer',
          }}
        />
        <Stack.Screen
          name="reminders/index"
          options={{
            title: 'Upcoming Reminders',
          }}
        />
        <Stack.Screen
          name="analytics/index"
          options={{
            title: 'Academic Analytics',
          }}
        />
        <Stack.Screen
          name="data-management/index"
          options={{
            title: 'Data & Backup',
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
      <Toast />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    try {
      initDatabase();
    } catch (e) {
      console.error('Failed to init DB in root layout:', e);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <RootNavigation />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
