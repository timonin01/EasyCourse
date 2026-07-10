import type { AuditBatchHint, CourseLessonContext } from './parseCourseAuditHints';
import { formatHintLocation } from './parseCourseAuditHints';

export type CourseAgentPendingRequest = {
  courseId: number;
  prompt: string;
  lessonId?: number;
  sectionTitle?: string;
  lessonTitle?: string;
  target: AuditBatchHint['target'];
};

export function buildAuditAgentHandoffPrompt(
  hint: AuditBatchHint,
  prompts: string[],
  lesson?: CourseLessonContext | null,
): string {
  const body = prompts.join('\n');

  if (hint.target === 'existing') {
    if (lesson) {
      return `Для урока «${lesson.title}» в модуле «${lesson.sectionTitle}»:\n${body}`;
    }
    const location = formatHintLocation(hint);
    if (location) {
      return `${location}:\n${body}`;
    }
    return body;
  }

  if (hint.target === 'new_module') {
    const moduleTitle = hint.newModuleTitle?.trim();
    return moduleTitle
      ? `Создай модуль «${moduleTitle}»:\n${body}`
      : `Создай новый модуль:\n${body}`;
  }

  const moduleTitle = hint.sectionTitle ?? hint.newModuleTitle;
  const lessonTitle = hint.lessonTitle?.trim();
  const modulePart = moduleTitle ? ` в модуле «${moduleTitle}»` : '';
  const lessonPart = lessonTitle ? `урок «${lessonTitle}»` : 'новый урок';
  return `Создай ${lessonPart}${modulePart}:\n${body}`;
}
