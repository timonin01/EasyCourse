export interface CourseLessonContext {
  id: number;
  title: string;
  position: number;
  sectionTitle: string;
  sectionPosition?: number;
  courseTitle: string;
}

export type AuditHintTarget = 'existing' | 'new_lesson' | 'new_module';

export interface AuditBatchHint {
  sectionTitle?: string;
  sectionPosition?: number;
  lessonPosition?: number;
  lessonTitle?: string;
  newModuleTitle?: string;
  target: AuditHintTarget;
  prompt: string;
  suggestedLessonId: number | null;
}

const EXISTING_LESSON_RE =
  /^#{1,4}\s*(?!.*\[НОВЫЙ\])Модуль\s+(\d+)\s*[«"]([^»"]+)[»"]\s*→\s*Урок\s+(\d+)\s*[«"]([^»"]+)[»"]/i;
const NEW_LESSON_IN_MODULE_RE =
  /^#{1,4}\s*\[НОВЫЙ\]\s*Модуль\s+(\d+)\s*[«"]([^»"]+)[»"]\s*→\s*Урок:\s*[«"]?([^»"\n]+)[»"]?/i;
const NEW_MODULE_RE = /^#{1,4}\s*\[НОВЫЙ\]\s*Модуль:\s*[«"]?([^»"\n]+)[»"]?/i;
const QUOTED_HINT_RE = /^\s*[-*•]\s+[«"]([^»"]+)[»"]/;
const QUOTED_HINT_ALT_RE = /^\s*[-*•]\s+"([^"]+)"/;
const CREAT_HINT_RE = /^\s*[-*•]\s+(.*Создай.+)$/i;

interface ParseContext {
  sectionTitle?: string;
  sectionPosition?: number;
  lessonPosition?: number;
  lessonTitle?: string;
  newModuleTitle?: string;
  target: AuditHintTarget;
}

export function parseCourseAuditHints(
  markdown: string,
  lessons: CourseLessonContext[]
): AuditBatchHint[] {
  const hints: AuditBatchHint[] = [];
  let ctx: ParseContext = { target: 'existing' };

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const newModuleMatch = line.match(NEW_MODULE_RE);
    if (newModuleMatch) {
      ctx = {
        target: 'new_module',
        newModuleTitle: newModuleMatch[1].trim(),
        sectionTitle: undefined,
        sectionPosition: undefined,
        lessonPosition: undefined,
        lessonTitle: undefined,
      };
      continue;
    }

    const newLessonMatch = line.match(NEW_LESSON_IN_MODULE_RE);
    if (newLessonMatch) {
      ctx = {
        target: 'new_lesson',
        sectionPosition: Number.parseInt(newLessonMatch[1], 10),
        sectionTitle: newLessonMatch[2].trim(),
        lessonTitle: newLessonMatch[3].trim(),
        lessonPosition: undefined,
        newModuleTitle: undefined,
      };
      continue;
    }

    const existingMatch = line.match(EXISTING_LESSON_RE);
    if (existingMatch) {
      ctx = {
        target: 'existing',
        sectionPosition: Number.parseInt(existingMatch[1], 10),
        sectionTitle: existingMatch[2].trim(),
        lessonPosition: Number.parseInt(existingMatch[3], 10),
        lessonTitle: existingMatch[4].trim(),
        newModuleTitle: undefined,
      };
      continue;
    }

    const quotedMatch = line.match(QUOTED_HINT_RE) ?? line.match(QUOTED_HINT_ALT_RE);
    const creatMatch = !quotedMatch ? line.match(CREAT_HINT_RE) : null;
    const prompt = quotedMatch?.[1] ?? creatMatch?.[1]?.trim();

    if (!prompt || !looksLikeBatchHint(prompt)) {
      continue;
    }

    const isNew = ctx.target === 'new_module' || ctx.target === 'new_lesson';

    hints.push({
      sectionTitle: ctx.sectionTitle,
      sectionPosition: ctx.sectionPosition,
      lessonPosition: ctx.lessonPosition,
      lessonTitle: ctx.lessonTitle,
      newModuleTitle: ctx.newModuleTitle,
      target: ctx.target,
      prompt,
      suggestedLessonId: isNew
        ? null
        : matchLessonId(
            lessons,
            ctx.sectionTitle,
            ctx.sectionPosition,
            ctx.lessonPosition,
            ctx.lessonTitle
          ),
    });
  }

  return hints;
}

