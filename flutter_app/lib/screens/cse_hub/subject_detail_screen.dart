import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/empty_state_widget.dart';

class SubjectDetailScreen extends StatefulWidget {
  final SubjectItem subject;

  const SubjectDetailScreen({Key? key, required this.subject})
      : super(key: key);

  @override
  State<SubjectDetailScreen> createState() => _SubjectDetailScreenState();
}

class _SubjectDetailScreenState extends State<SubjectDetailScreen> {
  List<SyllabusUnit> _units = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSyllabus();
  }

  Future<void> _loadSyllabus() async {
    final provider = Provider.of<AppProvider>(context, listen: false);
    final units = await provider.getSubjectSyllabus(widget.subject.id);
    if (mounted) {
      setState(() {
        _units = units;
        _isLoading = false;
      });
    }
  }

  Color _parseColor(String hex) {
    try {
      final buffer = StringBuffer();
      if (hex.length == 6 || hex.length == 7) buffer.write('ff');
      buffer.write(hex.replaceFirst('#', ''));
      return Color(int.parse(buffer.toString(), radix: 16));
    } catch (_) {
      return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final subjectColor = _parseColor(widget.subject.color);

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.subject.code} - ${widget.subject.name}'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Subject Hero Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : AppColors.lightCard,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: subjectColor.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              widget.subject.code,
                              style: TextStyle(
                                color: subjectColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '${widget.subject.credits} Credits • Sem ${widget.subject.semester}',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        widget.subject.name,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      if (widget.subject.instructor != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Faculty: ${widget.subject.instructor}',
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Syllabus Completion',
                            style: TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                          Text(
                            '${widget.subject.syllabusProgress}%',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: subjectColor,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      LinearProgressIndicator(
                        value: widget.subject.syllabusProgress / 100.0,
                        backgroundColor: isDark
                            ? AppColors.darkBorder
                            : const Color(0xFFE2E8F0),
                        valueColor: AlwaysStoppedAnimation<Color>(subjectColor),
                        minHeight: 8,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Syllabus Units Header
                const Text(
                  'Syllabus & Topic Tracker',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),

                if (_units.isEmpty) ...[
                  const EmptyStateWidget(
                    icon: Icons.menu_book,
                    title: 'No Syllabus Units Added',
                    description:
                        'Add units and topics to track your lecture progress and revisions.',
                  ),
                ] else ...[
                  ..._units.map((unit) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color:
                            isDark ? AppColors.darkCard : AppColors.lightCard,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark
                              ? AppColors.darkBorder
                              : AppColors.lightBorder,
                        ),
                      ),
                      child: Theme(
                        data: Theme.of(context)
                            .copyWith(dividerColor: Colors.transparent),
                        child: ExpansionTile(
                          initiallyExpanded: true,
                          title: Text(
                            'Unit ${unit.unitNumber}: ${unit.title}',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                          subtitle: Text(
                            '${unit.topics.where((t) => t.status == 'completed').length}/${unit.topics.length} topics mastered',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                          children: unit.topics.map((topic) {
                            final isDone = topic.status == 'completed';
                            final inProg = topic.status == 'in_progress';

                            return Container(
                              margin: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 4),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? AppColors.darkSurface
                                    : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Row(
                                children: [
                                  GestureDetector(
                                    onTap: () async {
                                      final newStatus = isDone
                                          ? 'not_started'
                                          : (inProg
                                              ? 'completed'
                                              : 'in_progress');
                                      final provider =
                                          Provider.of<AppProvider>(context,
                                              listen: false);
                                      await provider.updateTopicStatus(
                                          topic.id, newStatus);
                                      _loadSyllabus();
                                    },
                                    child: Icon(
                                      isDone
                                          ? Icons.check_circle
                                          : (inProg
                                              ? Icons.play_circle_outline
                                              : Icons.radio_button_unchecked),
                                      color: isDone
                                          ? AppColors.success
                                          : (inProg
                                              ? AppColors.warning
                                              : Colors.grey),
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          topic.title,
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            decoration: isDone
                                                ? TextDecoration.lineThrough
                                                : null,
                                          ),
                                        ),
                                        if (topic.notes.isNotEmpty) ...[
                                          const SizedBox(height: 2),
                                          Text(
                                            topic.notes,
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: isDark
                                                  ? AppColors.darkTextSecondary
                                                  : AppColors.lightTextSecondary,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  TextButton.icon(
                                    style: TextButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8),
                                      minimumSize: Size.zero,
                                      tapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                    ),
                                    onPressed: () async {
                                      final provider =
                                          Provider.of<AppProvider>(context,
                                              listen: false);
                                      await provider
                                          .incrementTopicRevision(topic.id);
                                      _loadSyllabus();
                                    },
                                    icon: const Icon(Icons.refresh, size: 14),
                                    label: Text(
                                      'Rev: ${topic.revisionCount}',
                                      style: const TextStyle(fontSize: 11),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    );
                  }),
                ],
              ],
            ),
    );
  }
}
