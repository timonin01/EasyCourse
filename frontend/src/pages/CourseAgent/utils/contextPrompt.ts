import type { CourseTreeSelection, CourseTreeSectionNode } from '../types';
import { getStepTypeLabel } from '../../../constants/stepTypeLabels';

export function buildContextPrompt(
  selection: CourseTreeSelection,
  sections: CourseTreeSectionNode[],
): string {
  for (const sectionNode of sections) {
    if (selection.type === 'section' && sectionNode.section.id === selection.id) {
      return `Для модуля «${sectionNode.section.title}»:`;
    }

    for (const lessonNode of sectionNode.lessons) {
      if (selection.type === 'lesson' && lessonNode.lesson.id === selection.id) {
        return `Для урока «${lessonNode.lesson.title}» в модуле «${sectionNode.section.title}»:`;
      }

      for (const step of lessonNode.steps ?? []) {
        if (selection.type === 'step' && step.id === selection.id) {
          return `Исправь шаг ${step.position} (${getStepTypeLabel(step.type.toLowerCase())}) в уроке «${lessonNode.lesson.title}»:`;
        }
      }
    }
  }

  if (selection.type === 'step') {
    return `Исправь шаг (id ${selection.id}):`;
  }

  return '';
}