function looksLikeBatchHint(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('создай') ||
    lower.includes('choice') ||
    lower.includes('code') ||
    lower.includes('text') ||
    lower.includes('тест') ||
    lower.includes('задач')
  );
}

function matchLessonId(
  lessons: CourseLessonContext[],
  sectionTitle?: string,
  sectionPosition?: number,
  lessonPosition?: number,
  lessonTitle?: string
): number | null {
  const normalizedTitle = lessonTitle?.trim();

  if (sectionTitle && normalizedTitle) {
    const bySectionAndTitle = lessons.find(
      (lesson) =>
        lesson.sectionTitle.trim().toLowerCase() === sectionTitle.trim().toLowerCase() &&
        lesson.title.trim().toLowerCase() === normalizedTitle.toLowerCase()
    );
    if (bySectionAndTitle) return bySectionAndTitle.id;
  }

  if (sectionPosition != null && lessonPosition != null && normalizedTitle) {
    const byPositionsAndTitle = lessons.find(
      (lesson) =>
        lesson.sectionPosition === sectionPosition &&
        lesson.position === lessonPosition &&
        lesson.title.trim().toLowerCase() === normalizedTitle.toLowerCase()
    );
    if (byPositionsAndTitle) return byPositionsAndTitle.id;
  }

  if (normalizedTitle) {
    const matches = lessons.filter(
      (lesson) => lesson.title.trim().toLowerCase() === normalizedTitle.toLowerCase()
    );
    if (matches.length === 1) return matches[0].id;
    if (sectionTitle && matches.length > 1) {
      const scoped = matches.find(
        (l) => l.sectionTitle.trim().toLowerCase() === sectionTitle.trim().toLowerCase()
      );
      if (scoped) return scoped.id;
    }
  }

  if (sectionTitle && lessonPosition != null) {
    const scoped = lessons.find(
      (lesson) =>
        lesson.sectionTitle.trim().toLowerCase() === sectionTitle.trim().toLowerCase() &&
        lesson.position === lessonPosition
    );
    if (scoped) return scoped.id;
  }

  return null;
}

export function formatHintLocation(hint: AuditBatchHint): string | null {
  if (hint.target === 'new_module' && hint.newModuleTitle) {
    return `[Новый модуль] «${hint.newModuleTitle}»`;
  }

  const parts: string[] = [];

  if (hint.target === 'new_lesson') {
    parts.push('[Новый урок]');
  }

  if (hint.sectionTitle) {
    parts.push(
      hint.sectionPosition != null
        ? `Модуль ${hint.sectionPosition} «${hint.sectionTitle}»`
        : `Модуль «${hint.sectionTitle}»`
    );
  }

  if (hint.lessonTitle) {
    parts.push(
      hint.lessonPosition != null
        ? `Урок ${hint.lessonPosition} «${hint.lessonTitle}»`
        : `«${hint.lessonTitle}»`
    );
  }

  return parts.length > 0 ? parts.join(' → ') : null;
}

export function groupAuditHints(hints: AuditBatchHint[]): {
  existing: Array<{ hint: AuditBatchHint; index: number }>;
  newContent: Array<{ hint: AuditBatchHint; index: number }>;
} {
  const existing: Array<{ hint: AuditBatchHint; index: number }> = [];
  const newContent: Array<{ hint: AuditBatchHint; index: number }> = [];

  hints.forEach((hint, index) => {
    if (hint.target === 'existing') {
      existing.push({ hint, index });
    } else {
      newContent.push({ hint, index });
    }
  });

  return { existing, newContent };
}
