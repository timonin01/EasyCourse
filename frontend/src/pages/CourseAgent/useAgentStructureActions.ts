import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { lessonsApi, sectionsApi, stepsApi } from '../../api';
import { getStepTypeLabel } from '../../constants/stepTypeLabels';
import { extractApiErrorMessage } from '../../utils/apiError';
import type { CourseTreeSectionNode, CourseTreeSelection } from './types';
import type { StructureDeleteTarget } from './components/StructureDeleteModal';

interface UseAgentStructureActionsParams {
  sections: CourseTreeSectionNode[];
  selection: CourseTreeSelection | null;
  setSelection: (selection: CourseTreeSelection | null) => void;
  patchSection: (sectionId: number, updater: (section: CourseTreeSectionNode['section']) => CourseTreeSectionNode['section']) => void;
  patchLesson: (lessonId: number, updater: (lesson: CourseTreeSectionNode['lessons'][number]['lesson']) => CourseTreeSectionNode['lessons'][number]['lesson']) => void;
  removeSection: (sectionId: number) => void;
  removeLesson: (lessonId: number) => void;
  removeStep: (stepId: number) => void;
  reorderSections: (ordered: CourseTreeSectionNode['section'][]) => void;
  reorderLessons: (sectionId: number, ordered: CourseTreeSectionNode['lessons'][number]['lesson'][]) => void;
  reorderSteps: (lessonId: number, ordered: NonNullable<CourseTreeSectionNode['lessons'][number]['steps']>) => void;
  reloadStructure: () => Promise<void>;
  onStepRemoved?: (stepId: number) => void;
}

function countLessonSteps(sections: CourseTreeSectionNode[], lessonId: number): number {
  for (const sectionNode of sections) {
    const lessonNode = sectionNode.lessons.find((item) => item.lesson.id === lessonId);
    if (lessonNode) {
      return lessonNode.steps?.length ?? 0;
    }
  }
  return 0;
}

function countSectionChildren(sections: CourseTreeSectionNode[], sectionId: number): { lessons: number; steps: number } {
  const sectionNode = sections.find((item) => item.section.id === sectionId);
  if (!sectionNode) return { lessons: 0, steps: 0 };
  const lessons = sectionNode.lessons.length;
  const steps = sectionNode.lessons.reduce((sum, lessonNode) => sum + (lessonNode.steps?.length ?? 0), 0);
  return { lessons, steps };
}

