import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AppProvider } from '../context/AppContext';
import { Toast } from '../components/Toast';
import { initDatabase } from '../database/db';

function RootNavigation() {
  const { theme, isDark } = useTheme();

  useEffect(() => {
    // Check if app was opened via notification tap
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.taskId) {
        router.push(`/task/${data.taskId}`);
      }
    });

    // Handle notification tap while app is alive
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.taskId) {
        router.push(`/task/${data.taskId}`);
      } else if (data?.url) {
        router.push(data.url as any);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
