import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/app_provider.dart';
import 'theme/app_theme.dart';
import 'screens/main_navigation_scaffold.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations & system UI overlay
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppProvider()..init()),
      ],
      child: const CseCompassApp(),
    ),
  );
}

class CseCompassApp extends StatelessWidget {
  const CseCompassApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        ThemeMode themeMode = ThemeMode.system;
        if (provider.settings.theme == 'dark') {
          themeMode = ThemeMode.dark;
        } else if (provider.settings.theme == 'light') {
          themeMode = ThemeMode.light;
        }

        return MaterialApp(
          title: 'CSE Compass',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: themeMode,
          home: const MainNavigationScaffold(),
        );
      },
    );
  }
}
