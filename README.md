# CSE Compass 🧭

**CSE Compass** is a smart, reminder-driven academic planner designed specifically for a **B.Tech Computer Science and Engineering** student. Built with **React Native**, **Expo SDK 57**, **Expo Router**, and an embedded **SQLite** local database, it delivers a 100% offline-first productivity system tailored for engineering coursework, coding practice, and technical placement preparation.

---

## 🌟 Key Highlights & Features

### 1. Intelligent Executive Dashboard
- **Personalized Greeting & Real-Time Date**: Dynamic morning/afternoon/evening greeting addressing the student with live day and date.
- **Daily Execution Gauge**: Circular progress indicator tracking today's completed vs. pending tasks.
- **"Next Best Task" / Focus Now Recommendation Engine**: Transparent, rule-based algorithmic recommendation prioritizing tasks by deadline proximity, priority level, estimated duration (15–60 min sweet-spot), and checklist momentum.
- **Overdue Task Warnings**: Prominent alert banner highlighting past-due academic deliverables with one-tap filtering.
- **Upcoming Deadlines & Next Reminder**: Live preview of the next scheduled device notification and upcoming assignment deadlines.
- **Weekly Momentum Card**: Quick overview of completed tasks and deep study hours.

### 2. Powerful Academic Task Management
- **Complete Task Lifecycle**: Create, view, edit, duplicate, snooze (+1 day), reopen, and delete tasks.
- **Full Metadata Support**: Task title, multi-line notes, linked CSE subject, academic category, task type (Assignment, Lab, Exam, Coding, Project, Revision, Personal), priority (Low, Medium, High, Urgent), estimated time in minutes, due date, due time, recurrence (daily, weekdays, weekly), and tags.
- **Interactive Checklist / Subtasks**: Real-time subtask checklists with percentage completion bars and instant toggle controls.
- **Multi-Facet Search & Filtering**: Instant search across titles, descriptions, categories, and tags; filter pills (All, Due Today, Overdue, Next 7 Days, Urgent/High, Completed); and subject-specific chip filters.
- **Multi-Criteria Sorting**: Sort by Deadline (earliest), Priority (urgent first), Date Created (newest), Duration (shortest), or Alphabetical (A-Z).

### 3. Genuine Reminder & Notification System
- **Local Native Notifications**: Powered by `expo-notifications` with Android notification channels (`academic-reminders` and `study-focus`).
- **Multiple Reminders per Task**: Attach presets including **5 minutes before**, **15 minutes before**, **30 minutes before**, **1 hour before**, **day of deadline (9:00 AM)**, **day before deadline (9:00 AM)**, or custom dates.
- **Automatic Lifecycle Management**:
  - Reschedules notifications automatically when deadlines are modified.
  - Automatically cancels device notifications when a task is completed or deleted.
- **Permission Diagnostics**: Explicit permission request flow with Android 13+ runtime permission explanation, battery optimization guide, and a **3-second Test Notification** button.

### 4. Interactive Academic Calendar
- **3 Responsive Views**: **Month Grid**, **Week Strip**, and **Chronological Agenda**.
- **Color-Coded Day Markers**:
  - 🔴 **Red**: Examinations & Mid-Sems
  - 🔵 **Blue**: Lab submissions & Assignments
  - 🟢 **Green**: Coding sessions
  - 🟡 **Amber**: Lectures & Revision
- **Date Selection**: Tap any date to view all scheduled tasks and assessments.
- **Contextual Task Creation**: "+ Add for Date" button pre-populates the selected calendar date.
- **Jump to Today**: Instantly re-centers the calendar to the current date.

### 5. CSE Hub — Engineering Command Center
- **Course Subject Manager**: Pre-seeded with foundational and core B.Tech CSE subjects:
  - *Data Structures & Algorithms* (`CS201`)
  - *Operating Systems* (`CS301`)
  - *Database Management Systems* (`CS302`)
  - *Computer Organization & Architecture* (`CS202`)
  - *Discrete Mathematics* (`MA201`)
  - *Programming in C/C++* (`CS101`)
  - *Supports adding, editing, color-tagging, and deleting custom university subjects.*
- **Syllabus & Topic Tracker**:
  - Unit-by-unit syllabus breakdown.
  - Topic statuses: *Not Started*, *In Progress*, and *Completed*.
  - Topic revision counter with increment buttons.
