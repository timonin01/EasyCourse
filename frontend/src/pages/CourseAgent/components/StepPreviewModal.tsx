import { Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { StepView } from '../../../components/StepView';
import { getStepTypeLabel } from '../../../constants/stepTypeLabels';
import type { Step } from '../../../types';

interface StepPreviewModalProps {
  isOpen: boolean;
  step: Step | null;
  isLoading: boolean;
  lessonTitle?: string;
  sectionTitle?: string;
  onClose: () => void;
  onAddToChat?: () => void;
}

export function StepPreviewModal({
  isOpen,
  step,
  isLoading,
  lessonTitle,
  sectionTitle,
  onClose,
  onAddToChat,
}: StepPreviewModalProps) {
  const breadcrumb = [sectionTitle, lessonTitle].filter(Boolean).join(' · ');
  const title = step
    ? `Шаг ${step.position} · ${getStepTypeLabel(step.type.toLowerCase())}`
    : 'Содержимое шага';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isLoading ? 'Загрузка шага…' : title}
      subtitle={!isLoading && breadcrumb ? breadcrumb : undefined}
      size="lg"
      footer={
        onAddToChat && step && !isLoading ? (
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onAddToChat}>
              Добавить в контекст чата
            </Button>
          </div>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-dark-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Загрузка содержимого…
        </div>
      ) : step ? (
        <StepView step={step} variant="preview" />
      ) : null}
    </Modal>
  );
}