export function useAgentStructureActions({
  sections,
  selection,
  setSelection,
  patchSection,
  patchLesson,
  removeSection,
  removeLesson,
  removeStep,
  reorderSections,
  reorderLessons,
  reorderSteps,
  reloadStructure,
  onStepRemoved,
}: UseAgentStructureActionsParams) {
  const [renameTarget, setRenameTarget] = useState<
    | { type: 'section'; id: number; title: string }
    | { type: 'lesson'; id: number; title: string }
    | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<StructureDeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

  const markBusy = (id: number, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const clearSelectionIfMatches = useCallback((type: CourseTreeSelection['type'], id: number) => {
    if (selection?.type === type && selection.id === id) {
      setSelection(null);
    }
    if (type === 'section' && selection) {
      const sectionNode = sections.find((item) => item.section.id === id);
      if (!sectionNode) return;
      if (selection.type === 'lesson' && sectionNode.lessons.some((l) => l.lesson.id === selection.id)) {
        setSelection(null);
      }
      if (selection.type === 'step' && sectionNode.lessons.some((l) => l.steps?.some((s) => s.id === selection.id))) {
        setSelection(null);
      }
    }
    if (type === 'lesson' && selection?.type === 'step') {
      for (const sectionNode of sections) {
        const lessonNode = sectionNode.lessons.find((item) => item.lesson.id === id);
        if (lessonNode?.steps?.some((step) => step.id === selection.id)) {
          setSelection(null);
          break;
        }
      }
    }
  }, [sections, selection, setSelection]);

  const openRenameSection = useCallback((sectionId: number) => {
    const sectionNode = sections.find((item) => item.section.id === sectionId);
    if (!sectionNode) return;
    setRenameTarget({ type: 'section', id: sectionId, title: sectionNode.section.title });
  }, [sections]);

  const openRenameLesson = useCallback((lessonId: number) => {
    for (const sectionNode of sections) {
      const lessonNode = sectionNode.lessons.find((item) => item.lesson.id === lessonId);
      if (lessonNode) {
        setRenameTarget({ type: 'lesson', id: lessonId, title: lessonNode.lesson.title });
        return;
      }
    }
  }, [sections]);

  const saveRename = useCallback(async (title: string) => {
    if (!renameTarget) return;
    if (renameTarget.type === 'section') {
      const updated = await sectionsApi.updateSection({ sectionId: renameTarget.id, title });
      patchSection(renameTarget.id, () => updated);
      toast.success('Название модуля обновлено');
      return;
    }
    const updated = await lessonsApi.updateLesson({ lessonId: renameTarget.id, title });
    patchLesson(renameTarget.id, () => updated);
    toast.success('Название урока обновлено');
  }, [patchLesson, patchSection, renameTarget]);

  const openDeleteSection = useCallback((sectionId: number) => {
    const sectionNode = sections.find((item) => item.section.id === sectionId);
    if (!sectionNode) return;
    const children = countSectionChildren(sections, sectionId);
    setDeleteTarget({
      type: 'section',
      id: sectionId,
      title: sectionNode.section.title,
      synced: !!sectionNode.section.stepikSectionId,
      lessonCount: children.lessons,
      stepCount: children.steps,
    });
  }, [sections]);

  const openDeleteLesson = useCallback((lessonId: number) => {
    for (const sectionNode of sections) {
      const lessonNode = sectionNode.lessons.find((item) => item.lesson.id === lessonId);
      if (lessonNode) {
        setDeleteTarget({
          type: 'lesson',
          id: lessonId,
          title: lessonNode.lesson.title,
          synced: !!lessonNode.lesson.stepikLessonId,
          stepCount: countLessonSteps(sections, lessonId),
        });
        return;
      }
    }
  }, [sections]);

  const openDeleteStep = useCallback((stepId: number) => {
    for (const sectionNode of sections) {
      for (const lessonNode of sectionNode.lessons) {
        const step = lessonNode.steps?.find((item) => item.id === stepId);
        if (step) {
          setDeleteTarget({
            type: 'step',
            id: stepId,
            title: `${step.position}. ${getStepTypeLabel(step.type.toLowerCase())}`,
            synced: !!step.stepikStepId,
          });
          return;
        }
      }
    }
  }, [sections]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    markBusy(deleteTarget.id, true);
    try {
      if (deleteTarget.type === 'section') {
        if (deleteTarget.synced) {
          await sectionsApi.deleteSectionFromStepik(deleteTarget.id);
        }
        await sectionsApi.deleteSection(deleteTarget.id);
        clearSelectionIfMatches('section', deleteTarget.id);
        removeSection(deleteTarget.id);
        toast.success('Модуль удалён');
      } else if (deleteTarget.type === 'lesson') {
        if (deleteTarget.synced) {
          await lessonsApi.deleteLessonFromStepik(deleteTarget.id);
        }
        await lessonsApi.deleteLesson(deleteTarget.id);
        clearSelectionIfMatches('lesson', deleteTarget.id);
        removeLesson(deleteTarget.id);
        toast.success('Урок удалён');
      } else {
        if (deleteTarget.synced) {
          await stepsApi.deleteStepFromStepik(deleteTarget.id);
        }
        await stepsApi.deleteStep(deleteTarget.id);
        clearSelectionIfMatches('step', deleteTarget.id);
        removeStep(deleteTarget.id);
        onStepRemoved?.(deleteTarget.id);
        toast.success('Шаг удалён');
      }
      setDeleteTarget(null);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось удалить'));
      console.error('Failed to delete structure entity:', error);
    } finally {
      setIsDeleting(false);
      markBusy(deleteTarget.id, false);
    }
  }, [
    clearSelectionIfMatches,
    deleteTarget,
    onStepRemoved,
    removeLesson,
    removeSection,
    removeStep,
  ]);

  const persistSectionOrder = useCallback(async (ordered: CourseTreeSectionNode['section'][]) => {
    const previous = sections.map((node) => node.section);
    const changed = ordered.some((section, index) => section.id !== previous[index]?.id);
    if (!changed) return;

    reorderSections(ordered);
    try {
      await Promise.all(
        ordered.map((section, position) =>
          sectionsApi.updateSection({ sectionId: section.id, position: position + 1 }),
        ),
      );
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось изменить порядок модулей'));
      await reloadStructure();
    }
  }, [reloadStructure, reorderSections, sections]);

  const persistLessonOrder = useCallback(async (
    sectionId: number,
    ordered: CourseTreeSectionNode['lessons'][number]['lesson'][],
  ) => {
    const sectionNode = sections.find((node) => node.section.id === sectionId);
    const previous = sectionNode?.lessons.map((node) => node.lesson) ?? [];
    const changed = ordered.some((lesson, index) => lesson.id !== previous[index]?.id);
    if (!changed) return;

    reorderLessons(sectionId, ordered);
    try {
      await Promise.all(
        ordered.map((lesson, position) =>
          lessonsApi.updateLesson({ lessonId: lesson.id, position: position + 1 }),
        ),
      );
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось изменить порядок уроков'));
      await reloadStructure();
    }
  }, [reloadStructure, reorderLessons, sections]);

  const persistStepOrder = useCallback(async (
    lessonId: number,
    ordered: NonNullable<CourseTreeSectionNode['lessons'][number]['steps']>,
  ) => {
    let previous: NonNullable<CourseTreeSectionNode['lessons'][number]['steps']> = [];
    for (const sectionNode of sections) {
      const lessonNode = sectionNode.lessons.find((node) => node.lesson.id === lessonId);
      if (lessonNode?.steps) {
        previous = lessonNode.steps;
        break;
      }
    }
    const changed = ordered.some((step, index) => step.id !== previous[index]?.id);
    if (!changed) return;

    reorderSteps(lessonId, ordered);
    try {
      await Promise.all(
        ordered.map((step, position) =>
          stepsApi.updateStep({ stepId: step.id, position: position + 1 }),
        ),
      );
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось изменить порядок шагов'));
      await reloadStructure();
    }
  }, [reloadStructure, reorderSteps, sections]);

  return {
    renameTarget,
    setRenameTarget,
    saveRename,
    openRenameSection,
    openRenameLesson,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    busyIds,
    openDeleteSection,
    openDeleteLesson,
    openDeleteStep,
    confirmDelete,
    persistSectionOrder,
    persistLessonOrder,
    persistStepOrder,
  };
}
