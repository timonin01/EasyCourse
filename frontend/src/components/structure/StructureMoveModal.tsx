import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from '../ui';

export type StructureMoveTarget =
  | {
      type: 'step';
      sourceStepId: number;
      sourceTitle: string;
      sourceLessonTitle: string;
      targetLessonId: number;
      targetLessonTitle: string;
      synced: boolean;
    }
  | {
      type: 'lesson';
      sourceLessonId: number;
      sourceTitle: string;
      sourceSectionTitle: string;
      targetSectionId: number;
      targetSectionTitle: string;
      synced: boolean;
      stepCount: number;
    };

interface StructureMoveModalProps {
  target: StructureMoveTarget | null;
  isMoving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function describeTarget(target: StructureMoveTarget): { headline: string; details: string[] } {
  if (target.type === 'step') {
    const details = [
      `Из урока «${target.sourceLessonTitle}» в урок «${target.targetLessonTitle}».`,
      'Исходный шаг будет удалён; в целевом уроке появится копия в конце списка.',
      'Новый шаг не синхронизируется со Stepik автоматически.',
    ];
    if (target.synced) {
      details.push('Исходный шаг синхронизирован со Stepik — он будет удалён и с платформы.');
    }
    return {
      headline: `Переместить шаг «${target.sourceTitle}»?`,
      details,
    };
  }

  const details = [
    `Из модуля «${target.sourceSectionTitle}» в модуль «${target.targetSectionTitle}».`,
    'Исходный урок будет удалён; копия со шагами появится в конце целевого модуля.',
    'Новый урок не синхронизируется со Stepik автоматически.',
  ];
  if (target.stepCount > 0) {
    details.push(`Вместе с уроком переносятся ${target.stepCount} шаг.`);
  }
  if (target.synced) {
    details.push('Урок синхронизирован со Stepik — исходник (и шаги на Stepik) будет удалён с платформы.');
  }
  return {
    headline: `Переместить урок «${target.sourceTitle}»?`,
    details,
  };
}

export function StructureMoveModal({
  target,
  isMoving,
  onClose,
  onConfirm,
}: StructureMoveModalProps) {
  if (!target) return null;

  const { headline, details } = describeTarget(target);

  return (
    <Modal
      isOpen={!!target}
      onClose={isMoving ? () => undefined : onClose}
      title="Перемещение"
      icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isMoving}>
            Отмена
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} isLoading={isMoving}>
            Переместить
          </Button>
        </div>
      }
    >
      <div className="space-y-2 text-sm text-dark-300">
        <p className="font-medium text-dark-100">{headline}</p>
        {details.map((line) => (
          <p
            key={line}
            className={line.includes('Stepik') ? 'text-amber-300/90' : undefined}
          >
            {line}
          </p>
        ))}
      </div>
    </Modal>
  );
}
