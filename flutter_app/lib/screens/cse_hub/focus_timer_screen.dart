import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_theme.dart';

class FocusTimerScreen extends StatefulWidget {
  final String? initialSubjectId;
  final String? initialTaskId;

  const FocusTimerScreen({Key? key, this.initialSubjectId, this.initialTaskId})
      : super(key: key);

  @override
  State<FocusTimerScreen> createState() => _FocusTimerScreenState();
}

class _FocusTimerScreenState extends State<FocusTimerScreen> {
  Timer? _timer;
  int _totalSeconds = 25 * 60;
  int _remainingSeconds = 25 * 60;
  bool _isRunning = false;
  bool _isBreak = false;

  String? _selectedSubjectId;
  String? _selectedTaskId;
  final TextEditingController _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _selectedSubjectId = widget.initialSubjectId;
    _selectedTaskId = widget.initialTaskId;
  }

  @override
  void dispose() {
    _timer?.cancel();
    _notesController.dispose();
    super.dispose();
  }

  void _startTimer() {
    if (_isRunning) return;
    setState(() => _isRunning = true);

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() => _remainingSeconds--);
      } else {
        _timer?.cancel();
        setState(() => _isRunning = false);
        _handleSessionComplete();
      }
    });
  }

  void _pauseTimer() {
    _timer?.cancel();
    setState(() => _isRunning = false);
  }

  void _resetTimer() {
    _timer?.cancel();
    final provider = Provider.of<AppProvider>(context, listen: false);
    final workSecs = provider.settings.pomodoroWorkMins * 60;
    setState(() {
      _isRunning = false;
      _isBreak = false;
      _totalSeconds = workSecs;
      _remainingSeconds = workSecs;
    });
  }

  void _switchMode(bool isBreak) {
    _timer?.cancel();
    final provider = Provider.of<AppProvider>(context, listen: false);
    final targetSecs = isBreak
        ? provider.settings.pomodoroBreakMins * 60
        : provider.settings.pomodoroWorkMins * 60;

    setState(() {
      _isRunning = false;
      _isBreak = isBreak;
      _totalSeconds = targetSecs;
      _remainingSeconds = targetSecs;
    });
  }

  Future<void> _handleSessionComplete() async {
    final provider = Provider.of<AppProvider>(context, listen: false);

    if (!_isBreak) {
      // Record completed study session
      final session = StudySessionItem(
        id: 'sess_${DateTime.now().millisecondsSinceEpoch}',
        subjectId: _selectedSubjectId,
        taskId: _selectedTaskId,
        startTime: DateFormat('yyyy-MM-dd HH:mm:ss').format(DateTime.now()),
        durationMinutes: _totalSeconds ~/ 60,
        notes: _notesController.text.trim().isNotEmpty
            ? _notesController.text.trim()
            : 'Deep study block',
        sessionType: 'pomodoro',
      );

      await provider.recordStudySession(session);

      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('🎉 Focus Session Completed!'),
            content: Text(
                'Great job! You completed a ${_totalSeconds ~/ 60}-minute focus sprint. Take a 5-minute break now.'),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  _switchMode(true);
                },
                child: const Text('Start Break'),
              ),
            ],
          ),
        );
      }
    } else {
      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('☕ Break Finished!'),
            content: const Text('Ready to tackle your next academic sprint?'),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  _switchMode(false);
                },
                child: const Text('Start Focus Sprint'),
              ),
            ],
          ),
        );
      }
    }
  }

  String _formatTime(int seconds) {
    final mins = (seconds ~/ 60).toString().padLeft(2, '0');
    final secs = (seconds % 60).toString().padLeft(2, '0');
    return '$mins:$secs';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final progress = _totalSeconds > 0
        ? (_totalSeconds - _remainingSeconds) / _totalSeconds
        : 0.0;

    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        final subjects = provider.subjects;
        final tasks = provider.tasks.where((t) => !t.completed).toList();

        return Scaffold(
          appBar: AppBar(
            title: const Text('Pomodoro Focus Sprint'),
          ),
          body: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            children: [
              // Mode Toggle (Work vs Break)
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ChoiceChip(
                    label: const Text('Focus Sprint (25m)'),
                    selected: !_isBreak,
                    selectedColor: AppColors.primary,
                    onSelected: (val) {
                      if (val) _switchMode(false);
                    },
                  ),
                  const SizedBox(width: 12),
                  ChoiceChip(
                    label: const Text('Short Break (5m)'),
                    selected: _isBreak,
                    selectedColor: AppColors.success,
                    onSelected: (val) {
                      if (val) _switchMode(true);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Big Circular Timer Ring
              Center(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 240,
                      height: 240,
                      child: CircularProgressIndicator(
                        value: progress,
                        strokeWidth: 12,
                        backgroundColor: isDark
                            ? AppColors.darkBorder
                            : const Color(0xFFE2E8F0),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          _isBreak ? AppColors.success : AppColors.primary,
                        ),
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _formatTime(_remainingSeconds),
                          style: const TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _isBreak ? 'REST & RECHARGE' : 'DEEP WORK FOCUS',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                            color: _isBreak
                                ? AppColors.success
                                : AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),

              // Controls: Start, Pause, Reset
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  OutlinedButton.icon(
                    onPressed: _resetTimer,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Reset'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 14),
                    ),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton.icon(
                    onPressed: _isRunning ? _pauseTimer : _startTimer,
                    icon: Icon(_isRunning ? Icons.pause : Icons.play_arrow),
                    label: Text(_isRunning ? 'Pause' : 'Start Focus'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          _isBreak ? AppColors.success : AppColors.primary,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 28, vertical: 14),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 36),

              // Link to Subject & Task
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Link Session to Academic Goals',
                        style: TextStyle(
                            fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String?>(
                      value: _selectedSubjectId,
                      decoration: const InputDecoration(
                        labelText: 'Subject',
                        prefixIcon: Icon(Icons.school, size: 20),
                      ),
                      items: [
                        const DropdownMenuItem(
                            value: null, child: Text('No Subject')),
                        ...subjects.map(
                          (s) => DropdownMenuItem(
                            value: s.id,
                            child: Text('${s.code} - ${s.name}'),
                          ),
                        ),
                      ],
                      onChanged: (val) =>
                          setState(() => _selectedSubjectId = val),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String?>(
                      value: _selectedTaskId,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Associated Task',
                        prefixIcon: Icon(Icons.check_circle_outline, size: 20),
                      ),
                      items: [
                        const DropdownMenuItem(
                            value: null, child: Text('No Task')),
                        ...tasks.map(
                          (t) => DropdownMenuItem(
                            value: t.id,
                            child:
                                Text(t.title, overflow: TextOverflow.ellipsis),
                          ),
                        ),
                      ],
                      onChanged: (val) => setState(() => _selectedTaskId = val),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _notesController,
                      decoration: const InputDecoration(
                        labelText: 'Session Notes (Optional)',
                        hintText: 'e.g. Practiced binary search tree rotations',
                        prefixIcon: Icon(Icons.notes, size: 20),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }
}