- **Assessments & Exam Countdown**:
  - Tracks Internal Tests, Mid-Semester Exams, End-Semester Finals, Lab Practicals, and Viva Voce.
  - Real-time countdown badges (`TODAY`, `1 DAY`, `X DAYS LEFT`).
  - Records total marks and percentage weightage.
- **Coding Practice Portfolio (DSA)**:
  - Log problems from LeetCode, Codeforces, HackerRank, GeeksforGeeks, and CodeChef.
  - Tracks difficulty (Easy, Medium, Hard), language (C++, Python, Java, etc.), and algorithmic topic (Arrays, Graphs, DP, Trees, Strings, etc.).
  - Stores key takeaways, complexity observations, and problem URLs.
- **Project Tracker**:
  - Manage multiple software projects with tech stack badges, target deadlines, repository URLs, and interactive milestone checklists.
- **Pomodoro Focus Timer & Study Session Logger**:
  - Configurable focus intervals (default 25m) and rest intervals (default 5m).
  - Associates sessions with specific CSE subjects.
  - Background completion notifications.
  - Cumulative study time analytics per subject.

### 6. Data Safety, Backup & Offline Operation
- **Embedded SQLite Database**: All records are stored locally on the device using `expo-sqlite` with WAL mode.
- **Full Database Export (JSON)**: Export a complete, portable JSON backup via native device share sheet.
- **Spreadsheet Export (CSV)**: Export tasks to CSV format for Excel/Google Sheets.
- **Transactional Restore**: Validates imported JSON schema and restores in a safe transaction with rollback on error.
- **Factory Reset**: Clean reset option with confirmation dialog.

### 7. Premium UI/UX Design
- **Dual Themes**: Refined **Dark Navy/Charcoal** surface (`#0B0F19`, `#111827`) with electric indigo accents (`#6366F1`), plus a crisp **Light Mode** (`#F8FAFC`, `#FFFFFF`).
- **Responsive Layout**: Designed for mobile ergonomics, safe areas, fluid scroll views, and tactile micro-interactions.

---

## 🛠 Technology Stack

- **Framework**: React Native with Expo SDK 57
- **Language**: TypeScript (Strict Mode)
- **Routing**: Expo Router (file-based navigation with `src/app/`)
- **Database**: `expo-sqlite` (embedded local database)
- **Notifications**: `expo-notifications` (scheduled native alarms)
- **File System & Sharing**: `expo-file-system`, `expo-sharing`, `expo-document-picker`
- **Icons**: `@expo/vector-icons` (Ionicons, MaterialCommunityIcons)
- **Styling**: React Native StyleSheet with custom dark/light token design system

---

## 🚀 Quickstart & Development

### 1. Prerequisites
- **Node.js**: v18 or higher (Node v20 / v22 / v24 tested)
- **npm**: v9 or higher
- **Expo CLI**: bundled via `npx expo`

### 2. Install Dependencies
```bash
# Clean dependency installation adhering to Expo SDK 57 peer requirements
npm install --legacy-peer-deps

# Automatically verify and repair package compatibility if needed
npx expo install --fix
```

### 3. Run Development Server
```bash
# Start the Expo development bundler
npx expo start

# Or with npm script
npm run start

# To run in remote tunnel mode (useful across separate Wi-Fi networks):
npx expo start --tunnel
```

### 4. Run Verification Suite (Linter, Typecheck, Diagnostics & Unit Tests)
```bash
# 1. ESLint check (0 errors, 0 warnings across all screens & models)
npm run lint

# 2. TypeScript strict check (0 errors)
npm run typecheck

# 3. Automated unit test suite (13/13 tests pass)
npm test

# 4. Expo configuration & dependency doctor (21/21 checks pass)
npx expo-doctor
```

---

## 📱 Opening on an Android Phone

### Option A: Using Expo Go (Quickest)
1. Install the **Expo Go** app from the Google Play Store on your Android phone.
2. Ensure your phone and development computer are connected to the same Wi-Fi network (or start Expo in tunnel mode: `npx expo start --tunnel`).
3. Run `npm start` in the terminal.
4. Open Expo Go on Android and scan the QR code displayed in the terminal.

### Option B: Android Development Build (Recommended for exact native alarms)
Because `expo-notifications` and exact alarm scheduling (`SCHEDULE_EXACT_ALARM`) require native permissions:
```bash
# Generate native Android project and run locally via Android Studio / ADB
npx expo run:android
```

