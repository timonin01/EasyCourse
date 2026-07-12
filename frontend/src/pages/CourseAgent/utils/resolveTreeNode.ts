import type { CourseTreeSectionNode, CourseTreeSelection } from '../types';

export function resolveTreeNode(
  selection: CourseTreeSelection,
  sections: CourseTreeSectionNode[],
): { sectionTitle?: string; lessonTitle?: string } {
  for (const sectionNode of sections) {
    if (selection.type === 'section' && sectionNode.section.id === selection.id) {
      return { sectionTitle: sectionNode.section.title };
    }

    for (const lessonNode of sectionNode.lessons) {
      if (selection.type === 'lesson' && lessonNode.lesson.id === selection.id) {
        return {
          sectionTitle: sectionNode.section.title,
          lessonTitle: lessonNode.lesson.title,
        };
      }

      for (const step of lessonNode.steps ?? []) {
        if (selection.type === 'step' && step.id === selection.id) {
          return {
            sectionTitle: sectionNode.section.title,
            lessonTitle: lessonNode.lesson.title,
          };
        }
      }
    }
  }

  return {};
}
