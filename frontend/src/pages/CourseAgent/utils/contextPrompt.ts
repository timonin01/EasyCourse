import type { CourseTreeSelection, CourseTreeSectionNode } from '../types';
import { getStepTypeLabel } from '../../../constants/stepTypeLabels';

const PATH_SEP = ' › ';

function quote(title: string): string {
  return `«${title}»`;
}

/**
 * Path-style mention for chat context (variant B).
 * Neutral — no "исправь/удали", user adds the instruction themselves.
 *
 * Examples:
 *   Модуль «Основы»
 *   Модуль «Основы» › Урок «Циклы»
 *   Модуль «Основы» › Урок «Циклы» › Шаг 3 (Теория)
 */
export function buildContextPrompt(
  selection: CourseTreeSelection,
  sections: CourseTreeSectionNode[],
): string {
  for (const sectionNode of sections) {
    const sectionPart = `Модуль ${quote(sectionNode.section.title)}`;

    if (selection.type === 'section' && sectionNode.section.id === selection.id) {
      return sectionPart;
    }

    for (const lessonNode of sectionNode.lessons) {
      const lessonPart = `Урок ${quote(lessonNode.lesson.title)}`;

      if (selection.type === 'lesson' && lessonNode.lesson.id === selection.id) {
        return [sectionPart, lessonPart].join(PATH_SEP);
      }

      for (const step of lessonNode.steps ?? []) {
        if (selection.type === 'step' && step.id === selection.id) {
          const typeLabel = getStepTypeLabel(step.type.toLowerCase());
          const stepPart = `Шаг ${step.position} (${typeLabel})`;
          return [sectionPart, lessonPart, stepPart].join(PATH_SEP);
        }
      }
    }
  }

  if (selection.type === 'step') {
    return `Шаг (id ${selection.id})`;
  }

  return '';
}
