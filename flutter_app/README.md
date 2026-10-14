# CSE Compass — Flutter Edition

A smart, reminder-driven academic planner designed specifically for a B.Tech Computer Science and Engineering student.

---

## 🌟 Features

- **Offline-First SQLite Architecture**: Powered by `sqflite`, storing all tasks, B.Tech subjects, syllabus units, topics, assessments, coding problems, projects, and study sessions locally on device.
- **Smart Reminders**: Powered by `flutter_local_notifications` and exact alarms (`SCHEDULE_EXACT_ALARM`, `POST_NOTIFICATIONS`).
- **Focus Now Recommendation Engine**: Multi-factor priority and urgency scoring that picks your Next Best Task.
- **Academic CSE Hub**:
  - **Subjects Manager**: Tracks CS201 (DSA), CS301 (OS), CS302 (DBMS), MA201 (Discrete Math), CS202 (Computer Networks).
  - **Syllabus Tracker**: Units, topics, master status, and revision count logging.
  - **Assessments & Exams**: Countdown timers for mid-sems, end-sems, and lab practicals.
  - **DSA Coding Tracker**: Log LeetCode, Codeforces, and HackerRank problems with difficulty badges and URLs.
  - **CSE Projects**: Milestones, tech stack tags, and repository links.
  - **Pomodoro Focus Timer**: 25m work / 5m break interval timer linked to academic subjects and saved to study logs.
- **Dual Themes**: Premium Dark Navy (Obsidian `#0B0F19`) and Clean Light Theme.
- **Data Backup & Restore**: Export full SQLite state to JSON and restore anytime.

---

## 🛠️ Project Structure

```
flutter_app/
├── lib/
│   ├── database/
│   │   └── database_helper.dart      # SQLite schema, migrations, CRUD & seed data
│   ├── models/
│   │   └── models.dart               # Complete typed data classes with JSON/Map serialization
│   ├── providers/
│   │   └── app_provider.dart         # Reactive state management via ChangeNotifier
│   ├── screens/
│   │   ├── cse_hub/
│   │   │   ├── assessments_screen.dart
│   │   │   ├── coding_tracker_screen.dart
│   │   │   ├── focus_timer_screen.dart
│   │   │   ├── projects_screen.dart
│   │   │   └── subject_detail_screen.dart
│   │   ├── analytics_screen.dart
│   │   ├── calendar_screen.dart
│   │   ├── cse_hub_screen.dart
│   │   ├── home_dashboard_screen.dart
│   │   ├── main_navigation_scaffold.dart
│   │   ├── reminders_screen.dart
│   │   ├── settings_screen.dart
│   │   ├── task_detail_screen.dart
│   │   ├── task_form_screen.dart
│   │   └── tasks_screen.dart
│   ├── services/
│   │   ├── notification_service.dart # Local scheduled alarms & notification channels
│   │   └── task_ranking_service.dart # Priority & deadline scoring algorithm
│   ├── theme/
│   │   └── app_theme.dart            # Dark Navy & Light styling tokens
│   ├── widgets/
│   │   ├── circular_progress_widget.dart
│   │   ├── empty_state_widget.dart
│   │   ├── focus_task_card.dart
│   │   └── task_card.dart
│   └── main.dart                     # App entry point
├── android/                          # Native Android wrapper & Manifest
└── pubspec.yaml                      # Dependencies
```

---

## 🚀 How to Run & Build

### Prerequisites
- **Flutter SDK**: 3.24.x or newer
- **Java JDK**: 17
- **Android SDK**: Platform 34 (Android 14)

### 1. Install Dependencies
```bash
cd flutter_app
flutter pub get
```

### 2. Run in Debug Mode on Connected Device / Emulator
```bash
flutter run
```

### 3. Build Direct Android Release APK
```bash
flutter build apk --release
```
The output APK will be generated at:
```
flutter_app/build/app/outputs/flutter-apk/app-release.apk
```

---

## ☁️ Automated Zero-Setup Cloud Build (GitHub Actions)

If Flutter or the Android SDK is not installed on your local computer:

1. Push this repository to GitHub.
2. Navigate to the **Actions** tab on your GitHub repository.
3. Select the **Build CSE Compass Flutter APK** workflow.
4. Click **Run workflow**.
5. Once complete (typically ~3 minutes), click on the workflow run to download the ready-to-install **`CSE-Compass-release-apk`** directly to your phone!