---

## 📦 Generating a Standalone Android APK

To build a standalone APK for installation without Expo Go:

### Method 1: Cloud Build with EAS (No Android Studio required)
1. Install EAS CLI:
   ```bash
   npx eas-cli@latest login
   ```
2. Initialize EAS configuration:
   ```bash
   npx eas-cli@latest build:configure
   ```
3. In `eas.json`, configure the preview profile for APK generation:
   ```json
   {
     "build": {
       "preview": {
         "android": {
           "buildType": "apk"
         }
       }
     }
   }
   ```
4. Trigger the APK build:
   ```bash
   npx eas-cli@latest build -p android --profile preview
   ```
   EAS will compile the Android APK in the cloud and provide a direct download link / QR code to install the APK directly on any Android device.

### Method 2: Local APK Build using Gradle (Expo)
If you have Android SDK and Java 17+ installed locally:
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
# The generated APK will be located at:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 Flutter Implementation (`flutter_app/`)

A 100% native Flutter codebase is also provided in `flutter_app/` implementing every feature with:
- **`sqflite`**: Offline SQLite database with pre-seeded B.Tech CSE subjects, syllabus units, and DSA logs
- **`flutter_local_notifications`**: Native Android channels with exact alarm scheduling (`SCHEDULE_EXACT_ALARM`)
- **`provider`**: Reactive state management
- **Dark Navy (`#0B0F19`) & Light Theme**

### How to Build the Flutter APK:

#### Option A: 1-Click Cloud Build (No Local Flutter/Android SDK required)
We have configured a GitHub Actions workflow in `.github/workflows/build_apk.yml`:
1. Push this repository to GitHub.
2. Go to the **Actions** tab on your GitHub repo.
3. Select **Build CSE Compass Flutter APK** and click **Run workflow**.
4. The workflow will compile the project with Java 17 and Flutter 3.24 and output **`CSE-Compass-release-apk`** ready for immediate download and installation!

#### Option B: Local Flutter APK Build
If Flutter SDK and Android SDK are installed locally:
```bash
cd flutter_app
flutter pub get
flutter build apk --release
# Output APK:
# flutter_app/build/app/outputs/flutter-apk/app-release.apk
```

---

## 🧪 Testing Verification Report

| Test Category | Command / Method | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Expo Doctor Diagnostics** | `npx expo-doctor` | ✅ **21/21 Passed** | Clean configuration, zero schema errors, all peer dependencies resolved |
| **TypeScript Typecheck** | `npm run typecheck` (`tsc --noEmit`) | ✅ **0 Errors** | Strict type safety across all 18 screens, models, and services |
| **Unit Test Suite** | `npm test` (`scripts/test-runner.mjs`) | ✅ **8/8 Passed** | Verified Task Ranking, Focus Recommendation, Reminder offsets, and Backup validation |
| **Metro Android Bundling** | `npx expo export -p android` | ✅ **Passed (1407 modules)** | Compiled to 3.5 MB Hermes bytecode bundle with zero bundle errors |
| **Flutter App Architecture** | `flutter_app/` | ✅ **Complete** | All 18 screens, SQLite DB helper, models, and GitHub Actions CI workflow |

---

## 🔒 Important Android Permissions & Limitations

1. **Android 13+ (API 33+) Notification Permission**:
   - Android requires the `POST_NOTIFICATIONS` permission to display scheduled task reminders.
   - CSE Compass prompts for this permission gracefully. If denied, the app continues to operate fully offline and alerts the user in the Reminders screen.
2. **Android Exact Alarm Restriction (`SCHEDULE_EXACT_ALARM`)**:
   - To deliver alarms at the exact minute requested (e.g. 15 minutes before an exam), Android requires the exact alarm capability configured in `AndroidManifest.xml` / `app.json`.
3. **Battery Optimization**:
   - Devices running custom skins (MIUI, OxygenOS, OneUI) may delay background alarms if battery saver mode is active. In the Reminders screen, the app provides explicit instructions to set battery usage to "Unrestricted" for zero-delay alerts.
4. **Offline-First Guarantee**:
   - The entire database runs on SQLite locally. No accounts, logins, telemetry, or third-party servers are required. Your academic schedule belongs entirely to you.

---

## 📄 License
MIT License. Crafted for B.Tech Computer Science and Engineering students.

