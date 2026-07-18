import { useMemo, useState } from 'react';
import { FolderInput } from 'lucide-react';
import { Modal, Button, Select } from '../ui';
import type { Lesson, Model } from '../../types';

export type StructureMovePickerTarget =
  | {
      type: 'step';
      sourceStepId: number;
      sourceTitle: string;
      sourceLessonId: number;
      sourceLessonTitle: string;
      synced: boolean;
    }
  | {
      type: 'lesson';
      sourceLessonId: number;
      sourceTitle: string;
      sourceSectionId: number;
      sourceSectionTitle: string;
      synced: boolean;
      stepCount: number;
    };

interface LessonOption {
  lesson: Lesson;
  sectionTitle: string;
}

interface StructureMovePickerModalProps {
  target: StructureMovePickerTarget | null;
  sections: Model[];
  /** Lessons grouped for step picker (may include other sections). */
  lessonOptions: LessonOption[];
  isLoadingOptions?: boolean;
  onClose: () => void;
  onPickStepTarget: (targetLessonId: number, targetLessonTitle: string) => void;
  onPickLessonTarget: (targetSectionId: number, targetSectionTitle: string) => void;
}

export function StructureMovePickerModal({
  target,
  sections,
  lessonOptions,
  isLoadingOptions = false,
  onClose,
  onPickStepTarget,
  onPickLessonTarget,
}: StructureMovePickerModalProps) {
  const [selectedId, setSelectedId] = useState('');

  const options = useMemo(() => {
    if (!target) return [];
    if (target.type === 'step') {
      return lessonOptions
        .filter((item) => item.lesson.id !== target.sourceLessonId)
        .map((item) => ({
          value: String(item.lesson.id),
          label: `${item.sectionTitle} → ${item.lesson.title}`,
        }));
    }
    return sections
      .filter((section) => section.id !== target.sourceSectionId)
      .map((section) => ({
        value: String(section.id),
        label: section.title,
      }));
  }, [lessonOptions, sections, target]);

  if (!target) return null;

  const pickerKey = target.type === 'step'
    ? `step-${target.sourceStepId}`
    : `lesson-${target.sourceLessonId}`;

  const handleConfirm = () => {
    const id = Number(selectedId);
    if (!id) return;
    if (target.type === 'step') {
      const option = lessonOptions.find((item) => item.lesson.id === id);
      if (!option) return;
      onPickStepTarget(option.lesson.id, option.lesson.title);
      setSelectedId('');
      return;
    }
    const section = sections.find((item) => item.id === id);
    if (!section) return;
    onPickLessonTarget(section.id, section.title);
    setSelectedId('');
  };

  return (
    <Modal
      key={pickerKey}
      isOpen={!!target}
      onClose={onClose}
      title={target.type === 'step' ? 'Переместить шаг' : 'Переместить урок'}
      icon={<FolderInput className="h-5 w-5 text-primary-400" />}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedId('');
              onClose();
            }}
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedId || isLoadingOptions || options.length === 0}
            onClick={handleConfirm}
          >
            Далее
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-sm text-dark-300">
        <p className="font-medium text-dark-100">
          {target.type === 'step'
            ? `Куда переместить «${target.sourceTitle}»?`
            : `Куда переместить урок «${target.sourceTitle}»?`}
        </p>
        {isLoadingOptions ? (
          <p className="text-dark-500">Загрузка списка…</p>
        ) : options.length === 0 ? (
          <p className="text-dark-500">
            {target.type === 'step'
              ? 'Нет других уроков для перемещения.'
              : 'Нет других модулей для перемещения.'}
          </p>
        ) : (
          <Select
            label={target.type === 'step' ? 'Целевой урок' : 'Целевой модуль'}
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            options={[
              { value: '', label: 'Выберите…' },
              ...options,
            ]}
          />
        )}
      </div>
    </Modal>
  );
}
