import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from '../../../components/ui';

export type StructureDeleteTarget =
  | { type: 'section'; id: number; title: string; synced: boolean; lessonCount: number; stepCount: number }
  | { type: 'lesson'; id: number; title: string; synced: boolean; stepCount: number }
  | { type: 'step'; id: number; title: string; synced: boolean };

interface StructureDeleteModalProps {
  target: StructureDeleteTarget | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function describeTarget(target: StructureDeleteTarget): { headline: string; details: string[] } {
  if (target.type === 'section') {
    const details: string[] = [];
    if (target.lessonCount > 0 || target.stepCount > 0) {
      details.push(
        `Каскадно будут удалены: ${target.lessonCount} урок., ${target.stepCount} шаг.`,
      );
    }
    if (target.synced) {
      details.push('Модуль синхронизирован со Stepik — удаление затронет и платформу.');
    }
    return {
      headline: `Удалить модуль «${target.title}»?`,
      details,
    };
  }

  if (target.type === 'lesson') {
    const details: string[] = [];
    if (target.stepCount > 0) {
      details.push(`Каскадно будут удалены: ${target.stepCount} шаг.`);
    }
    if (target.synced) {
      details.push('Урок синхронизирован со Stepik — удаление затронет и платформу.');
    }
    return {
      headline: `Удалить урок «${target.title}»?`,
      details,
    };
  }

  return {
    headline: `Удалить шаг «${target.title}»?`,
    details: target.synced
      ? ['Шаг синхронизирован со Stepik — удаление затронет и платформу.']
      : [],
  };
}

export function StructureDeleteModal({
  target,
  isDeleting,
  onClose,
  onConfirm,
}: StructureDeleteModalProps) {
  if (!target) return null;

  const { headline, details } = describeTarget(target);

  return (
    <Modal
      isOpen={!!target}
      onClose={isDeleting ? () => undefined : onClose}
      title="Удаление"
      icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isDeleting}>
            Отмена
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} isLoading={isDeleting}>
            Удалить навсегда
          </Button>
        </div>
      }
    >
      <div className="space-y-2 text-sm text-dark-300">
        <p className="font-medium text-dark-100">{headline}</p>
        <p>Действие необратимо. Сущность будет удалена из EasyCourse.</p>
        {details.map((line) => (
          <p key={line} className="text-amber-300/90">{line}</p>
        ))}
      </div>
    </Modal>
  );
}
