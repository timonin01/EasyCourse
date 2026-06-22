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
  /^(?:#{1,4}\s*)?(?!.*\[НОВЫЙ\])Модуль\s+(\d+)\s*[«"]([^»"]+)[»"]\s*→\s*Урок\s+(\d+)\s*[«"]([^»"]+)[»"]/i;
const NEW_LESSON_IN_MODULE_RE =
  /^(?:#{1,4}\s*)?\[НОВЫЙ\]\s*Модуль\s+(\d+)\s*[«"]([^»"]+)[»"]\s*→\s*Урок:\s*[«"]?([^»"\n]+)[»"]?/i;
const NEW_MODULE_RE = /^(?:#{1,4}\s*)?\[НОВЫЙ\]\s*Модуль:\s*[«"]?([^»"\n]+)[»"]?/i;
const NEW_LESSON_IN_NEW_MODULE_RE =
  /^(?:#{1,5}\s*)?\[НОВЫЙ\]\s*Урок\s+(\d+):\s*[«"]?([^»"\n]+)[»"]?/i;
const QUOTED_HINT_RE = /^\s*[-*•]\s+[«"]([^»"]+)[»"]/;
const QUOTED_HINT_ALT_RE = /^\s*[-*•]\s+"([^"]+)"/;
const CREAT_HINT_RE = /^\s*[-*•]\s+(.*Создай.+)$/i;
const STRUCTURE_STEP_RE = /^\s*(?:[-*•]\s*)?\[([A-Za-z][A-Za-z0-9-]*)\]\s*(.+)$/;

const STEP_TYPE_ALIASES: Record<string, string> = {
  TEXT: 'text',
  CHOICE: 'choice',
  CODE: 'code',
  MATCHING: 'matching',
  SORTING: 'sorting',
  TABLE: 'table',
  'FILL-BLANKS': 'fill-blanks',
  FILL_BLANKS: 'fill-blanks',
  STRING: 'string',
  NUMBER: 'number',
  MATH: 'math',
  'FREE-ANSWER': 'free-answer',
  FREE_ANSWER: 'free-answer',
  'RANDOM-TASKS': 'random-tasks',
  RANDOM_TASKS: 'random-tasks',
};

const BATCH_STEP_TYPES = new Set(Object.values(STEP_TYPE_ALIASES));

export function structureStepToBatchPrompt(stepType: string, description: string): string | null {
  const normalizedType = stepType.trim().toUpperCase().replace(/_/g, '-');
  const batchType = STEP_TYPE_ALIASES[normalizedType];
  if (!batchType) return null;

  const body = description.trim().replace(/[.;]\s*$/, '');
  if (!body) return null;

  return `Создай 1 ${batchType}: ${body}`;
}

export function isBatchStepType(type: string): boolean {
  const normalizedType = type.trim().toUpperCase().replace(/_/g, '-');
  return BATCH_STEP_TYPES.has(STEP_TYPE_ALIASES[normalizedType] ?? '');
}

interface ParseContext {
  sectionTitle?: string;
  sectionPosition?: number;
  lessonPosition?: number;
  lessonTitle?: string;
  newModuleTitle?: string;
  target: AuditHintTarget;
  structureStepCount: number;
}

function resetLessonContext(ctx: ParseContext, patch: Partial<ParseContext>): ParseContext {
  return {
    ...ctx,
    ...patch,
    structureStepCount: 0,
  };
}

function pushHint(
  hints: AuditBatchHint[],
  ctx: ParseContext,
  prompt: string,
  lessons: CourseLessonContext[]
): void {
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

export function parseCourseAuditHints(
  markdown: string,
  lessons: CourseLessonContext[]
): AuditBatchHint[] {
  const hints: AuditBatchHint[] = [];
  let ctx: ParseContext = { target: 'existing', structureStepCount: 0 };

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^batch-подсказки\s*:?\s*$/i.test(line)) {
      continue;
    }

    const newModuleMatch = line.match(NEW_MODULE_RE);
    if (newModuleMatch) {
      ctx = resetLessonContext(ctx, {
        target: 'new_module',
        newModuleTitle: newModuleMatch[1].trim(),
        sectionTitle: undefined,
        sectionPosition: undefined,
        lessonPosition: undefined,
        lessonTitle: undefined,
      });
      continue;
    }

    const newLessonMatch = line.match(NEW_LESSON_IN_MODULE_RE);
    if (newLessonMatch) {
      ctx = resetLessonContext(ctx, {
        target: 'new_lesson',
        sectionPosition: Number.parseInt(newLessonMatch[1], 10),
        sectionTitle: newLessonMatch[2].trim(),
        lessonTitle: newLessonMatch[3].trim(),
        lessonPosition: undefined,
        newModuleTitle: undefined,
      });
      continue;
    }

    const newLessonInNewModuleMatch = line.match(NEW_LESSON_IN_NEW_MODULE_RE);
    if (newLessonInNewModuleMatch) {
      ctx = resetLessonContext(ctx, {
        target: 'new_lesson',
        lessonPosition: Number.parseInt(newLessonInNewModuleMatch[1], 10),
        lessonTitle: newLessonInNewModuleMatch[2].trim(),
        sectionTitle: ctx.newModuleTitle,
        sectionPosition: undefined,
        newModuleTitle: ctx.newModuleTitle,
      });
      continue;
    }

    const existingMatch = line.match(EXISTING_LESSON_RE);
    if (existingMatch) {
      ctx = resetLessonContext(ctx, {
        target: 'existing',
        sectionPosition: Number.parseInt(existingMatch[1], 10),
        sectionTitle: existingMatch[2].trim(),
        lessonPosition: Number.parseInt(existingMatch[3], 10),
        lessonTitle: existingMatch[4].trim(),
        newModuleTitle: undefined,
      });
      continue;
    }

    const structureMatch = line.match(STRUCTURE_STEP_RE);
    if (structureMatch && isBatchStepType(structureMatch[1])) {
      const prompt = structureStepToBatchPrompt(structureMatch[1], structureMatch[2]);
      if (prompt) {
        ctx = { ...ctx, structureStepCount: ctx.structureStepCount + 1 };
        pushHint(hints, ctx, prompt, lessons);
      }
      continue;
    }

    const quotedMatch = line.match(QUOTED_HINT_RE) ?? line.match(QUOTED_HINT_ALT_RE);
    const creatMatch = !quotedMatch ? line.match(CREAT_HINT_RE) : null;
    const prompt = quotedMatch?.[1] ?? creatMatch?.[1]?.trim();

    if (!prompt || !looksLikeBatchHint(prompt)) {
      continue;
    }

    if (ctx.structureStepCount > 0) {
      continue;
    }

    pushHint(hints, ctx, prompt, lessons);
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

  if (hint.newModuleTitle && hint.target === 'new_lesson' && !hint.sectionPosition) {
    parts.push(`[Новый модуль] «${hint.newModuleTitle}»`);
  } else if (hint.sectionTitle) {
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

export function getHintLessonKey(hint: AuditBatchHint): string {
  if (hint.target === 'new_module') {
    return `new_module:${hint.newModuleTitle ?? ''}`;
  }
  if (hint.target === 'new_lesson') {
    if (hint.newModuleTitle) {
      return `new_lesson:module:${hint.newModuleTitle}:${hint.lessonPosition ?? ''}:${hint.lessonTitle ?? ''}`;
    }
    return `new_lesson:${hint.sectionPosition ?? ''}:${hint.sectionTitle ?? ''}:${hint.lessonTitle ?? ''}`;
  }
  if (hint.suggestedLessonId != null) {
    return `existing:lesson:${hint.suggestedLessonId}`;
  }
  return `existing:${hint.sectionPosition ?? ''}:${hint.lessonPosition ?? ''}:${hint.sectionTitle ?? ''}:${hint.lessonTitle ?? ''}`;
}

export interface MergedAuditHintGroup {
  hint: AuditBatchHint;
  prompts: string[];
}

function mergeHintsByLesson(hints: AuditBatchHint[]): MergedAuditHintGroup[] {
  const groups = new Map<string, MergedAuditHintGroup>();
  const order: string[] = [];

  for (const hint of hints) {
    const key = getHintLessonKey(hint);
    const existing = groups.get(key);
    if (existing) {
      existing.prompts.push(hint.prompt);
    } else {
      groups.set(key, { hint, prompts: [hint.prompt] });
      order.push(key);
    }
  }

  return order.map((key) => groups.get(key)!);
}

export function groupAuditHints(hints: AuditBatchHint[]): {
  existing: MergedAuditHintGroup[];
  newContent: MergedAuditHintGroup[];
} {
  const existing: AuditBatchHint[] = [];
  const newContent: AuditBatchHint[] = [];

  for (const hint of hints) {
    if (hint.target === 'existing') {
      existing.push(hint);
    } else {
      newContent.push(hint);
    }
  }

  return {
    existing: mergeHintsByLesson(existing),
    newContent: mergeHintsByLesson(newContent),
  };
}
